// @vitest-environment node
//
// updateProduct.test.ts(같은 디렉토리)는 updateProductService를 vi.mock으로
// 대체해 "null 리턴을 받으면 NOT_FOUND를 리턴한다"는 액션의 분기 로직만
// 검증한다 — null이 실제로 어떻게 발생하는지(discriminator 모델 불일치)는
// mock 뒤에 가려져 있어 검증하지 못한다.
//
// 이 파일은 그 mock을 걷어내고 실제 mongodb-memory-server DB까지 관통시켜서,
// "카테고리를 바꿔 updateProduct를 호출하면 discriminator 쿼리 조건 불일치로
// 실제로 null이 발생하고, 그걸 액션이 NOT_FOUND로 명시적으로 번역하는지"까지
// 실제로 실행해 확인한다 — 01_api_contract.md §3 ★REQ-7★,
// _workspace/feat/product-category-quantity/04_integration_report.md
// "Phase4에 반드시 넘길 회귀 픽스처 2건" 중 2번(최우선).
//
// 스코프 경계(리더 판정 그대로): 카테고리 변경 자체를 성공시키는 테스트는
// 쓰지 않는다 — 기대값은 "변경 성공"이 아니라 "실패를 조용히 삼키지 않고
// NOT_FOUND로 명시하는 것"까지다.
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/mongodb";
import { buildProductInput, clearCollections } from "@/test";
import { ProductModel } from "@/server/models";

vi.mock("@/server/lib/cloudinary", () => ({
  uploadProductImage: vi.fn(),
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

import { requireAuth, createProductService } from "@/server/services";
import { uploadProductImage } from "@/server/lib/cloudinary";
import { updateProduct } from "./updateProduct";

const ADMIN_SESSION = { role: "ADMIN" as const, email: "admin@test.com", userId: "admin-1" };

const buildUpdateFormData = (overrides?: Record<string, string>) => {
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
    status: "active",
    minQuantity: "2",
    maxQuantity: "10",
    currentThumbnail: "https://example.com/current.jpg",
    ...overrides,
  };
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  formData.set("thumbnail", new File(["thumb"], "thumbnail.jpg", { type: "image/jpeg" }));
  formData.append("currentImages", "https://example.com/existing.jpg");
  return formData;
};

describe("updateProduct — 통합(action~DB, REQ-7 discriminator 불일치 회귀)", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
    vi.mocked(requireAuth).mockResolvedValue(ADMIN_SESSION);
    vi.mocked(uploadProductImage).mockResolvedValue("https://example.com/thumb.jpg");
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("★회귀 픽스처★ favor 상품을 invitation으로 바꾸려는 수정 요청은 '변경 성공'이 아니라 NOT_FOUND를 리턴하고, 원본 문서는 변경되지 않는다", async () => {
    const input = buildProductInput({
      title: "라벤더 디퓨저 답례품",
      category: "favor",
      subCategory: "diffuser",
      images: ["https://example.com/existing.jpg"],
      minQuantity: 2,
      maxQuantity: 10,
    });
    await createProductService(input);
    const saved = await ProductModel.findOne({ title: input.title }).lean();
    expect(saved?.category).toBe("favor");

    const formData = buildUpdateFormData({ category: "invitation", subCategory: "wedding" });

    const result = await updateProduct(saved!._id.toString(), undefined, formData);

    expect(result).toEqual({
      success: false,
      error: {
        category: "NOT_FOUND",
        message: "상품을 찾을 수 없습니다.",
        fieldErrors: undefined,
      },
    });

    // 무증상 데이터 불일치 없이 원본 문서가 그대로다(카테고리/제목 불변).
    const unchanged = await ProductModel.findById(saved!._id).lean();
    expect(unchanged?.category).toBe("favor");
    expect(unchanged?.title).toBe("라벤더 디퓨저 답례품");
  });

  it("골든 경로: 같은 category로 수정하면 실제 DB에 정상 반영되고 success:true를 리턴한다 (REQ-7 회귀와의 대조군)", async () => {
    const input = buildProductInput({
      title: "라벤더 디퓨저 답례품",
      category: "favor",
      subCategory: "diffuser",
      images: ["https://example.com/existing.jpg"],
      minQuantity: 2,
      maxQuantity: 10,
    });
    await createProductService(input);
    const saved = await ProductModel.findOne({ title: input.title }).lean();

    const formData = buildUpdateFormData({
      category: "favor",
      subCategory: "diffuser",
      title: "라벤더 디퓨저 답례품(수정)",
    });

    const result = await updateProduct(saved!._id.toString(), undefined, formData);

    expect(result).toEqual({
      success: true,
      data: { message: "상품이 성공적으로 수정되었습니다." },
    });
    const updated = await ProductModel.findById(saved!._id).lean();
    expect(updated?.title).toBe("라벤더 디퓨저 답례품(수정)");
    expect(updated?.category).toBe("favor");
  });

  // "존재하지 않는 productId + non-invitation category" 조합의 NOT_FOUND 테스트는
  // 의도적으로 여기 없다 — 실제로 실행해보니 product.model.ts의 subCategory 비동기
  // validator(this.get("category") 폴백 경로, Gotchas 섹션 참고)가 대상 문서를 못 찾을 때
  // ValidationError를 던져 updateProductService가 AppError("INTERNAL")로 감싸버린다
  // (null을 리턴해 REQ-7 분기가 NOT_FOUND로 번역하는 것과 다른 경로). REQ-1로 non-invitation
  // 카테고리가 discriminator 없는 base ProductModel을 타면서 새로 열린 리스크로 보이며,
  // 이번 리더 배정 스코프(REQ-7 category-change 케이스)와는 별개 결함이라 04_test_report.md에
  // 재현 절차와 함께 플래그만 남기고 이 파일에서 "정답"으로 굳히지 않는다.
});
