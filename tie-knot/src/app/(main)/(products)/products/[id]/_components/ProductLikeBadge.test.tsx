import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/server/actions", () => ({
  toggleProductLike: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

import { toast } from "sonner";
import { toggleProductLike } from "@/server/actions";
import { useAuthStore } from "@/client/store";
import { ProductLikeBadge } from "./ProductLikeBadge";

describe("ProductLikeBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();
  });

  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it("로그인하지 않은 상태에서 클릭하면 안내 토스트만 띄우고 서버 액션을 호출하지 않는다", async () => {
    const user = userEvent.setup();
    render(
      <ProductLikeBadge productId="product-1" productLikes={[]} showCount />,
    );

    await user.click(screen.getByText("0"));

    expect(toast.error).toHaveBeenCalledWith(
      "좋아요를 누르려면 로그인이 필요합니다.",
    );
    expect(toggleProductLike).not.toHaveBeenCalled();
  });

  it("로그인 상태에서 클릭하면 낙관적으로 카운트를 올리고 서버 액션을 호출한다", async () => {
    useAuthStore.getState().setSession({
      role: "USER",
      email: "a@b.com",
      userId: "user-1",
    });
    vi.mocked(toggleProductLike).mockResolvedValue({
      success: true,
      data: { message: "좋아요 업데이트에 성공하였습니다." },
    });
    const user = userEvent.setup();

    render(
      <ProductLikeBadge productId="product-1" productLikes={[]} showCount />,
    );

    await user.click(screen.getByText("0"));

    expect(await screen.findByText("1")).toBeInTheDocument();
    await waitFor(() => {
      expect(toggleProductLike).toHaveBeenCalledWith("product-1");
    });
  });

  it("서버 액션 실패 시 낙관적 업데이트를 롤백하고 에러 토스트를 띄운다", async () => {
    useAuthStore.getState().setSession({
      role: "USER",
      email: "a@b.com",
      userId: "user-1",
    });
    vi.mocked(toggleProductLike).mockResolvedValue({
      success: false,
      error: { category: "NOT_FOUND", message: "상품을 찾을 수 없습니다." },
    });
    const user = userEvent.setup();

    render(
      <ProductLikeBadge productId="product-1" productLikes={[]} showCount />,
    );

    await user.click(screen.getByText("0"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("상품을 찾을 수 없습니다.");
    });
    expect(await screen.findByText("0")).toBeInTheDocument();
  });
});
