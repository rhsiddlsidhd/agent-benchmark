import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/shared/types";

vi.mock("@/server/lib/bcrypt", () => ({
  comparePasswords: vi.fn(),
}));

vi.mock("@/server/services", () => ({
  getPrivateGuestbookService: vi.fn(),
  deleteGuestbookService: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { comparePasswords } from "@/server/lib/bcrypt";
import { getPrivateGuestbookService, deleteGuestbookService } from "@/server/services";
import { deleteGuestbook } from "./deleteGuestbook";

const COUPLE_INFO_ID = "couple-1";

const buildFormData = (overrides?: Record<string, string>) => {
  const formData = new FormData();
  const fields: Record<string, string> = {
    password: "1234",
    guestbookId: "guestbook-1",
    coupleInfoId: COUPLE_INFO_ID,
    productId: "product-1",
    ...overrides,
  };
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return formData;
};

describe("deleteGuestbook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("입력값 검증에 실패하면 VALIDATION을 리턴한다", async () => {
    const result = await deleteGuestbook(null, buildFormData({ guestbookId: "" }));

    expect(result.success).toBe(false);
    expect(getPrivateGuestbookService).not.toHaveBeenCalled();
  });

  it("게시글을 찾을 수 없으면 NOT_FOUND를 리턴한다", async () => {
    vi.mocked(getPrivateGuestbookService).mockResolvedValue(null);

    const result = await deleteGuestbook(null, buildFormData());

    expect(result).toEqual({
      success: false,
      error: { category: "NOT_FOUND", message: "해당 게시글을 찾을 수 없습니다." },
    });
    expect(deleteGuestbookService).not.toHaveBeenCalled();
  });

  it("비밀번호가 틀리면 UNAUTHENTICATED를 리턴한다", async () => {
    vi.mocked(getPrivateGuestbookService).mockResolvedValue({ password: "hashed" } as never);
    vi.mocked(comparePasswords).mockResolvedValue(false);

    const result = await deleteGuestbook(null, buildFormData());

    expect(result).toEqual({
      success: false,
      error: { category: "UNAUTHENTICATED", message: "비밀번호가 일치하지 않습니다." },
    });
    expect(deleteGuestbookService).not.toHaveBeenCalled();
  });

  it("삭제 결과가 실패하면 INTERNAL을 리턴한다", async () => {
    vi.mocked(getPrivateGuestbookService).mockResolvedValue({ password: "hashed" } as never);
    vi.mocked(comparePasswords).mockResolvedValue(true);
    vi.mocked(deleteGuestbookService).mockResolvedValue({ acknowledged: true, deletedCount: 0 } as never);

    const result = await deleteGuestbook(null, buildFormData());

    expect(result).toEqual({
      success: false,
      error: { category: "INTERNAL", message: "게시글 삭제에 실패했습니다." },
    });
  });

  it("services가 던진 AppError를 리턴값으로 번역한다", async () => {
    vi.mocked(getPrivateGuestbookService).mockRejectedValue(
      new AppError("INTERNAL", "조회에 실패했습니다."),
    );

    const result = await deleteGuestbook(null, buildFormData());

    expect(result).toEqual({
      success: false,
      error: {
        category: "INTERNAL",
        message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        fieldErrors: undefined,
      },
    });
  });

  it("정상 경로: 게시글 삭제 성공 메시지를 리턴한다", async () => {
    vi.mocked(getPrivateGuestbookService).mockResolvedValue({ password: "hashed" } as never);
    vi.mocked(comparePasswords).mockResolvedValue(true);
    vi.mocked(deleteGuestbookService).mockResolvedValue({ acknowledged: true, deletedCount: 1 } as never);

    const result = await deleteGuestbook(null, buildFormData());

    expect(deleteGuestbookService).toHaveBeenCalledWith("guestbook-1");
    expect(result).toEqual({
      success: true,
      data: { message: "게시글이 성공적으로 삭제되었습니다." },
    });
  });
});
