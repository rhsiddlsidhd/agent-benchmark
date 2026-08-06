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

  it("신규 4개 카테고리(favor/accessory/guestbook/ceremony)도 유효하다 (REQ-1)", () => {
    expect(isProductCategory("favor")).toBe(true);
    expect(isProductCategory("accessory")).toBe(true);
    expect(isProductCategory("guestbook")).toBe(true);
    expect(isProductCategory("ceremony")).toBe(true);
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
    expect(isSubCategory("first-birthday")).toBe(true);
  });

  it("신규 14개 서브카테고리가 전부 유효하다 (REQ-1, 라벨맵 누락 시 여기서 false로 조용히 깨짐)", () => {
    const newSubCategories = [
      "candle",
      "diffuser",
      "soap",
      "magnet",
      "handkerchief",
      "ring-pillow",
      "welcome-board",
      "polaroid-frame",
      "book",
      "stamp",
      "candle-holder",
      "escort-card",
      "program-book",
      "aisle-runner",
    ];

    newSubCategories.forEach((value) => {
      expect(isSubCategory(value)).toBe(true);
    });
  });

  it("business-card 전용이었던 서브 카테고리(store/creator)는 더 이상 유효하지 않다", () => {
    expect(isSubCategory("store")).toBe(false);
    expect(isSubCategory("creator")).toBe(false);
  });
});

describe("getCategoryOptions", () => {
  it("카테고리 5개(신규 4개 포함)를 리턴한다", () => {
    const options = getCategoryOptions();

    expect(options).toEqual([
      { value: "invitation", label: "초대장" },
      { value: "favor", label: "답례품" },
      { value: "accessory", label: "웨딩소품" },
      { value: "guestbook", label: "방명록 굿즈" },
      { value: "ceremony", label: "예식 용품" },
    ]);
  });

  it("includeAll이면 전체 옵션이 맨 앞에 추가된다", () => {
    const options = getCategoryOptions(true);

    expect(options[0]).toEqual({ value: "all", label: "전체" });
    expect(options).toHaveLength(6);
  });
});

describe("getSubCategoryOptions", () => {
  it("invitation의 서브 카테고리 2개를 label과 함께 리턴한다", () => {
    const options = getSubCategoryOptions("invitation");

    expect(options).toEqual([
      { value: "wedding", label: "청첩장" },
      { value: "first-birthday", label: "돌잔치" },
    ]);
  });

  it("favor의 서브 카테고리 5개를 label과 함께 리턴한다", () => {
    const options = getSubCategoryOptions("favor");

    expect(options).toEqual([
      { value: "candle", label: "캔들" },
      { value: "diffuser", label: "디퓨저" },
      { value: "soap", label: "비누" },
      { value: "magnet", label: "마그넷" },
      { value: "handkerchief", label: "손수건" },
    ]);
  });

  it("ceremony의 서브 카테고리 4개를 label과 함께 리턴한다", () => {
    const options = getSubCategoryOptions("ceremony");

    expect(options).toEqual([
      { value: "candle-holder", label: "캔들홀더" },
      { value: "escort-card", label: "에스코트 카드" },
      { value: "program-book", label: "예식 순서지" },
      { value: "aisle-runner", label: "아일 러너" },
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

  it("신규 카테고리 라벨도 역조회된다 (REQ-1, /api/products/search 접점)", () => {
    expect(findProductCategoriesByTerm("답례")).toEqual(["favor"]);
    expect(findProductCategoriesByTerm("ceremony")).toEqual(["ceremony"]);
  });
});

describe("findSubCategoriesByTerm", () => {
  it("라벨에 부분일치하면 해당 서브카테고리 key를 리턴한다 (부분일치 — '돌잔' -> '돌잔치')", () => {
    expect(findSubCategoriesByTerm("돌잔")).toEqual(["first-birthday"]);
  });

  it("완전히 일치하는 라벨도 매칭한다", () => {
    expect(findSubCategoriesByTerm("청첩장")).toEqual(["wedding"]);
  });

  it("대소문자를 무시한다 (enum key 대문자)", () => {
    expect(findSubCategoriesByTerm("WEDD")).toEqual(["wedding"]);
  });

  it("enum key에 부분일치해도 매칭한다", () => {
    expect(findSubCategoriesByTerm("wedd")).toEqual(["wedding"]);
  });

  it("2글자 미만이면 빈 배열을 리턴한다 (가드 없으면 '청첩장'에 매칭됐을 '장')", () => {
    expect(findSubCategoriesByTerm("장")).toEqual([]);
  });

  it("어떤 라벨/key와도 안 겹치면 빈 배열을 리턴한다", () => {
    expect(findSubCategoriesByTerm("웨딩드레스")).toEqual([]);
  });

  it("신규 서브카테고리 라벨도 역조회된다 (REQ-1)", () => {
    expect(findSubCategoriesByTerm("캔들")).toEqual(["candle", "candle-holder"]);
  });
});
