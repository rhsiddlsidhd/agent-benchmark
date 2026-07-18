const CREDENTIALS_BY_ROLE = {
  user: { emailEnv: "TEST_USER_EMAIL", passwordEnv: "TEST_USER_PASSWORD" },
  admin: { emailEnv: "TEST_ADMIN_EMAIL", passwordEnv: "TEST_ADMIN_PASSWORD" },
};

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} 환경변수가 필요합니다.`);
  return value;
}

/** entry 쿠키만 발급받는다 (/login 페이지 자체를 감사할 때 씀). */
async function issueEntryCookie(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle0" });
  await page.evaluate(() =>
    fetch("/api/auth/entry?next=%2Flogin", { method: "POST" }),
  );
}

/** entry 쿠키 발급 → /login 진입 → 이메일/비번 제출까지 수행, page에 세션 쿠키가 남는다. */
async function loginAsRole(page, baseUrl, role) {
  const credentials = CREDENTIALS_BY_ROLE[role];
  if (!credentials) throw new Error(`알 수 없는 auth 롤: ${role}`);

  await issueEntryCookie(page, baseUrl);

  const email = requireEnv(credentials.emailEnv);
  const password = requireEnv(credentials.passwordEnv);

  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle0" });
  await page.type("#email", email);
  await page.type("#password", password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0" }),
    page.click('button[type="submit"]'),
  ]);
}

module.exports = { issueEntryCookie, loginAsRole };
