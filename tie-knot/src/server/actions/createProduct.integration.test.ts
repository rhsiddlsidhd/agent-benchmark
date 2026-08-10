// @vitest-environment node
//
// createProduct.test.ts(같은 디렉토리)는 requireAuth/createProductService를
// 전부 vi.mock으로 대체한 단위 테스트다 — 액션의 파싱/조립 로직만 검증한다.
// 이 파일은 createProductService를 걷어내고 실제 mongodb-memory-server DB까지
// 관통시켜서, action → zod 검증 → createProductService → MongoDB로 이어지는
// REQ-1/2/3/6 골든패스/에러 흐름이 실제로 맞물려 동작하는지 검증한다
// (_workspace/feat/product-category-quantity/04_integration_report.md
// "Phase4에 반드시 넘길 회귀 픽스처" 대응, test-suite 담당).
//
// 외부 연동(Cloudinary)만 mock한다(docs/TESTING_GUIDELINE.md 목킹 정책) —
// requireAuth는 실제 세션 쿠키 체계를 타지 않고 결과만 override한다(다른
// 통합 테스트 선례와 동일하게 "@/server/services" 부분 mock).
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/mongodb";
import { clearCollections } from "@/test";
import { ProductModel } from "@/server/models";
import { GET as getProductsRoute } from "@/app/api/products/route";
import { NextRequest } from "next/server";

vi.mock("@/server/lib/cloudinary", () => ({
  uploadProductImage: vi.fn(),
  deleteProductAsset: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/server/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/services")>();
  return {
    ...actual,
    requireAuth: vi.fn(),
  };
});

import { requireAuth } from "@/server/services";
import { uploadProductImage } from "@/server/lib/cloudinary";
import { createProduct } from "./createProduct";

const ADMIN_SESSION = { role: "ADMIN" as const, email: "admin@test.com", userId: "admin-1" };

const buildFavorFormData = (overrides?: Record<string, string>) => {
  const formData = new FormData();
  const fields: Record<string, string> = {
    title: "라벤더 디퓨저 답례품",
    description: "결혼식 답례품으로 준비한 라벤더 디퓨저입니다.",
    category: "favor",
    subCategory: "diffuser",
    price: "5000",
    isPremium: "false",
    isFeatured: "false",
    priority: "0",
    "discount.discountType": "rate",
    "discount.value": "0",
    minQuantity: "2",
    maxQuantity: "10",
    ...overrides,
  };
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  formData.set("thumbnail", new File(["thumb"], "thumbnail.jpg", { type: "image/jpeg" }));
  return formData;
};

describe("createProduct — 통합(action~DB~/api/products 계약)", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue(ADMIN_SESSION);
    vi.mocked(uploadProductImage).mockImplementation(async (file, type) => {
      if (type === "thumbnail") return "https://example.com/thumb.jpg";
      if (type === "images") return `https://example.com/${(file as File).name}`;
      return undefined;
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("골든패스: 어드민이 favor 카테고리 상품을 등록하면(images 1장, min=2/max=10) 실제 DB에 저장되고 GET /api/products 응답에 그대로 실린다", async () => {
    const formData = buildFavorFormData();
    formData.append("images", new File(["x"], "gallery1.jpg", { type: "image/jpeg" }));

    const result = await createProduct(undefined, formData);

    expect(result).toEqual({
      success: true,
      data: { message: "상품이 성공적으로 등록되었습니다." },
    });

    // DB에 실제로 3필드가 저장됐는지(REQ-2)
    const saved = await ProductModel.findOne({ title: "라벤더 디퓨저 답례품" }).lean();
    expect(saved?.images).toEqual(["https://example.com/gallery1.jpg"]);
    expect(saved?.minQuantity).toBe(2);
    expect(saved?.maxQuantity).toBe(10);
    expect(saved?.category).toBe("favor");

    // 백엔드-투-프론트 계약: /api/products 응답이 이 값을 non-optional로 그대로 노출한다(01_api_contract.md §1-1, §5)
    const res = await getProductsRoute(new NextRequest("http://localhost/api/products"));
    const body = await res.json();
    const found = body.data.find((p: { title: string }) => p.title === "라벤더 디퓨저 답례품");

    expect(found).toBeDefined();
    expect(found.images).toEqual(["https://example.com/gallery1.jpg"]);
    expect(found.minQuantity).toBe(2);
    expect(found.maxQuantity).toBe(10);
  });

  it("에러 흐름: 물리 상품(favor)을 images 없이 제출하면 VALIDATION + fieldErrors.images를 리턴하고 DB에 저장되지 않는다", async () => {
    const formData = buildFavorFormData();

    const result = await createProduct(undefined, formData);

    expect(result.success).toBe(false);
    if (result.success === false) {
      expect(result.error.category).toBe("VALIDATION");
      expect(result.error.fieldErrors?.images).toBeDefined();
    }
    expect(await ProductModel.countDocuments({ title: "라벤더 디퓨저 답례품" })).toBe(0);
    // 검증 실패는 requireAuth 호출 이전에 막힌다(액션 처리 순서, 01_api_contract.md §2)
    expect(requireAuth).not.toHaveBeenCalled();
  });

  it("에러 흐름: maxQuantity(5) < minQuantity(10)로 등록 시도하면 VALIDATION + fieldErrors.maxQuantity를 리턴한다", async () => {
    const formData = buildFavorFormData({ minQuantity: "10", maxQuantity: "5" });
    formData.append("images", new File(["x"], "gallery1.jpg", { type: "image/jpeg" }));

    const result = await createProduct(undefined, formData);

    expect(result.success).toBe(false);
    if (result.success === false) {
      expect(result.error.category).toBe("VALIDATION");
      expect(result.error.fieldErrors?.maxQuantity).toBeDefined();
    }
    expect(await ProductModel.countDocuments({ title: "라벤더 디퓨저 답례품" })).toBe(0);
  });

  it("회귀: invitation 상품을 min=1/max=1로 명시 등록하면(관리자가 무제한 체크를 해제한 흐름) 정규화 폴백과 섞이지 않고 그 값 그대로 저장된다", async () => {
    const formData = new FormData();
    const fields: Record<string, string> = {
      title: "가을맞이 청첩장",
      description: "가을 시즌 한정 모바일 청첩장 템플릿입니다.",
      category: "invitation",
      subCategory: "wedding",
      price: "9900",
      isPremium: "false",
      isFeatured: "false",
      priority: "0",
      "discount.discountType": "rate",
      "discount.value": "0",
      minQuantity: "1",
      maxQuantity: "1",
    };
    Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
    formData.set("thumbnail", new File(["thumb"], "thumbnail.jpg", { type: "image/jpeg" }));

    const result = await createProduct(undefined, formData);

    expect(result.success).toBe(true);
    const saved = await ProductModel.findOne({ title: "가을맞이 청첩장" }).lean();
    // fixed 모드 판정 기준(01_ui_flow.md §3-1)이 실제 저장값에서도 성립해야 한다.
    expect(saved?.minQuantity).toBe(1);
    expect(saved?.maxQuantity).toBe(1);
  });
});
