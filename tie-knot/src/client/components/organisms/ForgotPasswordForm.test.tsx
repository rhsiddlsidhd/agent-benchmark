import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

describe("ForgotPasswordForm", () => {
  it("성공 전에는 아이디 찾기/로그인 링크를 보여준다", () => {
    render(<ForgotPasswordForm action={vi.fn()} pending={false} state={null} />);

    expect(screen.getByRole("link", { name: "아이디 찾기" })).toHaveAttribute("href", "/find-id");
    expect(screen.getByRole("link", { name: "로그인으로 돌아가기" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("전송 성공 후에는 로그인으로 돌아가는 링크를 보여준다", () => {
    render(
      <ForgotPasswordForm
        action={vi.fn()}
        pending={false}
        state={{ success: true, data: { message: "전송됨", email: "a@b.com" } }}
      />,
    );

    expect(screen.getByRole("link", { name: "로그인으로 돌아가기" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
