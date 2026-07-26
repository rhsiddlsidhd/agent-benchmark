import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/shared/types";

vi.mock("@/server/services", () => ({
  requireAuth: vi.fn(),
  updateProductLikeService: vi.fn(),
}));

import { requireAuth, updateProductLikeService } from "@/server/services";
import { toggleProductLike } from "./toggleProductLike";

describe("toggleProductLike", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("인증 세션이 없으면 UNAUTHENTICATED를 리턴한다", async () => {
    vi.mocked(requireAuth).mockRejectedValue(
      new AppError("UNAUTHENTICATED", "인증이 필요합니다."),
    );

    const result = await toggleProductLike("product-1");

    expect(result).toEqual({
      success: false,
      error: { category: "UNAUTHENTICATED", message: "인증이 필요합니다.", fieldErrors: undefined },
    });
    expect(updateProductLikeService).not.toHaveBeenCalled();
  });

  it("상품이 없거나 업데이트에 실패하면 NOT_FOUND를 리턴한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "USER",
      email: "a@b.com",
      userId: "user-1",
    });
    vi.mocked(updateProductLikeService).mockResolvedValue(false);

    const result = await toggleProductLike("product-1");

    expect(updateProductLikeService).toHaveBeenCalledWith("product-1", "user-1");
    expect(result).toEqual({
      success: false,
      error: {
        category: "NOT_FOUND",
        message: "상품을 찾을 수 없거나 좋아요 업데이트에 실패했습니다.",
        fieldErrors: undefined,
      },
    });
  });

  it("정상 경로: 좋아요 업데이트 성공 메시지를 리턴한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "USER",
      email: "a@b.com",
      userId: "user-1",
    });
    vi.mocked(updateProductLikeService).mockResolvedValue(true);

    const result = await toggleProductLike("product-1");

    expect(result).toEqual({
      success: true,
      data: { message: "좋아요 업데이트에 성공하였습니다." },
    });
  });
});
