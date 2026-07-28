import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Product } from "@/server/services";
import { ProductCard } from "./ProductCard";

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

describe("ProductCard", () => {
  it("상세 페이지로 이동하는 링크를 렌더링한다", () => {
    render(<ProductCard product={buildProduct()} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/products/invitation/product-1");
  });
});
