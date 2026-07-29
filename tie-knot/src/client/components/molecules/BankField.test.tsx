import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BankField } from "./BankField";

const banks = [
  { bank: "004", name: { ko: "국민은행", en: "KB" } },
  { bank: "088", name: { ko: "신한은행", en: "Shinhan" } },
] as unknown as Parameters<typeof BankField>[0]["banks"];

describe("BankField", () => {
  it("기본 계좌 정보를 렌더링한다", () => {
    render(
      <BankField
        id="account"
        defaultBankName="004"
        defaultAccountNumber="123456"
        banks={banks}
      />,
    );

    expect(screen.getByDisplayValue("123456")).toBeInTheDocument();
  });

  it("계좌번호를 입력하면 값이 갱신된다", async () => {
    const user = userEvent.setup();
    render(<BankField id="account" banks={banks} />);

    const accountInput = screen.getByPlaceholderText("계좌번호");
    await user.type(accountInput, "999999");

    expect(screen.getByDisplayValue("999999")).toBeInTheDocument();
  });
});
