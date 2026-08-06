import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Product } from "@/server/services";
import { PopularProductsSection } from "./PopularProductsSection";

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

const buildProducts = (count: number): Product[] =>
  Array.from({ length: count }, (_, i) =>
    buildProduct({ _id: `product-${i + 1}`, title: `상품 ${i + 1}` }),
  );

describe("PopularProductsSection", () => {
  it("상품이 3개면 헤딩과 카드 3장을 렌더링한다", () => {
    render(<PopularProductsSection products={buildProducts(3)} />);

    expect(screen.getByText("인기 상품")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("상품이 2개면 아무것도 렌더링하지 않는다", () => {
    const { container } = render(<PopularProductsSection products={buildProducts(2)} />);

    expect(screen.queryByText("인기 상품")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it("상품이 8개면 8장 전부 렌더링되고 첫 카드에 순위 1이 붙는다", () => {
    render(<PopularProductsSection products={buildProducts(8)} />);

    expect(screen.getAllByRole("link")).toHaveLength(8);
    expect(screen.getByText("인기 1위")).toBeInTheDocument();
  });

  it("가로 스크롤 트랙이 overflow-x-auto 리스트로 렌더링된다", () => {
    render(<PopularProductsSection products={buildProducts(3)} />);

    const list = screen.getByRole("list");
    expect(list).toHaveClass("overflow-x-auto");
  });
});
