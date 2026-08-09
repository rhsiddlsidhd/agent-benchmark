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

  it("banks가 없으면 은행 선택 옵션 없이 렌더링된다", () => {
    render(<BankField id="account" />);

    expect(screen.getByPlaceholderText("계좌번호")).toBeInTheDocument();
    expect(screen.getByText("은행 선택")).toBeInTheDocument();
  });

  it("은행을 선택하면 값이 갱신된다", async () => {
    const user = userEvent.setup();
    render(<BankField id="account" banks={banks} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "국민은행" }));

    expect(screen.getByText("국민은행")).toBeInTheDocument();
  });

  it("defaultBankName/defaultAccountNumber가 리렌더 중 바뀌면 값이 재동기화된다", () => {
    const { rerender } = render(
      <BankField
        id="account"
        defaultBankName="004"
        defaultAccountNumber="111111"
        banks={banks}
      />,
    );

    expect(screen.getByDisplayValue("111111")).toBeInTheDocument();

    rerender(
      <BankField
        id="account"
        defaultBankName="088"
        defaultAccountNumber="222222"
        banks={banks}
      />,
    );

    expect(screen.getByDisplayValue("222222")).toBeInTheDocument();
    expect(screen.getByText("신한은행")).toBeInTheDocument();
  });
});
