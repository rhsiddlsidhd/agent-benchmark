export const formatPriceWithComma = (value: number): string => {
  if (value <= 0) return value.toString();

  return value.toLocaleString();
};

export const calculatePrice = (
  price: number,
  discount: { discountType: string; value: number },
) => {
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
