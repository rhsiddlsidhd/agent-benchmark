import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/shared/types";

vi.mock("@/server/services", () => ({
  requireAuth: vi.fn(),
  createProductService: vi.fn(),
}));

vi.mock("@/server/lib/cloudinary", () => ({
  uploadProductImage: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { requireAuth, createProductService } from "@/server/services";
import { uploadProductImage } from "@/server/lib/cloudinary";
import { createProduct } from "./createProduct";

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
    "discount.discountType": "rate",
    "discount.value": "0",
    ...overrides,
  };

  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  formData.set(
    "thumbnail",
    new File(["thumb"], "thumbnail.jpg", { type: "image/jpeg" }),
  );

  return formData;
};

describe("createProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("입력값 검증에 실패하면 VALIDATION을 리턴한다", async () => {
    const formData = buildValidFormData({ title: "" });

    const result = await createProduct(undefined, formData);

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

    const result = await createProduct(undefined, buildValidFormData());

    expect(result).toEqual({
      success: false,
      error: { category: "FORBIDDEN", message: "관리자 권한이 필요합니다." },
    });
    expect(createProductService).not.toHaveBeenCalled();
  });

  it("services가 던진 AppError를 리턴값으로 번역한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "ADMIN",
      email: "a@b.com",
      userId: "admin-1",
    });
    vi.mocked(uploadProductImage).mockResolvedValue("https://example.com/thumb.jpg");
    vi.mocked(createProductService).mockRejectedValue(
      new AppError("INTERNAL", "상품 등록에 실패했습니다."),
    );

    const result = await createProduct(undefined, buildValidFormData());

    expect(result).toEqual({
      success: false,
      error: {
        category: "INTERNAL",
        message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        fieldErrors: undefined,
      },
    });
  });

  it("정상 경로: 상품 등록 성공 메시지를 리턴한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "ADMIN",
      email: "a@b.com",
      userId: "admin-1",
    });
    vi.mocked(uploadProductImage).mockResolvedValue("https://example.com/thumb.jpg");
    vi.mocked(createProductService).mockResolvedValue(true);

    const result = await createProduct(undefined, buildValidFormData());

    expect(createProductService).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "봄맞이 청첩장",
        authorId: "admin-1",
        thumbnail: "https://example.com/thumb.jpg",
        images: [],
        minQuantity: 1,
        maxQuantity: 0,
      }),
    );
    expect(result).toEqual({
      success: true,
      data: { message: "상품이 성공적으로 등록되었습니다." },
    });
  });

  it("minQuantity/maxQuantity를 보내면 숫자로 파싱해 전달한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "ADMIN",
      email: "a@b.com",
      userId: "admin-1",
    });
    vi.mocked(uploadProductImage).mockResolvedValue("https://example.com/thumb.jpg");
    vi.mocked(createProductService).mockResolvedValue(true);

    const formData = buildValidFormData({ minQuantity: "3", maxQuantity: "10" });

    await createProduct(undefined, formData);

    expect(createProductService).toHaveBeenCalledWith(
      expect.objectContaining({ minQuantity: 3, maxQuantity: 10 }),
    );
  });

  it("빈 문자열 minQuantity/maxQuantity는 0이 아니라 default(1/0)로 정규화된다 (Number('')===0 사고 방지)", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "ADMIN",
      email: "a@b.com",
      userId: "admin-1",
    });
    vi.mocked(uploadProductImage).mockResolvedValue("https://example.com/thumb.jpg");
    vi.mocked(createProductService).mockResolvedValue(true);

    const formData = buildValidFormData({ minQuantity: "", maxQuantity: "" });

    const result = await createProduct(undefined, formData);

    expect(result.success).toBe(true);
    expect(createProductService).toHaveBeenCalledWith(
      expect.objectContaining({ minQuantity: 1, maxQuantity: 0 }),
    );
  });

  it("category!=='invitation'인데 이미지가 없으면 VALIDATION을 리턴한다 (images required)", async () => {
    const formData = buildValidFormData({ category: "favor", subCategory: "candle" });

    const result = await createProduct(undefined, formData);

    expect(result).toEqual({
      success: false,
      error: { category: "VALIDATION", message: "입력값을 확인해주세요", fieldErrors: expect.any(Object) },
    });
    expect(createProductService).not.toHaveBeenCalled();
  });

  it("신규 images 파일을 업로드하고 기존 currentImages와 합쳐서 서비스에 전달한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "ADMIN",
      email: "a@b.com",
      userId: "admin-1",
    });
    vi.mocked(uploadProductImage).mockImplementation(async (file, type) => {
      if (type === "thumbnail") return "https://example.com/thumb.jpg";
      if (type === "images") return `https://example.com/${(file as File).name}`;
      return undefined;
    });
    vi.mocked(createProductService).mockResolvedValue(true);

    const formData = buildValidFormData({ category: "favor", subCategory: "candle" });
    formData.append("currentImages", "https://example.com/existing.jpg");
    formData.append(
      "images",
      new File(["x"], "new.jpg", { type: "image/jpeg" }),
    );

    const result = await createProduct(undefined, formData);

    expect(result.success).toBe(true);
    expect(createProductService).toHaveBeenCalledWith(
      expect.objectContaining({
        images: ["https://example.com/existing.jpg", "https://example.com/new.jpg"],
      }),
    );
  });

  it("빈 file input(size 0)은 신규 이미지로 취급하지 않는다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "ADMIN",
      email: "a@b.com",
      userId: "admin-1",
    });
    vi.mocked(uploadProductImage).mockResolvedValue("https://example.com/thumb.jpg");
    vi.mocked(createProductService).mockResolvedValue(true);

    const formData = buildValidFormData();
    formData.append("images", new File([], "empty.jpg", { type: "image/jpeg" }));

    await createProduct(undefined, formData);

    expect(createProductService).toHaveBeenCalledWith(
      expect.objectContaining({ images: [] }),
    );
    // 빈 file 엔트리는 업로드 시도 자체가 없어야 한다(thumbnail 1회만 호출).
    expect(uploadProductImage).toHaveBeenCalledTimes(1);
  });
});
