import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FindIdForm } from "./FindIdForm";

describe("FindIdForm", () => {
  it("성공 전에는 비밀번호 찾기/로그인 링크를 보여준다", () => {
    render(<FindIdForm action={vi.fn()} pending={false} state={null} />);

    expect(screen.getByRole("link", { name: "비밀번호 찾기" })).toHaveAttribute("href", "/find-password");
    expect(screen.getByRole("link", { name: "로그인으로 돌아가기" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("아이디 찾기 성공 후에는 로그인/비밀번호 찾기 링크를 보여준다", () => {
    render(
      <FindIdForm action={vi.fn()} pending={false} state={{ success: true, data: { email: "a@b.com" } }} />,
    );

    expect(screen.getByRole("link", { name: "로그인하기" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "비밀번호 찾기" })).toHaveAttribute("href", "/find-password");
  });
});
