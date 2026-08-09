const path = require("path");
const mongoose = require("mongoose");
const { SignJWT } = require("jose");

// 원래 puppeteer로 /login 폼을 실제 제출해 세션 쿠키를 받아오던 로직(get-auth-cookie.js)이
// 커밋 0edbf12("lighthouse-audit를 tie-knot 밖 독립 디렉토리로 분리")에서 puppeteer와 함께
// 삭제됐는데, 이 스크립트(api-verify, 하루 먼저 추가됨)의 require는 갱신되지 않고 방치돼
// 매번 MODULE_NOT_FOUND로 조용히 실패하고 있었다. puppeteer를 다시 끌어오면 그 분리 이유
// (무관한 워크플로우까지 Chromium 다운로드를 떠안는 문제)가 재발하므로, 여기선 브라우저 로그인
// 대신 loginUser 서버 액션(src/server/actions/loginUser.ts)이 만드는 세션 쿠키를 DB에서
// 직접 재현한다 — 이 스크립트는 이미 .env의 TEST_USER_EMAIL을 신뢰하는 전제라 비밀번호 대조는
// 생략, id/role만 조회해 동일한 REFRESH JWT를 서명한다.
//
// src/server/lib/jose/encrypt.ts를 직접 import하지 않는 이유: 그 파일이 import하는
// `./type`이 `UserRole`을 `@/server/models`(배럴)에서 가져오는데, 그 배럴은
// product.model.ts 등 무관한 모델까지 전부 재-export해 이 스크립트가 못 푸는 연쇄
// import(barrel eval)로 번진다(alias-loader.mjs가 다루는 건 `@/` 경로 치환뿐, 배럴이
// 실제로 실행하는 전체 재-export 그래프까지는 아니다). UserModel처럼 배럴을 거치지 않고
// 파일을 직접 import하면 되지만, encrypt.ts 자체는 그 경로가 없어 최소 로직만 재현한다
// — REFRESH 타입 payload/만료(7d)가 바뀌면 이쪽도 맞춰 갱신해야 한다.
async function getCookieHeader(role) {
  if (role !== "user") {
    throw new Error(`getCookieHeader: 지원하지 않는 role "${role}" (현재 "user"만 지원)`);
  }

  const email = process.env.TEST_USER_EMAIL;
  if (!email) throw new Error("TEST_USER_EMAIL 환경변수가 필요합니다.");

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error("JWT_SECRET 환경변수가 필요합니다.");

  const { dbConnect } = await import(
    path.join(__dirname, "../../src/server/lib/mongodb/connect.ts")
  );
  const { UserModel } = await import(
    path.join(__dirname, "../../src/server/models/user.model.ts")
  );

  await dbConnect();
  try {
    const user = await UserModel.findOne({ email, isDelete: false }).lean();
    if (!user) {
      throw new Error(`TEST_USER_EMAIL(${email}) 계정을 DB에서 찾지 못함`);
    }

    const token = await new SignJWT({ id: user._id.toString(), role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(jwtSecret));

    return `token=${token}`;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

module.exports = { getCookieHeader };
