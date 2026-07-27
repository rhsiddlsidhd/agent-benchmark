import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/shared/types";

vi.mock("@/server/services", () => ({
  requireAuth: vi.fn(),
  updateProductService: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { requireAuth, updateProductService } from "@/server/services";
import { updateProductStatus } from "./updateProductStatus";

const PRODUCT_ID = "product-1";

describe("updateProductStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("관리자가 아니면 FORBIDDEN을 리턴한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "USER",
      email: "a@b.com",
      userId: "user-1",
    });

    const result = await updateProductStatus(PRODUCT_ID, "active");

    expect(result).toEqual({
      success: false,
      error: { category: "FORBIDDEN", message: "관리자 권한이 필요합니다." },
    });
    expect(updateProductService).not.toHaveBeenCalled();
  });

  it("services가 던진 AppError를 리턴값으로 번역한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "ADMIN",
      email: "a@b.com",
      userId: "admin-1",
    });
    vi.mocked(updateProductService).mockRejectedValue(
      new AppError("INTERNAL", "상품 상태 변경에 실패했습니다."),
    );

    const result = await updateProductStatus(PRODUCT_ID, "soldOut");

    expect(result).toEqual({
      success: false,
      error: {
        category: "INTERNAL",
        message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        fieldErrors: undefined,
      },
    });
  });

  it("정상 경로: 상품 상태 변경 성공 메시지를 리턴한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "ADMIN",
      email: "a@b.com",
      userId: "admin-1",
    });
    vi.mocked(updateProductService).mockResolvedValue(true as never);

    const result = await updateProductStatus(PRODUCT_ID, "soldOut");

    expect(updateProductService).toHaveBeenCalledWith(PRODUCT_ID, { status: "soldOut" });
    expect(result).toEqual({
      success: true,
      data: { message: "상품 상태가 변경되었습니다." },
    });
  });
});
