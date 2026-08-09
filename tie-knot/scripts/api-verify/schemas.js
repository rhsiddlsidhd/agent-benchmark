const path = require("path");
const { z } = require("zod");
require("./register-loader");

// src/shared/schemas/response/*.schema.ts를 그대로 재사용한다 — 응답 shape의 source of
// truth는 앱 코드(src/shared/schemas)이지 이 스크립트가 아니다. Node 네이티브 TS strip
// (v22.6+)으로 개별 파일을 직접 import한다(배럴 index.ts는 타지 않는다 — config.ts
// side-effect나 request/ 스키마까지 끌려올 수 있어서 response/ 파일만 대상). response/
// 파일들이 `@/shared/utils` 같은 alias를 참조하는 경우(예: product.schema.ts)가 있어
// register-loader가 등록하는 alias-loader.mjs로 `@/` 별칭을 풀어준다.
const RESPONSE_SCHEMAS_DIR = path.join(__dirname, "../../src/shared/schemas/response");

async function loadDataSchemas() {
  const [auth, banks, coupleInfo, guestbook, kakaomap, premiumFeature, product, subway] =
    await Promise.all([
      import(path.join(RESPONSE_SCHEMAS_DIR, "auth.schema.ts")),
      import(path.join(RESPONSE_SCHEMAS_DIR, "banks.schema.ts")),
      import(path.join(RESPONSE_SCHEMAS_DIR, "coupleInfo.schema.ts")),
      import(path.join(RESPONSE_SCHEMAS_DIR, "guestbook.schema.ts")),
      import(path.join(RESPONSE_SCHEMAS_DIR, "kakaomap.schema.ts")),
      import(path.join(RESPONSE_SCHEMAS_DIR, "premiumFeature.schema.ts")),
      import(path.join(RESPONSE_SCHEMAS_DIR, "product.schema.ts")),
      import(path.join(RESPONSE_SCHEMAS_DIR, "subway.schema.ts")),
    ]);

  return {
    authSession: auth.authSessionResponseSchema,
    banks: banks.banksResponseSchema,
    coupleInfo: coupleInfo.coupleInfoResponseSchema,
    guestbookList: guestbook.guestbookListResponseSchema,
    kakaomap: kakaomap.kakaomapResponseSchema,
    premiumFeatures: premiumFeature.premiumFeaturesResponseSchema,
    products: product.productsResponseSchema,
    subwayStations: subway.subwayStationsResponseSchema,
    subwayLineInfo: subway.subwayStationLineInfoResponseSchema,
  };
}

// --- 공통 envelope (src/shared/types/error.ts: SuccessResponse / ErrorResponse) ---
// 이건 도메인 데이터가 아니라 이 스크립트가 검증할 "응답 봉투" 형태라 여기 둔다. 예전엔
// error.code(number)를 기대했는데 실제 ErrorPayload(src/shared/types/error.ts)엔 그런
// 필드가 없다 — body는 항상 { category, message, fieldErrors? }이고 category가
// ERROR_CATEGORIES(문자열 리터럴 유니온)다. couple-info 401 검증이 매번
// "error.code: Invalid input: expected number, received undefined"로 잡히던 게 이
// 드리프트 때문이었다(HTTP status 매핑과는 별개 문제) — src/shared/types/error.ts를
// 그대로 import해 실제 카테고리 목록에 맞춘다.
let errorEnvelopePromise;
function getErrorEnvelope() {
  if (!errorEnvelopePromise) {
    errorEnvelopePromise = import(
      path.join(__dirname, "../../src/shared/types/error.ts")
    ).then(({ ERROR_CATEGORIES }) =>
      z.object({
        success: z.literal(false),
        error: z.object({
          category: z.enum(ERROR_CATEGORIES),
          message: z.string(),
          fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
        }),
      }),
    );
  }
  return errorEnvelopePromise;
}

function successEnvelope(dataSchema) {
  return z.object({ success: z.literal(true), data: dataSchema });
}

// success:true/false가 discriminator라 z.union 대신 z.discriminatedUnion 사용(Zod 공식 권장 — 순차 시도하는
// z.union보다 discriminator 키로 바로 분기해서 더 정확하고 빠름).
async function envelopeFor(dataSchema) {
  const errorEnvelope = await getErrorEnvelope();
  return z.discriminatedUnion("success", [successEnvelope(dataSchema), errorEnvelope]);
}

module.exports = { loadDataSchemas, envelopeFor };
