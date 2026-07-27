import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "./SignupForm";

describe("SignupForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("약관에 모두 동의하기 전에는 제출 버튼이 비활성화된다", () => {
    render(<SignupForm action={vi.fn()} pending={false} state={null} />);

    expect(screen.getByRole("button", { name: "회원가입" })).toBeDisabled();
  });

  it("이용약관/개인정보 모두 동의하면 제출 버튼이 활성화되고, 제출 시 action이 호출된다", async () => {
    const action = vi.fn();
    const user = userEvent.setup();
    render(<SignupForm action={action} pending={false} state={null} />);

    await user.click(screen.getByRole("checkbox", { name: /이용약관/ }));
    await user.click(screen.getByRole("checkbox", { name: /개인정보 처리방침/ }));

    const submitButton = screen.getByRole("button", { name: "회원가입" });
    expect(submitButton).toBeEnabled();

    await user.type(screen.getByLabelText("이름"), "홍길동");
    await user.type(screen.getByLabelText("이메일"), "a@b.com");
    await user.type(screen.getByLabelText("전화번호"), "010-1234-5678");
    await user.type(screen.getByLabelText("비밀번호"), "password1234");
    await user.type(screen.getByLabelText("비밀번호 확인"), "password1234");
    await user.click(submitButton);

    expect(action).toHaveBeenCalled();
  });

  it("로그인 페이지로 가는 링크를 보여준다", () => {
    render(<SignupForm action={vi.fn()} pending={false} state={null} />);

    expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute("href", "/login");
  });
});
