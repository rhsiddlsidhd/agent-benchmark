import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/shared/types";

vi.mock("@/server/services", () => ({
  requireAuth: vi.fn(),
  updateProductService: vi.fn(),
}));

vi.mock("@/server/lib/cloudinary", () => ({
  uploadProductImage: vi.fn(),
  deleteProductAsset: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { requireAuth, updateProductService } from "@/server/services";
import { deleteProductAsset, uploadProductImage } from "@/server/lib/cloudinary";
import { updateProduct } from "./updateProduct";

const PRODUCT_ID = "product-1";

const buildValidFormData = (overrides?: Record<string, string>) => {
  const formData = new FormData();
  const fields: Record<string, string> = {
    title: "봄맞이 청첩장",
    description: "봄 시즌 한정 모바일 청첩장 템플릿입니다.",
    category: "invitation",
    subCategory: "wedding",
    price: "9900",
    isPremium: "false",
    isFeatured: "false",
    priority: "0",
    status: "active",
    currentThumbnail: "https://example.com/current.jpg",
    ...overrides,
  };

  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  formData.set(
    "thumbnail",
    new File(["thumb"], "thumbnail.jpg", { type: "image/jpeg" }),
  );

  return formData;
};

describe("updateProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("입력값 검증에 실패하면 VALIDATION을 리턴한다", async () => {
    const formData = buildValidFormData({ title: "" });

    const result = await updateProduct(PRODUCT_ID, undefined, formData);

    expect(result).toEqual({
      success: false,
      error: { category: "VALIDATION", message: "입력값을 확인해주세요", fieldErrors: expect.any(Object) },
    });
    expect(requireAuth).not.toHaveBeenCalled();
  });

  it("관리자가 아니면 FORBIDDEN을 리턴한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "USER",
      email: "a@b.com",
      userId: "user-1",
    });

    const result = await updateProduct(PRODUCT_ID, undefined, buildValidFormData());

    expect(result).toEqual({
      success: false,
      error: { category: "FORBIDDEN", message: "관리자 권한이 필요합니다." },
    });
    expect(updateProductService).not.toHaveBeenCalled();
  });

  it("services가 던진 AppError를 리턴값으로 번역한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "ADMIN",
      email: "a@b.com",
      userId: "admin-1",
    });
    vi.mocked(uploadProductImage).mockResolvedValue("https://example.com/thumb.jpg");
    vi.mocked(updateProductService).mockRejectedValue(
      new AppError("INTERNAL", "상품 수정에 실패했습니다."),
    );

    const result = await updateProduct(PRODUCT_ID, undefined, buildValidFormData());

    expect(result).toEqual({
      success: false,
      error: {
        category: "INTERNAL",
        message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        fieldErrors: undefined,
      },
    });
  });

  it("새 이미지 업로드 후 DB 수정 실패 시 새 asset만 보상 삭제한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ role: "ADMIN", email: "a@b.com", userId: "admin-1" });
    vi.mocked(uploadProductImage).mockImplementation(async (_file, _type, onUploaded) => {
      onUploaded?.({ publicId: "products/thumbnails/replacement", url: "https://cdn/replacement.jpg" });
      return "https://cdn/replacement.jpg";
    });
    vi.mocked(updateProductService).mockRejectedValue(new AppError("INTERNAL", "DB 실패"));

    await updateProduct(PRODUCT_ID, undefined, buildValidFormData());

    expect(deleteProductAsset).toHaveBeenCalledWith("products/thumbnails/replacement");
    expect(deleteProductAsset).not.toHaveBeenCalledWith(expect.stringContaining("current"));
  });

  it("정상 경로: 상품 수정 성공 메시지를 리턴하고 관련 경로를 재검증한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "ADMIN",
      email: "a@b.com",
      userId: "admin-1",
    });
    vi.mocked(uploadProductImage).mockResolvedValue("https://example.com/thumb.jpg");
    vi.mocked(updateProductService).mockResolvedValue(true as never);

    const result = await updateProduct(PRODUCT_ID, undefined, buildValidFormData());

    expect(updateProductService).toHaveBeenCalledWith(
      PRODUCT_ID,
      expect.objectContaining({ title: "봄맞이 청첩장", thumbnail: "https://example.com/thumb.jpg" }),
    );
    expect(result).toEqual({
      success: true,
      data: { message: "상품이 성공적으로 수정되었습니다." },
    });
  });

  // ── REQ-7: updateProductService의 null 리턴(discriminator 모델 category 불일치 등)을
  // 검사 없이 넘기면 무증상 success:true가 나갔던 기존 버그 ──
  it("updateProductService가 null을 리턴하면 NOT_FOUND를 리턴한다 (조용한 실패 제거)", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "ADMIN",
      email: "a@b.com",
      userId: "admin-1",
    });
    vi.mocked(uploadProductImage).mockResolvedValue("https://example.com/thumb.jpg");
    vi.mocked(updateProductService).mockResolvedValue(null);

    const result = await updateProduct(PRODUCT_ID, undefined, buildValidFormData());

    expect(result).toEqual({
      success: false,
      error: {
        category: "NOT_FOUND",
        message: "상품을 찾을 수 없습니다.",
        fieldErrors: undefined,
      },
    });
  });

  it("minQuantity/maxQuantity를 보내면 숫자로 파싱해 전달한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "ADMIN",
      email: "a@b.com",
      userId: "admin-1",
    });
    vi.mocked(uploadProductImage).mockResolvedValue("https://example.com/thumb.jpg");
    vi.mocked(updateProductService).mockResolvedValue(true as never);

    const formData = buildValidFormData({ minQuantity: "2", maxQuantity: "8" });

    await updateProduct(PRODUCT_ID, undefined, formData);

    expect(updateProductService).toHaveBeenCalledWith(
      PRODUCT_ID,
      expect.objectContaining({ minQuantity: 2, maxQuantity: 8 }),
    );
  });

  it("이미지를 전혀 건드리지 않아도(currentImages만 전송) 통과한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "ADMIN",
      email: "a@b.com",
      userId: "admin-1",
    });
    vi.mocked(uploadProductImage).mockResolvedValue("https://example.com/thumb.jpg");
    vi.mocked(updateProductService).mockResolvedValue(true as never);

    const formData = buildValidFormData({ category: "favor", subCategory: "candle" });
    formData.append("currentImages", "https://example.com/existing1.jpg");
    formData.append("currentImages", "https://example.com/existing2.jpg");

    const result = await updateProduct(PRODUCT_ID, undefined, formData);

    expect(result.success).toBe(true);
    expect(updateProductService).toHaveBeenCalledWith(
      PRODUCT_ID,
      expect.objectContaining({
        images: ["https://example.com/existing1.jpg", "https://example.com/existing2.jpg"],
      }),
    );
  });

  it("물리 상품인데 currentImages도 신규 파일도 없으면 VALIDATION을 리턴한다", async () => {
    const formData = buildValidFormData({ category: "favor", subCategory: "candle" });

    const result = await updateProduct(PRODUCT_ID, undefined, formData);

    expect(result).toEqual({
      success: false,
      error: { category: "VALIDATION", message: "입력값을 확인해주세요", fieldErrors: expect.any(Object) },
    });
    expect(updateProductService).not.toHaveBeenCalled();
  });
});
