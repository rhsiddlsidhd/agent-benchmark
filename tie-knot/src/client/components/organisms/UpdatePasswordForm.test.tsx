import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UpdatePasswordForm } from "./UpdatePasswordForm";

describe("UpdatePasswordForm", () => {
  it("제출 시 action이 호출된다", async () => {
    const action = vi.fn();
    const user = userEvent.setup();
    render(<UpdatePasswordForm action={action} pending={false} state={null} token="token-1" />);

    await user.type(screen.getByLabelText("비밀번호"), "password1234!A");
    await user.type(screen.getByLabelText("비밀번호 확인"), "password1234!A");
    await user.click(screen.getByRole("button", { name: /비밀번호 변경/ }));

    expect(action).toHaveBeenCalled();
  });

  it("로그인으로 돌아가는 링크를 보여준다", () => {
    render(<UpdatePasswordForm action={vi.fn()} pending={false} state={null} token="token-1" />);

    expect(screen.getByRole("link", { name: "로그인으로 돌아가기" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
