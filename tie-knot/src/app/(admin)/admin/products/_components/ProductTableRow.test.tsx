import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Product } from "@/server/services";

vi.mock("./ProductTableRowAction", () => ({
  ProductTableRowAction: (): null => null,
}));

vi.mock("./ProductTableRowSelect", () => ({
  ProductTableRowSelect: (): null => null,
}));

import { ProductTableRow } from "./ProductTableRow";

const buildProduct = (overrides?: Partial<Product>): Product =>
  ({
    _id: "507f1f77bcf86cd799439011",
    authorId: "507f1f77bcf86cd799439012",
    title: "봄맞이 청첩장",
    description: "봄 시즌 한정 모바일 청첩장 템플릿입니다.",
    thumbnail: "https://example.com/thumbnail.jpg",
    price: 9900,
    category: "invitation",
    subCategory: "wedding",
    isPremium: false,
    featureIds: [],
    isFeatured: false,
    priority: 3,
    likes: ["u1", "u2"],
    views: 120,
    salesCount: 7,
    discount: { discountType: "rate", value: 0 },
    status: "active",
    theme: "default",
    isLiked: false,
    discountedPrice: 9900,
    images: [],
    minQuantity: 1,
    maxQuantity: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    ...overrides,
  }) as Product;

describe("ProductTableRow", () => {
  it("카테고리/서브카테고리 라벨과 상품 정보를 렌더링한다", () => {
    render(
      <table>
        <tbody>
          <ProductTableRow product={buildProduct()} />
        </tbody>
      </table>,
    );

    expect(screen.getByText("봄맞이 청첩장")).toBeInTheDocument();
    expect(screen.getByText("초대장")).toBeInTheDocument();
    expect(screen.getByText("청첩장")).toBeInTheDocument();
    expect(screen.getByText("9,900원")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("프리미엄/추천 배지는 해당 플래그가 true일 때만 렌더링한다", () => {
    render(
      <table>
        <tbody>
          <ProductTableRow
            product={buildProduct({ isPremium: true, isFeatured: true })}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByText("프리미엄")).toBeInTheDocument();
    expect(screen.getByText("추천")).toBeInTheDocument();
  });

  it("프리미엄/추천이 아니면 해당 배지를 렌더링하지 않는다", () => {
    render(
      <table>
        <tbody>
          <ProductTableRow product={buildProduct()} />
        </tbody>
      </table>,
    );

    expect(screen.queryByText("프리미엄")).not.toBeInTheDocument();
    expect(screen.queryByText("추천")).not.toBeInTheDocument();
  });
});
