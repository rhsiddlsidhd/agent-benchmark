import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Product } from "@/server/services";
import { ProductCatalog } from "./ProductCatalog";

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

describe("ProductCatalog", () => {
  it("검색창과 상품 카드를 함께 렌더링한다", () => {
    render(
      <ProductCatalog
        products={[buildProduct()]}
        category="invitation"
        premiumFeatures={[]}
        initialSubCategory="all"
      />,
    );

    expect(screen.getByPlaceholderText("상품 검색...")).toBeInTheDocument();
    expect(screen.getByText("봄맞이 청첩장")).toBeInTheDocument();
  });

  it("initialSubCategory가 wedding이면 첫 렌더부터 wedding 상품만 보인다(flash 없음)", () => {
    render(
      <ProductCatalog
        products={[
          buildProduct({ title: "봄맞이 청첩장", subCategory: "wedding" }),
          buildProduct({ title: "첫돌 축하 세트", subCategory: "first-birthday" }),
        ]}
        category="invitation"
        premiumFeatures={[]}
        initialSubCategory="wedding"
      />,
    );

    expect(screen.getByText("봄맞이 청첩장")).toBeInTheDocument();
    expect(screen.queryByText("첫돌 축하 세트")).not.toBeInTheDocument();
  });

  it("initialSubCategory가 first-birthday면 첫 렌더부터 first-birthday 상품만 보인다 — 하이픈 유실 회귀 방지", () => {
    render(
      <ProductCatalog
        products={[
          buildProduct({ title: "봄맞이 청첩장", subCategory: "wedding" }),
          buildProduct({ title: "첫돌 축하 세트", subCategory: "first-birthday" }),
        ]}
        category="invitation"
        premiumFeatures={[]}
        initialSubCategory="first-birthday"
      />,
    );

    expect(screen.getByText("첫돌 축하 세트")).toBeInTheDocument();
    expect(screen.queryByText("봄맞이 청첩장")).not.toBeInTheDocument();
  });
});
