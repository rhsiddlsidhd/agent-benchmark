/**
 * lhci puppeteerScript: 감사 대상 URL을 열기 전에 로그인해서 세션 쿠키를 확보한다.
 * Lighthouse는 이 스크립트가 로그인에 사용한 것과 동일한 브라우저 인스턴스에 붙어서 감사를 진행한다.
 * 어떤 계정으로 로그인할지는 LHCI_TEST_EMAIL / LHCI_TEST_PASSWORD 로 주입한다
 * (user job에는 일반 유저 계정, admin job에는 admin 계정을 매핑).
 */
module.exports = async (browser, context) => {
  const { url } = context;
  const { origin } = new URL(url);
  const email = process.env.LHCI_TEST_EMAIL;
  const password = process.env.LHCI_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error("LHCI_TEST_EMAIL / LHCI_TEST_PASSWORD 환경변수가 필요합니다.");
  }

  const page = await browser.newPage();

  // entry 쿠키 발급 (/login 진입 관문)
  await page.goto(origin, { waitUntil: "networkidle0" });
  await page.evaluate(() =>
    fetch("/api/auth/entry?next=%2Flogin", { method: "POST" }),
  );

  await page.goto(`${origin}/login`, { waitUntil: "networkidle0" });
  await page.type("#email", email);
  await page.type("#password", password);

  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0" }),
    page.click('button[type="submit"]'),
  ]);

  await page.close();
};
