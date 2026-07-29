import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductFilterProvider, initialFilterState } from "@/client/context/productFilter";
import { Product } from "@/server/services";
import { ProductGrid } from "./ProductGrid";

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

const renderWithProvider = (data: Product[]) =>
  render(
    <ProductFilterProvider initialValue={initialFilterState}>
      <ProductGrid data={data} />
    </ProductFilterProvider>,
  );

describe("ProductGrid", () => {
  it("상품이 있으면 카드를 렌더링한다", () => {
    renderWithProvider([buildProduct()]);

    expect(screen.getByText("봄맞이 청첩장")).toBeInTheDocument();
  });

  it("상품이 없으면 빈 상태 메시지를 렌더링한다", () => {
    renderWithProvider([]);

    expect(screen.getByText("상품을 준비 중에 있습니다")).toBeInTheDocument();
  });
});
