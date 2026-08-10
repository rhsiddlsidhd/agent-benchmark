import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const PORTONE_API = "https://api.portone.io";

function required(name: "PORTONE_STORE_ID" | "PORTONE_CHANNEL_KEY" | "PORTONE_API_SECRET") {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the manual PortOne smoke test`);
  return value;
}

async function portOneRequest(
  request: APIRequestContext,
  method: "get" | "post",
  path: string,
  data?: object,
) {
  const response = await request[method](`${PORTONE_API}${path}`, {
    headers: { Authorization: `PortOne ${required("PORTONE_API_SECRET")}` },
    data,
  });
  expect(response.ok(), `${method.toUpperCase()} ${path}: ${await response.text()}`).toBe(true);
  return response.json();
}

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("이메일").fill("user-e2e@example.com");
  await page.getByLabel("비밀번호").fill("User-e2e1!");
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
}

test("KG이니시스 inicis_v2 실제 결제 후 전액 취소", async ({ page, request }) => {
  test.setTimeout(15 * 60_000);
  required("PORTONE_STORE_ID");
  required("PORTONE_CHANNEL_KEY");

  await login(page);
  await page.goto("/payment");
  await page.evaluate(() => sessionStorage.setItem("order-storage", JSON.stringify({
    state: {
      order: {
        productId: "64b000000000000000000001",
        title: "E2E 결제 상품",
        thumbnail: "https://res.cloudinary.com/e2e/image/upload/checkout.png",
        originalPrice: 12000,
        discountedPrice: 12000,
        discountAmount: 0,
        optionsTotalPrice: 0,
        finalPrice: 12000,
        quantity: 1,
        selectedFeatures: [],
      },
    },
    version: 0,
  })));
  await page.reload();
  await page.getByLabel("이름").fill("테스트 구매자");
  await page.getByLabel("연락처").fill("010-1234-5678");
  await page.getByLabel("이메일").fill("portone-smoke@example.com");
  await page.getByLabel(/구매조건 확인 및 결제 진행에 동의/).click();
  await page.getByRole("button", { name: "결제하기" }).click();

  const paymentId = await expect.poll(
    () => page.evaluate(() => sessionStorage.getItem("portone-smoke-payment-id")),
    { timeout: 30_000 },
  ).not.toBeNull().then(() => page.evaluate(
    () => sessionStorage.getItem("portone-smoke-payment-id"),
  ));
  expect(paymentId).toBeTruthy();

  // 여기서 실제 KG이니시스 창의 카드사 인증을 사람이 완료한다.
  try {
    await expect(page).toHaveURL(/\/payment\/success\?orderId=ORDER-/, {
      timeout: 10 * 60_000,
    });
    expect(new URL(page.url()).searchParams.get("orderId")).toBe(paymentId);
    const paid = await portOneRequest(request, "get", `/payments/${encodeURIComponent(paymentId!)}`);
    expect(paid).toMatchObject({
      id: paymentId,
      status: "PAID",
      storeId: required("PORTONE_STORE_ID"),
      amount: { paid: 12000 },
      channel: { type: "TEST" },
    });
  } finally {
    // 앱 검증/redirect assertion이 실패해도 승인된 실제 테스트 결제는 정리한다.
    const payment = await portOneRequest(request, "get", `/payments/${encodeURIComponent(paymentId!)}`);
    if (payment.status === "PAID" || payment.status === "PARTIAL_CANCELLED") {
      await portOneRequest(request, "post", `/payments/${encodeURIComponent(paymentId!)}/cancel`, {
        storeId: required("PORTONE_STORE_ID"),
        reason: "manual KG Inicis smoke cleanup",
        requester: "ADMIN",
      });
    }
  }

  await expect.poll(async () => {
    const payment = await portOneRequest(request, "get", `/payments/${encodeURIComponent(paymentId!)}`);
    return payment.status;
  }, { timeout: 60_000 }).toBe("CANCELLED");
});
