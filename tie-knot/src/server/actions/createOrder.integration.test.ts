// @vitest-environment node
//
// createOrder.test.ts(같은 디렉토리)는 requireAuth/createOrderService를 전부
// vi.mock으로 대체한 단위 테스트다 — 액션의 파싱/리다이렉트 분기만 검증한다.
// 이 파일은 createOrderService를 걷어내고 실제 mongodb-memory-server DB까지
// 관통시켜서, action → zod 검증 → createOrderService(REQ-5 수량 범위 검증,
// DB 재조회) → MongoDB로 이어지는 골든패스/에러 흐름을 실제로 실행해 확인한다
// (01_api_contract.md §4 ★REQ-5★, 01_ui_flow.md §1-A,
// _workspace/feat/product-category-quantity/04_integration_report.md
// "Phase4에 반드시 넘길 회귀 픽스처 2건" 중 1번을 action 레이어까지 닫는다).
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/mongodb";
import { clearCollections } from "@/test/db";
import { buildProductInput } from "@/test/factories/product.factory";
import { OrderModel, ProductModel } from "@/server/models";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("@/server/lib/cookies", () => ({
  getCookie: vi.fn(),
}));

vi.mock("@/server/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/services")>();
  return {
    ...actual,
    requireAuth: vi.fn(),
  };
});

import { getCookie } from "@/server/lib/cookies";
import { requireAuth, createProductService } from "@/server/services";
import { createOrder } from "./createOrder";

const USER_SESSION = {
  role: "USER" as const,
  email: "buyer@test.com",
  userId: new mongoose.Types.ObjectId().toString(),
};

const buildOrderFormData = (productId: string, overrides?: Record<string, string>) => {
  const formData = new FormData();
  const fields: Record<string, string> = {
    coupleInfoId: new mongoose.Types.ObjectId().toString(),
    buyerName: "김철수",
    buyerEmail: "buyer@example.com",
    buyerPhone: "010-1234-5678",
    payMethod: "CARD",
    productId,
    productTitle: "라벤더 디퓨저 답례품",
    productThumbnail: "https://example.com/thumb.jpg",
    originalPrice: "5000",
    discountedPrice: "5000",
    productQuantity: "5",
    selectedFeatures: "[]",
    ...overrides,
  };
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return formData;
};

describe("createOrder — 통합(action~DB, REQ-5 수량 범위 검증)", () => {
  let rangeProductId: string;

  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
    vi.mocked(getCookie).mockResolvedValue({ name: "token", value: "t" } as never);
    vi.mocked(requireAuth).mockResolvedValue(USER_SESSION);

    const productInput = buildProductInput({
      title: "라벤더 디퓨저 답례품",
      category: "favor",
      subCategory: "diffuser",
      images: ["https://example.com/gallery.jpg"],
      minQuantity: 2,
      maxQuantity: 10,
    });
    await createProductService(productInput);
    const saved = await ProductModel.findOne({ title: productInput.title }).lean();
    rangeProductId = saved!._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("골든패스: 범위 안 수량(5개, [2,10])으로 주문하면 실제 DB에 order.product.quantity===5로 저장된다", async () => {
    const formData = buildOrderFormData(rangeProductId, { productQuantity: "5" });

    const result = await createOrder(undefined, formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.productId).toBe(rangeProductId);
    }
    const saved = await OrderModel.findOne({ "product.productId": new mongoose.Types.ObjectId(rangeProductId) }).lean();
    expect(saved?.product.quantity).toBe(5);
  });

  it("에러 흐름: 범위 초과 수량(15개, 상한 10)으로 주문하면 VALIDATION + fieldErrors undefined + '최대 10개' 문구를 리턴하고 주문이 생성되지 않는다", async () => {
    const formData = buildOrderFormData(rangeProductId, { productQuantity: "15" });

    const result = await createOrder(undefined, formData);

    expect(result.success).toBe(false);
    if (result.success === false) {
      expect(result.error.category).toBe("VALIDATION");
      expect(result.error.fieldErrors).toBeUndefined();
      expect(result.error.message).toContain("최대 10개");
    }
    expect(await OrderModel.countDocuments({})).toBe(0);
  });

  it("에러 흐름: 존재하지 않는 productId로 주문하면 NOT_FOUND를 리턴한다", async () => {
    const missingProductId = new mongoose.Types.ObjectId().toString();
    const formData = buildOrderFormData(missingProductId, { productQuantity: "1" });

    const result = await createOrder(undefined, formData);

    expect(result).toEqual({
      success: false,
      error: { category: "NOT_FOUND", message: "상품을 찾을 수 없습니다.", fieldErrors: undefined },
    });
  });

  // ── 회귀 픽스처 1(action 레이어까지 닫음): images/minQuantity/maxQuantity 필드
  // 자체가 없는 레거시 Product로 실제 action을 태워, .lean() + mongoose default
  // 미적용 폴백이 무증상 통과가 아니라 실제로 (1,1) 기준 검증을 수행하는지 확인한다.
  it("★회귀 픽스처★ minQuantity/maxQuantity 필드가 없는 레거시 상품은 (1,1) 폴백 기준으로 실제 검증되어, 수량 1은 통과하고 수량 2는 VALIDATION으로 거부된다", async () => {
    const inserted = await ProductModel.collection.insertOne({
      authorId: "legacy",
      title: "레거시 청첩장",
      description: "레거시 문서(필드 없음)",
      thumbnail: "https://example.com/legacy.jpg",
      price: 1000,
      category: "invitation",
      subCategory: "wedding",
      isPremium: false,
      isFeatured: false,
      priority: 0,
      likes: [],
      views: 0,
      salesCount: 0,
      discount: { discountType: "rate", value: 0 },
      status: "active",
      featureIds: [],
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      // images/minQuantity/maxQuantity 의도적으로 생략
    } as never);
    const legacyProductId = inserted.insertedId.toString();

    const overQuantityForm = buildOrderFormData(legacyProductId, {
      productTitle: "레거시 청첩장",
      productThumbnail: "https://example.com/legacy.jpg",
      originalPrice: "1000",
      discountedPrice: "1000",
      productQuantity: "2",
    });
    const overResult = await createOrder(undefined, overQuantityForm);
    expect(overResult.success).toBe(false);
    if (overResult.success === false) {
      expect(overResult.error.category).toBe("VALIDATION");
    }
    expect(await OrderModel.countDocuments({})).toBe(0);

    const validForm = buildOrderFormData(legacyProductId, {
      productTitle: "레거시 청첩장",
      productThumbnail: "https://example.com/legacy.jpg",
      originalPrice: "1000",
      discountedPrice: "1000",
      productQuantity: "1",
    });
    const validResult = await createOrder(undefined, validForm);
    expect(validResult.success).toBe(true);
    const saved = await OrderModel.findOne({ "product.productId": new mongoose.Types.ObjectId(legacyProductId) }).lean();
    expect(saved?.product.quantity).toBe(1);
  });

  it("로그인 쿠키가 없으면 REQ-5 검증 이전에 /login으로 redirect한다 (인증이 상품 조회보다 먼저)", async () => {
    vi.mocked(getCookie).mockResolvedValue(undefined);
    const formData = buildOrderFormData(rangeProductId);

    await expect(createOrder(undefined, formData)).rejects.toThrow("REDIRECT:/login");
    expect(await OrderModel.countDocuments({})).toBe(0);
  });
});
