import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));
vi.mock("@/server/actions", () => ({ signupUser: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const alertMock = vi.fn();
vi.stubGlobal("alert", alertMock);

import { signupUser } from "@/server/actions";
import { SignupForm } from "./SignupForm";

describe("SignupForm (컨테이너)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("회원가입 성공 시 안내 후 /login으로 이동한다", async () => {
    vi.mocked(signupUser).mockResolvedValue({
      success: true,
      data: { message: "회원가입이 완료되었습니다." },
    });
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.click(screen.getByRole("checkbox", { name: /이용약관/ }));
    await user.click(screen.getByRole("checkbox", { name: /개인정보 처리방침/ }));
    await user.type(screen.getByLabelText("이름"), "홍길동");
    await user.type(screen.getByLabelText("이메일"), "a@b.com");
    await user.type(screen.getByLabelText("전화번호"), "010-1234-5678");
    await user.type(screen.getByLabelText("비밀번호"), "password1234");
    await user.type(screen.getByLabelText("비밀번호 확인"), "password1234");
    await user.click(screen.getByRole("button", { name: "회원가입" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/login");
    });
    expect(alertMock).toHaveBeenCalledWith("회원가입이 완료되었습니다.");
  });
});
