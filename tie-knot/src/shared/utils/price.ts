export const formatPriceWithComma = (value: number): string => {
  // Stryker disable next-line ConditionalExpression: (0).toLocaleString()도 "0"이라 이 분기는 결과에 영향 없는 equivalent mutant
  if (value === 0) return "0";

  return value.toLocaleString();
};

export const calculatePrice = (
  price: number,
  discount: { discountType: string; value: number },
) => {
  // Stryker disable next-line EqualityOperator: value===0일 때 rate/amount 어느 분기를 타도 결과가 price로 동일해 <=/< 차이가 관측 안 되는 equivalent mutant
  if (!discount || discount.value <= 0) return price;

  if (discount.discountType === "rate") {
    // 0.3 이면 30% 할인이므로: price * (1 - 0.3)
    // 소수점 연산 오차 방지를 위해 Math.floor 사용 권장
    return Math.floor(price * (1 - discount.value));
  } else if (discount.discountType === "amount") {
    // 정액 할인은 그대로 차감
    return Math.max(0, price - discount.value);
  }

  return price;
};
