import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PaymentMethodSelector } from "./PaymentMethodSelector";

describe("PaymentMethodSelector", () => {
  it("결제 수단 6종을 라디오로 렌더링하고 기본값(카드)이 선택돼 있다", () => {
    render(<PaymentMethodSelector />);

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(6);
    expect(screen.getByRole("radio", { name: "신용/체크카드 모든 카드 사용 가능" })).toBeChecked();
  });

  it("다른 결제 수단을 클릭하면 그 항목만 선택 상태로 바뀐다", async () => {
    const user = userEvent.setup();
    render(<PaymentMethodSelector />);

    const easyPay = screen.getByRole("radio", { name: "간편결제 카카오페이·네이버페이 등" });
    await user.click(easyPay);

    expect(easyPay).toBeChecked();
    expect(screen.getByRole("radio", { name: "신용/체크카드 모든 카드 사용 가능" })).not.toBeChecked();
  });

  it("error prop이 있으면 에러 메시지를 보여준다", () => {
    render(<PaymentMethodSelector error="결제 수단을 선택해주세요." />);

    expect(screen.getByText("결제 수단을 선택해주세요.")).toBeInTheDocument();
  });
});
