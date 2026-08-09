const puppeteer = require("puppeteer");
const { issueEntryCookie, loginAsRole } = require("./login");

/**
 * 'entry' | 'user' | 'admin' 롤에 맞는 쿠키 헤더 문자열을 한 번만 만들어서 반환한다.
 * (auth: 'none' 라우트는 이 함수를 호출할 필요 없음)
 * 브라우저는 이 함수 안에서 열고 닫으므로, lighthouse CLI와 브라우저를 공유하지 않는다
 * — 브라우저 재연결 이슈 자체가 발생하지 않는 구조.
 */
async function getCookieHeader(role, { baseUrl }) {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: ["--no-sandbox"],
  });

  try {
    const page = await browser.newPage();

    if (role === "entry") {
      await issueEntryCookie(page, baseUrl);
      return await cookieHeaderFor(page, ["entry"]);
    }

    await loginAsRole(page, baseUrl, role);
    return await cookieHeaderFor(page, ["token"]);
  } finally {
    await browser.close();
  }
}

async function cookieHeaderFor(page, names) {
  const cookies = await page.cookies();
  const picked = cookies.filter((c) => names.includes(c.name));
  const missing = names.filter((n) => !picked.some((c) => c.name === n));
  if (missing.length) {
    throw new Error(`로그인 후 쿠키를 못 찾음: ${missing.join(", ")}`);
  }
  return picked.map((c) => `${c.name}=${c.value}`).join("; ");
}

module.exports = { getCookieHeader };
