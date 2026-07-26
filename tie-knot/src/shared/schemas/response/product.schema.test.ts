import { describe, it, expect } from "vitest";
import { productResponseSchema } from "./product.schema";

const buildValidProduct = (overrides?: Record<string, unknown>) => ({
  _id: "507f1f77bcf86cd799439011",
  authorId: "507f1f77bcf86cd799439012",
  title: "봄맞이 청첩장",
  description: "봄 시즌 한정 모바일 청첩장 템플릿입니다.",
  thumbnail: "https://example.com/thumbnail.jpg",
  price: 9900,
  category: "invitation",
  subCategory: "wedding",
  isPremium: false,
  featureIds: [] as string[],
  isFeatured: false,
  priority: 0,
  likes: [] as string[],
  views: 0,
  salesCount: 0,
  discount: { discountType: "rate", value: 0 },
  status: "active",
  isLiked: false,
  discountedPrice: 9900,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null as string | null,
  ...overrides,
});

describe("productResponseSchema", () => {
  it("deletedAt이 null이면 통과한다", () => {
    const result = productResponseSchema.safeParse(buildValidProduct({ deletedAt: null }));

    expect(result.success).toBe(true);
  });

  it("deletedAt이 ISO date string이면 통과한다", () => {
    const iso = new Date().toISOString();
    const result = productResponseSchema.safeParse(buildValidProduct({ deletedAt: iso }));

    expect(result.success).toBe(true);
    expect(result.data?.deletedAt).toBe(iso);
  });

  it("deletedAt 필드가 아예 없으면 실패한다 (더 이상 optional이 아님)", () => {
    const data = buildValidProduct();
    delete (data as { deletedAt?: unknown }).deletedAt;

    const result = productResponseSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("deletedAt이 ISO date string이 아니면 실패한다", () => {
    const result = productResponseSchema.safeParse(
      buildValidProduct({ deletedAt: "not-a-date" }),
    );

    expect(result.success).toBe(false);
  });
});
