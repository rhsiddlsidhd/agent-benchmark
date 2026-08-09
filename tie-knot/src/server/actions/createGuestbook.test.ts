import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/shared/types";

vi.mock("@/server/lib/bcrypt", () => ({
  hashPassword: vi.fn(),
}));

vi.mock("@/server/services", () => ({
  createGuestbookService: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { hashPassword } from "@/server/lib/bcrypt";
import { createGuestbookService } from "@/server/services";
import { createGuestbook } from "./createGuestbook";

const COUPLE_INFO_ID = "couple-1";

const buildFormData = (overrides?: Record<string, string>) => {
  const formData = new FormData();
  const fields: Record<string, string> = {
    coupleInfoId: COUPLE_INFO_ID,
    author: "홍길동",
    password: "1234",
    message: "축하합니다!",
    isPrivate: "false",
    ...overrides,
  };
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return formData;
};

describe("createGuestbook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("입력값 검증에 실패하면 VALIDATION을 리턴한다", async () => {
    const result = await createGuestbook(null, buildFormData({ message: "" }));

    expect(result).toEqual({
      success: false,
      error: { category: "VALIDATION", message: "입력값을 확인해주세요", fieldErrors: expect.any(Object) },
    });
    expect(createGuestbookService).not.toHaveBeenCalled();
  });

  it("services가 던진 AppError를 리턴값으로 번역한다", async () => {
    vi.mocked(hashPassword).mockResolvedValue("hashed");
    vi.mocked(createGuestbookService).mockRejectedValue(
      new AppError("INTERNAL", "방명록 작성에 실패했습니다."),
    );

    const result = await createGuestbook(null, buildFormData());

    expect(result).toEqual({
      success: false,
      error: {
        category: "INTERNAL",
        message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        fieldErrors: undefined,
      },
    });
  });

  it("정상 경로: 비밀번호를 해싱해 저장하고 성공 메시지를 리턴한다", async () => {
    vi.mocked(hashPassword).mockResolvedValue("hashed-password");
    vi.mocked(createGuestbookService).mockResolvedValue(true as never);

    const result = await createGuestbook(null, buildFormData());

    expect(hashPassword).toHaveBeenCalledWith("1234");
    expect(createGuestbookService).toHaveBeenCalledWith({
      data: expect.objectContaining({ password: "hashed-password", author: "홍길동" }),
    });
    expect(result).toEqual({
      success: true,
      data: { message: "방명록 작성이 완료되었습니다." },
    });
  });
});
