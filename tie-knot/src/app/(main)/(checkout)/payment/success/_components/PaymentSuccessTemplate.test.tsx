import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PaymentSuccessTemplate } from "./PaymentSuccessTemplate";

describe("PaymentSuccessTemplate", () => {
  it("주문번호와 안내 문구를 렌더링한다", () => {
    render(<PaymentSuccessTemplate orderId="order-123" />);

    expect(screen.getByText("결제가 완료되었습니다!")).toBeInTheDocument();
    expect(screen.getByText("order-123")).toBeInTheDocument();
  });

  it("홈으로 이동/주문 내역 확인 링크를 렌더링한다", () => {
    render(<PaymentSuccessTemplate orderId="order-123" />);

    expect(screen.getByRole("link", { name: /홈으로 이동/ })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: /주문 내역 확인/ })).toHaveAttribute(
      "href",
      "/my-orders",
    );
  });
});
