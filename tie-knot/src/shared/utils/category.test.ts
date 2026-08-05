import { describe, it, expect } from "vitest";
import {
  isProductCategory,
  isSubCategory,
  getCategoryOptions,
  getSubCategoryOptions,
  findProductCategoriesByTerm,
  findSubCategoriesByTerm,
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

describe("findProductCategoriesByTerm", () => {
  it("라벨에 부분일치하면 해당 카테고리 key를 리턴한다", () => {
    expect(findProductCategoriesByTerm("초대")).toEqual(["invitation"]);
  });

  it("enum key에 부분일치해도 매칭한다 (영문 입력 대응)", () => {
    expect(findProductCategoriesByTerm("invit")).toEqual(["invitation"]);
  });

  it("대소문자를 무시한다", () => {
    expect(findProductCategoriesByTerm("INVIT")).toEqual(["invitation"]);
  });

  it("2글자 미만이면 빈 배열을 리턴한다 (오탐 방지)", () => {
    expect(findProductCategoriesByTerm("초")).toEqual([]);
    expect(findProductCategoriesByTerm("i")).toEqual([]);
  });

  it("빈 문자열이면 빈 배열을 리턴한다", () => {
    expect(findProductCategoriesByTerm("")).toEqual([]);
  });

  it("어떤 라벨/key와도 안 겹치면 빈 배열을 리턴한다", () => {
    expect(findProductCategoriesByTerm("웨딩드레스")).toEqual([]);
  });
});

describe("findSubCategoriesByTerm", () => {
  it("라벨에 부분일치하면 해당 서브카테고리 key를 리턴한다 (부분일치 — '돌잔' -> '돌잔치')", () => {
    expect(findSubCategoriesByTerm("돌잔")).toEqual(["first-birthday"]);
  });

  it("완전히 일치하는 라벨도 매칭한다", () => {
    expect(findSubCategoriesByTerm("청첩장")).toEqual(["wedding"]);
  });

  it("대소문자를 무시한다 (VIP 라벨)", () => {
    expect(findSubCategoriesByTerm("vip")).toEqual(["vip"]);
  });

  it("enum key에 부분일치해도 매칭한다", () => {
    expect(findSubCategoriesByTerm("wedd")).toEqual(["wedding"]);
  });

  it("2글자 미만이면 빈 배열을 리턴한다", () => {
    expect(findSubCategoriesByTerm("비")).toEqual([]);
  });

  it("어떤 라벨/key와도 안 겹치면 빈 배열을 리턴한다", () => {
    expect(findSubCategoriesByTerm("웨딩드레스")).toEqual([]);
  });
});
