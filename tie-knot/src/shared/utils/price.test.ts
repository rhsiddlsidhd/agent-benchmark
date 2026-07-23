import { describe, it, expect } from "vitest";
import { calculatePrice, formatPriceWithComma } from "./price";

describe("formatPriceWithComma", () => {
  it("0은 콤마 없이 \"0\"을 반환한다", () => {
    expect(formatPriceWithComma(0)).toBe("0");
  });

  it("천 단위 콤마를 붙인다", () => {
    expect(formatPriceWithComma(1234567)).toBe("1,234,567");
  });

  it("음수도 콤마를 붙여 포맷한다", () => {
    expect(formatPriceWithComma(-1000)).toBe("-1,000");
  });
});

describe("calculatePrice", () => {
  it("할인 정보가 없으면 원가를 그대로 반환한다", () => {
    expect(calculatePrice(10000, { discountType: "rate", value: 0 })).toBe(
      10000,
    );
  });

  it("rate 할인은 소수점 할인율을 적용하고 내림한다", () => {
    expect(calculatePrice(10000, { discountType: "rate", value: 0.3 })).toBe(
      7000,
    );
  });

  it("amount 할인은 정액 차감하고 0 밑으로 내려가지 않는다", () => {
    expect(
      calculatePrice(1000, { discountType: "amount", value: 5000 }),
    ).toBe(0);
  });

  it("discount.value가 음수면 할인 로직을 타지 않고 원가를 그대로 반환한다", () => {
    expect(calculatePrice(10000, { discountType: "rate", value: -5 })).toBe(
      10000,
    );
  });

  it("알 수 없는 discountType이면 원가를 그대로 반환한다", () => {
    expect(
      calculatePrice(10000, { discountType: "unknown", value: 500 }),
    ).toBe(10000);
  });
});
