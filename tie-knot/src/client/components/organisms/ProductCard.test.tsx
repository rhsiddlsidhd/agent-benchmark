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

  it("할인이 없으면 원가만 표시하고 할인 배지/취소선을 렌더링하지 않는다", () => {
    render(<ProductCard product={buildProduct({ price: 10000, discount: { discountType: "rate", value: 0 } })} />);

    expect(screen.getByText("10,000원")).toBeInTheDocument();
    expect(screen.queryByText(/OFF/)).not.toBeInTheDocument();
    expect(screen.queryByText(/할인/)).not.toBeInTheDocument();
  });

  it("정률 할인이면 반올림된 %와 할인가를 표시한다", () => {
    render(
      <ProductCard
        product={buildProduct({ price: 10000, discount: { discountType: "rate", value: 0.3 } })}
      />,
    );

    expect(screen.getByText("30% OFF")).toBeInTheDocument();
    expect(screen.getByText("7,000원")).toBeInTheDocument();
    expect(screen.getByText("10,000원")).toBeInTheDocument();
  });

  it("정액 할인이면 원 단위 할인 라벨과 할인가를 표시한다", () => {
    render(
      <ProductCard
        product={buildProduct({ price: 10000, discount: { discountType: "amount", value: 3000 } })}
      />,
    );

    expect(screen.getByText("3,000원 할인")).toBeInTheDocument();
    expect(screen.getByText("7,000원")).toBeInTheDocument();
  });

  it("최종가가 0원이면 '무료'로 표시한다", () => {
    render(
      <ProductCard
        product={buildProduct({ price: 1000, discount: { discountType: "amount", value: 1000 } })}
      />,
    );

    expect(screen.getByText("무료")).toBeInTheDocument();
  });

  it("isPremium이면 Premium 배지를 렌더링한다", () => {
    render(<ProductCard product={buildProduct({ isPremium: true })} />);

    expect(screen.getByText("Premium")).toBeInTheDocument();
    expect(screen.queryByText("추천")).not.toBeInTheDocument();
  });

  it("isFeatured면 추천 배지를 렌더링한다", () => {
    render(<ProductCard product={buildProduct({ isFeatured: true })} />);

    expect(screen.getByText("추천")).toBeInTheDocument();
    expect(screen.queryByText("Premium")).not.toBeInTheDocument();
  });

  it("isPremium/isFeatured 둘 다 아니면 배지를 렌더링하지 않는다", () => {
    render(<ProductCard product={buildProduct({ isPremium: false, isFeatured: false })} />);

    expect(screen.queryByText("Premium")).not.toBeInTheDocument();
    expect(screen.queryByText("추천")).not.toBeInTheDocument();
  });

  it("likes가 비어있으면 좋아요 0으로 표시한다", () => {
    render(<ProductCard product={buildProduct({ likes: [] })} />);

    expect(screen.getByText("좋아요 0")).toBeInTheDocument();
  });

  it("likes 개수를 그대로 표시한다", () => {
    render(<ProductCard product={buildProduct({ likes: ["u1", "u2", "u3"] })} />);

    expect(screen.getByText("좋아요 3")).toBeInTheDocument();
  });

  it("subCategory 라벨을 매핑해 표시한다", () => {
    render(<ProductCard product={buildProduct({ subCategory: "wedding" })} />);

    expect(screen.getByText("청첩장")).toBeInTheDocument();
  });

  it("제목을 표시한다", () => {
    render(<ProductCard product={buildProduct({ title: "여름 청첩장" })} />);

    expect(screen.getByRole("heading", { name: "여름 청첩장" })).toBeInTheDocument();
  });

  it("rank 미전달 시 순위 배지를 렌더링하지 않는다", () => {
    render(<ProductCard product={buildProduct()} />);

    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText(/인기 \d+위/)).not.toBeInTheDocument();
  });

  it("rank={1} 전달 시 순위 배지와 sr-only 텍스트를 렌더링한다", () => {
    render(<ProductCard product={buildProduct()} rank={1} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("인기 1위")).toBeInTheDocument();
  });
});
