import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { initialFilterState } from "@/client/context/productFilter";
import { Product } from "@/server/services";
import { ProductFilters } from "./ProductFilters";

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

describe("ProductFilters", () => {
  it("state를 props로 받아 검색 키워드를 렌더링한다(Context 직접 구독하지 않음)", () => {
    render(
      <ProductFilters
        data={[buildProduct()]}
        category="invitation"
        premiumFeatures={[]}
        state={{ ...initialFilterState, keyword: "봄맞이" }}
        dispatch={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("봄맞이")).toBeInTheDocument();
  });

  it("검색창에 입력하면 dispatch로 CHANGE_KEYWORD를 전달한다", async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn();

    render(
      <ProductFilters
        data={[buildProduct()]}
        category="invitation"
        premiumFeatures={[]}
        state={initialFilterState}
        dispatch={dispatch}
      />,
    );

    await user.type(screen.getByPlaceholderText("상품 검색..."), "봄");

    expect(dispatch).toHaveBeenCalledWith({ type: "CHANGE_KEYWORD", payload: "봄" });
  });

  it("서브카테고리 버튼 클릭 시 dispatch로 SELECT_SUB_CATEGORY를 전달한다", async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn();

    render(
      <ProductFilters
        data={[buildProduct()]}
        category="invitation"
        premiumFeatures={[]}
        state={initialFilterState}
        dispatch={dispatch}
      />,
    );

    await user.click(screen.getByText("전체"));

    expect(dispatch).toHaveBeenCalledWith({
      type: "SELECT_SUB_CATEGORY",
      payload: "all",
    });
  });
});
