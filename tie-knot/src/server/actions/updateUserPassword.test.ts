import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/shared/types";

vi.mock("@/server/lib/jose", () => ({
  decrypt: vi.fn(),
}));

vi.mock("@/server/services", () => ({
  changePassword: vi.fn(),
}));

vi.mock("@/server/lib/cookies", () => ({
  deleteCookie: vi.fn().mockResolvedValue(undefined),
}));

import { decrypt } from "@/server/lib/jose";
import { changePassword } from "@/server/services";
import { deleteCookie } from "@/server/lib/cookies";
import { updateUserPassword } from "./updateUserPassword";

const buildFormData = (overrides?: Record<string, string>) => {
  const formData = new FormData();
  const fields: Record<string, string> = {
    token: "entry-token",
    password: "pw1234!",
    confirmPassword: "pw1234!",
    ...overrides,
  };
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return formData;
};

describe("updateUserPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("입력값 검증에 실패하면 VALIDATION을 리턴한다", async () => {
    const result = await updateUserPassword(null, new FormData());

    expect(result).toEqual({
      success: false,
      error: {
        category: "VALIDATION",
        message: "입력한 정보가 올바르지 않습니다. 다시 확인해주세요.",
        fieldErrors: expect.any(Object),
      },
    });
    expect(decrypt).not.toHaveBeenCalled();
  });

  it("토큰이 유효하지 않으면(payload.id 없음) UNAUTHENTICATED를 리턴한다", async () => {
    vi.mocked(decrypt).mockResolvedValue({ payload: {} } as never);

    const result = await updateUserPassword(null, buildFormData());

    expect(result).toEqual({
      success: false,
      error: {
        category: "UNAUTHENTICATED",
        message:
          "유효하지 않거나 만료된 토큰입니다. 비밀번호 재설정을 다시 시도해주세요.",
      },
    });
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("해당 계정을 찾을 수 없으면 NOT_FOUND를 리턴한다", async () => {
    vi.mocked(decrypt).mockResolvedValue({
      payload: { id: "a@b.com" },
    } as never);
    vi.mocked(changePassword).mockResolvedValue(false);

    const result = await updateUserPassword(null, buildFormData());

    expect(result).toEqual({
      success: false,
      error: {
        category: "NOT_FOUND",
        message: "해당 계정을 찾을 수 없습니다. 이메일 주소를 확인해주세요.",
      },
    });
    expect(deleteCookie).not.toHaveBeenCalled();
  });

  it("정상 경로: 비밀번호 변경 후 userEmail 쿠키를 삭제한다", async () => {
    vi.mocked(decrypt).mockResolvedValue({
      payload: { id: "a@b.com" },
    } as never);
    vi.mocked(changePassword).mockResolvedValue(true);

    const result = await updateUserPassword(null, buildFormData());

    expect(changePassword).toHaveBeenCalledWith("a@b.com", "pw1234!");
    expect(deleteCookie).toHaveBeenCalledWith("userEmail");
    expect(result).toEqual({
      success: true,
      data: { message: "비밀번호가 성공적으로 변경되었습니다." },
    });
  });

  it("services가 던진 AppError를 리턴값으로 번역한다", async () => {
    vi.mocked(decrypt).mockRejectedValue(
      new AppError("UNAUTHENTICATED", "유효하지 않거나 만료된 토큰입니다. 다시 로그인해주세요."),
    );

    const result = await updateUserPassword(null, buildFormData());

    expect(result).toEqual({
      success: false,
      error: {
        category: "UNAUTHENTICATED",
        message: "유효하지 않거나 만료된 토큰입니다. 다시 로그인해주세요.",
        fieldErrors: undefined,
      },
    });
  });
});
