import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mutateMock, pushMock, refreshMock, useAuthMock } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
  useAuthMock: vi.fn(),
}));

vi.mock("swr", () => ({ mutate: mutateMock }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));
vi.mock("@/client/hooks", () => ({ useAuth: useAuthMock }));
vi.mock("@/server/actions", () => ({ logoutUser: vi.fn().mockResolvedValue(undefined) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { logoutUser } from "@/server/actions";
import { UserAccountNav } from "./UserAccountNav";

describe("UserAccountNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({
      session: { role: "USER", email: "a@b.com", userId: "user-1" },
      isLoading: false,
    });
  });

  it("로그아웃 클릭 시 logoutUser 액션 호출 후 세션 캐시를 비운다", async () => {
    const user = userEvent.setup();
    render(<UserAccountNav />);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("로그아웃"));

    expect(logoutUser).toHaveBeenCalledOnce();
    expect(mutateMock).toHaveBeenCalledWith("/api/auth/me", null, false);
    expect(pushMock).toHaveBeenCalledWith("/");
  });
});
