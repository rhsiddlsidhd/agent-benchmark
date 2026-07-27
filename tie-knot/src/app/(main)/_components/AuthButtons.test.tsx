import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }));

vi.mock("@/client/hooks", () => ({ useAuth: useAuthMock }));
vi.mock("./UserAccountNav", () => ({
  UserAccountNav: () => <div>account-nav</div>,
}));
vi.mock("@/client/components/organisms", () => ({
  LoginEntryButton: () => <div>login-entry</div>,
}));

import { AuthButtons } from "./AuthButtons";

describe("AuthButtons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("로딩 중이면 스켈레톤을 렌더한다", () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: true });

    render(<AuthButtons />);

    expect(screen.queryByText("login-entry")).not.toBeInTheDocument();
    expect(screen.queryByText("account-nav")).not.toBeInTheDocument();
  });

  it("세션이 있으면 UserAccountNav를 렌더한다", () => {
    useAuthMock.mockReturnValue({
      session: { role: "USER", email: "a@b.com", userId: "user-1" },
      isLoading: false,
    });

    render(<AuthButtons />);

    expect(screen.getByText("account-nav")).toBeInTheDocument();
  });

  it("세션이 없으면 로그인 버튼을 렌더한다", () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false });

    render(<AuthButtons />);

    expect(screen.getByText("login-entry")).toBeInTheDocument();
  });
});
