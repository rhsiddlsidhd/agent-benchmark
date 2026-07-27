import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mutateMock, pushMock } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock("swr", () => ({ mutate: mutateMock }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));
vi.mock("@/server/actions", () => ({ loginUser: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import { loginUser } from "@/server/actions";
import { LoginForm } from "./LoginForm";

describe("LoginForm (컨테이너)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("로그인 성공 시 세션 캐시를 낙관적으로 갱신하고 홈으로 이동한다", async () => {
    vi.mocked(loginUser).mockResolvedValue({
      success: true,
      data: { role: "USER", email: "a@b.com", userId: "user-1" },
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("이메일"), "a@b.com");
    await user.type(screen.getByLabelText("비밀번호"), "password1234");
    await user.click(screen.getByRole("button", { name: /로그인/ }));

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith(
        "/api/auth/me",
        { role: "USER", email: "a@b.com", userId: "user-1" },
        false,
      );
    });
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("로그인 실패 시 세션 캐시를 갱신하지 않는다", async () => {
    vi.mocked(loginUser).mockResolvedValue({
      success: false,
      error: { category: "VALIDATION", message: "이메일 또는 비밀번호가 올바르지 않습니다." },
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("이메일"), "a@b.com");
    await user.type(screen.getByLabelText("비밀번호"), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /로그인/ }));

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalled();
    });
    expect(mutateMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
