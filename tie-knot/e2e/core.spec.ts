import { expect, test, type Page } from "@playwright/test";

const image = {
  name: "product.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  ),
};

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("이메일").fill("admin-e2e@example.com");
  await page.getByLabel("비밀번호").fill("Admin-e2e1!");
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
}

async function loginAsUser(page: Page) {
  await page.goto("/login");
  await page.getByLabel("이메일").fill("user-e2e@example.com");
  await page.getByLabel("비밀번호").fill("User-e2e1!");
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
}

async function fillBaseProduct(page: Page, title: string) {
  await page.getByLabel("상품명 *").fill(title);
  await page.getByLabel("상품 설명 *").fill("E2E에서 검증하는 충분히 긴 상품 설명입니다.");
  await page.getByLabel("기본 가격 *").fill("10000");
  await page.locator("#thumbnail-input").setInputFiles(image);
}

async function selectOption(page: Page, triggerId: string, option: string) {
  await page.locator(`#${triggerId}`).click();
  await page.getByRole("option", { name: option }).click();
}

test("로그인 페이지의 실제 브라우저 계약", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /로그인/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /로그인/ })).toBeVisible();
});

test("비인증 관리자는 상품 등록 화면을 볼 수 없다", async ({ page }) => {
  await page.goto("/admin/products/new");
  await expect(page).toHaveURL(/\/login/);
});

test("ADMIN은 상세 이미지 없이 invitation 상품을 실제 DB에 등록한다", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/products/new");
  await fillBaseProduct(page, "E2E 초대장");
  await selectOption(page, "subCategory", "청첩장");

  await page.getByRole("button", { name: "상품 등록" }).click();

  await expect(page).toHaveURL(/\/admin\/products$/);
  await expect(page.getByText("E2E 초대장")).toBeVisible();
});

test("물리 상품은 상세 이미지 없이 등록이 차단된다", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/products/new");
  await fillBaseProduct(page, "E2E 캔들");
  await selectOption(page, "category", "답례품");
  await selectOption(page, "subCategory", "캔들");

  await page.getByRole("button", { name: "상품 등록" }).click();
  await expect(page.getByText("상세 이미지를 1장 이상 등록해주세요.")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/products\/new/);
});

test("ADMIN은 상세 이미지를 포함한 물리 상품을 실제 DB에 등록한다", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/products/new");
  await fillBaseProduct(page, "E2E 캔들 이미지");
  await selectOption(page, "category", "답례품");
  await selectOption(page, "subCategory", "캔들");

  await page.locator("#images-upload").setInputFiles(image);
  await expect(page.getByRole("img", { name: /^Preview / })).toBeVisible();
  await expect.poll(() => page.locator('input[name="images"]').evaluate(
    (input: HTMLInputElement) => input.files?.length ?? 0,
  )).toBe(1);
  await page.getByRole("button", { name: "상품 등록" }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  await expect(page.getByText("E2E 캔들 이미지")).toBeVisible();
});

test("기존 상세 이미지와 thumbnail을 유지한 채 상품명을 수정한다", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/products");
  const row = page.getByRole("row").filter({ hasText: "E2E 기존 이미지 상품" });
  await row.getByRole("button").first().click();
  const dialog = page.getByRole("dialog", { name: "상품 수정" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("상품명 *").fill("E2E 기존 이미지 유지 완료");
  await expect(dialog.locator('input[name="currentImages"]')).toHaveValue(
    "https://res.cloudinary.com/e2e/image/upload/existing-detail.png",
  );
  await dialog.getByRole("button", { name: "상품 수정" }).click();
  await expect(dialog).not.toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("E2E 기존 이미지 유지 완료")).toBeVisible();
});

test("실제 주문을 생성하고 mock PortOne 경계로 결제를 완료한다", async ({ page }) => {
  await loginAsUser(page);
  await page.goto("/payment");
  await page.evaluate(() => {
    sessionStorage.setItem("order-storage", JSON.stringify({
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
    }));
  });
  await page.reload();

  await page.getByLabel("이름").fill("테스트 구매자");
  await page.getByLabel("연락처").fill("010-1234-5678");
  await page.getByLabel("이메일").fill("buyer-e2e@example.com");
  await page.getByLabel(/구매조건 확인 및 결제 진행에 동의/).click();
  await page.getByRole("button", { name: "결제하기" }).click();

  await expect(page).toHaveURL(/\/payment\/success\?orderId=ORDER-/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "결제가 완료되었습니다!" })).toBeVisible();
  await page.getByRole("link", { name: "주문 내역 확인" }).click();
  await expect(page.getByText("E2E 결제 상품")).toBeVisible();
});
