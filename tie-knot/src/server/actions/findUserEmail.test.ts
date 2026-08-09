import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/shared/types";

vi.mock("@/server/services", () => ({
  getUserEmail: vi.fn(),
}));

import { getUserEmail } from "@/server/services";
import { findUserEmail } from "./findUserEmail";

const buildFormData = (overrides?: Record<string, string>) => {
  const formData = new FormData();
  const fields: Record<string, string> = {
    name: "홍길동",
    phone: "010-1234-5678",
    ...overrides,
  };
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return formData;
};

describe("findUserEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("입력값 검증에 실패하면 VALIDATION을 리턴한다", async () => {
    const result = await findUserEmail(null, new FormData());

    expect(result).toEqual({
      success: false,
      error: {
        category: "VALIDATION",
        message: "입력 값을 확인해주세요.",
        fieldErrors: expect.any(Object),
      },
    });
    expect(getUserEmail).not.toHaveBeenCalled();
  });

  it("정상 경로: 이름/전화번호로 이메일을 찾아 리턴한다", async () => {
    vi.mocked(getUserEmail).mockResolvedValue("a@b.com");

    const result = await findUserEmail(null, buildFormData());

    expect(getUserEmail).toHaveBeenCalledWith({
      name: "홍길동",
      phone: "010-1234-5678",
    });
    expect(result).toEqual({ success: true, data: { email: "a@b.com" } });
  });

  it("services가 던진 AppError를 리턴값으로 번역한다", async () => {
    vi.mocked(getUserEmail).mockRejectedValue(
      new AppError("NOT_FOUND", "유저를 찾을 수가 없습니다."),
    );

    const result = await findUserEmail(null, buildFormData());

    expect(result).toEqual({
      success: false,
      error: {
        category: "NOT_FOUND",
        message: "유저를 찾을 수가 없습니다.",
        fieldErrors: undefined,
      },
    });
  });
});
