import { describe, it, expect } from "vitest";
import {
  isProductCategory,
  isSubCategory,
  getCategoryOptions,
  getSubCategoryOptions,
} from "./category";

describe("isProductCategory", () => {
  it("invitation은 유효한 카테고리다", () => {
    expect(isProductCategory("invitation")).toBe(true);
  });

  it("business-card는 더 이상 유효한 카테고리가 아니다 (레거시 제거)", () => {
    expect(isProductCategory("business-card")).toBe(false);
  });

  it("알 수 없는 값은 유효하지 않다", () => {
    expect(isProductCategory("unknown")).toBe(false);
  });
});

describe("isSubCategory", () => {
  it("invitation의 서브 카테고리는 유효하다", () => {
    expect(isSubCategory("wedding")).toBe(true);
    expect(isSubCategory("vip")).toBe(true);
  });

  it("business-card 전용이었던 서브 카테고리(store/creator)는 더 이상 유효하지 않다", () => {
    expect(isSubCategory("store")).toBe(false);
    expect(isSubCategory("creator")).toBe(false);
  });
});

describe("getCategoryOptions", () => {
  it("invitation 하나만 리턴한다", () => {
    const options = getCategoryOptions();

    expect(options).toEqual([{ value: "invitation", label: "초대장" }]);
  });

  it("includeAll이면 전체 옵션이 맨 앞에 추가된다", () => {
    const options = getCategoryOptions(true);

    expect(options[0]).toEqual({ value: "all", label: "전체" });
    expect(options).toHaveLength(2);
  });
});

describe("getSubCategoryOptions", () => {
  it("invitation의 서브 카테고리 4개를 label과 함께 리턴한다", () => {
    const options = getSubCategoryOptions("invitation");

    expect(options).toEqual([
      { value: "wedding", label: "청첩장" },
      { value: "first-birthday", label: "돌잔치" },
      { value: "vip", label: "VIP" },
      { value: "business", label: "비즈니스" },
    ]);
  });
});
