const puppeteer = require("puppeteer");
const { loginAsRole } = require("./login");

const SESSION_STORAGE_KEY = "order-storage";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} 환경변수가 필요합니다.`);
  return value;
}

function buildOrderStoragePayload(productId) {
  return JSON.stringify({
    state: {
      order: {
        productId,
        title: "Lighthouse 감사용 샘플 상품",
        thumbnail: "",
        originalPrice: 0,
        discountedPrice: 0,
        discountAmount: 0,
        optionsTotalPrice: 0,
        finalPrice: 0,
        quantity: 1,
        selectedFeatures: [],
      },
    },
    version: 0,
  });
}

/**
 * /couple-info는 sessionStorage(order-storage)가 채워져 있어야만 정상 렌더되는데,
 * 이건 lighthouse CLI의 --extra-headers(HTTP 헤더 전용)로는 주입 불가능하다.
 * 그래서 이 페이지만 lighthouse Node API(page를 직접 넘기는 방식)로 처리한다.
 */
async function auditCoupleInfo({ baseUrl, formFactor }) {
  const { default: lighthouse } = await import("lighthouse");
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: ["--no-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await loginAsRole(page, baseUrl, "user");

    const productId = requireEnv("NEXT_PUBLIC_MAIN_PREVIEW_PRODUCT_ID");
    await page.evaluate(
      (key, value) => sessionStorage.setItem(key, value),
      SESSION_STORAGE_KEY,
      buildOrderStoragePayload(productId),
    );

    const config =
      formFactor === "desktop"
        ? (await import("lighthouse/core/config/desktop-config.js")).default
        : undefined;

    const result = await lighthouse(
      `${baseUrl}/couple-info`,
      { logLevel: "error" },
      config,
      page,
    );
    if (!result) throw new Error("/couple-info lighthouse 실행 결과가 없습니다.");
    return result.lhr;
  } finally {
    await browser.close();
  }
}

module.exports = { auditCoupleInfo };
