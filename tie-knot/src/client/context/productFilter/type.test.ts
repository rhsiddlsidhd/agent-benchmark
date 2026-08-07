import { describe, it, expect } from "vitest";
import { ProductFilterState, ProductFilterAction } from "./type";

describe("ProductFilterState/ProductFilterAction 타입 계약", () => {
  it("ProductFilterState는 필터 UI가 쓰는 필드를 전부 포함한다", () => {
    const state: ProductFilterState = {
      keyword: "",
      subCategory: "all",
      isOpen: false,
      sortBy: "ALL",
      price: "ALL",
      premiumFeat: [],
    };

    expect(state.subCategory).toBe("all");
  });

  it("ProductFilterAction은 reducer가 처리하는 모든 액션 타입을 포함한다", () => {
    const actions: ProductFilterAction[] = [
      { type: "CHANGE_KEYWORD", payload: "청첩장" },
      { type: "SELECT_SUB_CATEGORY", payload: "wedding" },
      { type: "OPEN_SUGGESTIONS" },
      { type: "CLOSE_SUGGESTIONS" },
      { type: "SELECT_SORT_BY", payload: "LATEST" },
      { type: "SELECT_PRICE", payload: "FREE" },
      { type: "SELECT_PREMIUM_FEAT", payload: "VIDEO" },
      { type: "CLEAR_DETAIL_FILTER", payload: null },
    ];

    expect(actions.map((a) => a.type)).toEqual([
      "CHANGE_KEYWORD",
      "SELECT_SUB_CATEGORY",
      "OPEN_SUGGESTIONS",
      "CLOSE_SUGGESTIONS",
      "SELECT_SORT_BY",
      "SELECT_PRICE",
      "SELECT_PREMIUM_FEAT",
      "CLEAR_DETAIL_FILTER",
    ]);
  });
});
