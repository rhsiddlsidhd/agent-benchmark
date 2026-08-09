import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }));

vi.mock("@/client/hooks", () => ({ useAuth: useAuthMock }));
vi.mock("@/client/components/atoms", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/client/components/atoms")>();
  const Passthrough = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );
  return {
    ...actual,
    SidebarProvider: Passthrough,
    Sidebar: Passthrough,
    SidebarContent: Passthrough,
    SidebarFooter: Passthrough,
  };
});
vi.mock("@/client/components/organisms", () => ({
  SidebarToggle: (): null => null,
}));
vi.mock("@/client/components/molecules", () => ({
  SidebarNavItem: (): null => null,
}));

import Layout from "./layout";

describe("(my-order) Layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("세션의 email/role을 사이드바 푸터에 렌더한다", () => {
    useAuthMock.mockReturnValue({
      session: { role: "ADMIN", email: "a@b.com", userId: "user-1" },
      isLoading: false,
    });

    render(<Layout>children</Layout>);

    expect(screen.getByText("a@b.com")).toBeInTheDocument();
    expect(screen.getByText("관리자 계정")).toBeInTheDocument();
  });

  it("세션이 없으면 일반 계정으로 표시한다", () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false });

    render(<Layout>children</Layout>);

    expect(screen.getByText("일반 계정")).toBeInTheDocument();
  });
});
