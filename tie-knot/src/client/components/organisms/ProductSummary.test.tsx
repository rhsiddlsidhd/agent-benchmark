import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Product } from "@/server/services";

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }));

vi.mock("@/server/actions", () => ({
  toggleProductLike: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

vi.mock("@/client/hooks", () => ({ useAuth: useAuthMock }));

import { ProductSummary } from "./ProductSummary";

const buildProduct = (overrides?: Partial<Product>): Product =>
  ({
    _id: "product-1",
    authorId: "author-1",
    title: "봄맞이 청첩장",
    description: "봄 시즌 한정 모바일 청첩장 템플릿입니다.",
    thumbnail: "https://example.com/thumb.jpg",
    price: 10000,
    category: "invitation",
    subCategory: "wedding",
    isPremium: false,
    isFeatured: false,
    priority: 0,
    discount: { discountType: "rate", value: 0 },
    status: "active",
    likes: [],
    featureIds: [],
    isLiked: false,
    discountedPrice: 10000,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  }) as Product;

describe("ProductSummary", () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false });
  });

  it("상품 제목/설명/카테고리 라벨을 렌더링한다", () => {
    render(
      <ProductSummary product={buildProduct()} options={[]} onPurchase={vi.fn()} />,
    );

    expect(screen.getByText("봄맞이 청첩장")).toBeInTheDocument();
    expect(
      screen.getByText("봄 시즌 한정 모바일 청첩장 템플릿입니다."),
    ).toBeInTheDocument();
  });
});
