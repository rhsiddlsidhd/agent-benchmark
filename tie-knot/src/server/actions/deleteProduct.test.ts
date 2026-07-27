import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/shared/types";

vi.mock("@/server/services", () => ({
  requireAuth: vi.fn(),
  deleteProductService: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { requireAuth, deleteProductService } from "@/server/services";
import { deleteProduct } from "./deleteProduct";

const PRODUCT_ID = "product-1";

describe("deleteProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("관리자가 아니면 FORBIDDEN을 리턴한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "USER",
      email: "a@b.com",
      userId: "user-1",
    });

    const result = await deleteProduct(PRODUCT_ID);

    expect(result).toEqual({
      success: false,
      error: { category: "FORBIDDEN", message: "관리자 권한이 필요합니다." },
    });
    expect(deleteProductService).not.toHaveBeenCalled();
  });

  it("services가 던진 AppError를 리턴값으로 번역한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "ADMIN",
      email: "a@b.com",
      userId: "admin-1",
    });
    vi.mocked(deleteProductService).mockRejectedValue(
      new AppError("INTERNAL", "상품 삭제에 실패했습니다."),
    );

    const result = await deleteProduct(PRODUCT_ID);

    expect(result).toEqual({
      success: false,
      error: {
        category: "INTERNAL",
        message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        fieldErrors: undefined,
      },
    });
  });

  it("정상 경로: 상품 삭제 성공 메시지를 리턴한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "ADMIN",
      email: "a@b.com",
      userId: "admin-1",
    });
    vi.mocked(deleteProductService).mockResolvedValue(true as never);

    const result = await deleteProduct(PRODUCT_ID);

    expect(deleteProductService).toHaveBeenCalledWith(PRODUCT_ID);
    expect(result).toEqual({
      success: true,
      data: { message: "상품이 성공적으로 삭제되었습니다." },
    });
  });
});
