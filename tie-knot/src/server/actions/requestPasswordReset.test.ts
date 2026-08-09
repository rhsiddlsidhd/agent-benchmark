import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/shared/types";

vi.mock("@/server/services", () => ({
  checkEmailDuplicate: vi.fn(),
}));

vi.mock("@/server/lib/jose", () => ({
  encrypt: vi.fn(),
}));

vi.mock("@/server/lib/nodemailer", () => ({
  sendEmail: vi.fn(),
}));

import { checkEmailDuplicate } from "@/server/services";
import { encrypt } from "@/server/lib/jose";
import { sendEmail } from "@/server/lib/nodemailer";
import { requestPasswordReset } from "./requestPasswordReset";

const buildFormData = (overrides?: Record<string, string>) => {
  const formData = new FormData();
  const fields: Record<string, string> = {
    email: "a@b.com",
    ...overrides,
  };
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return formData;
};

describe("requestPasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("입력값 검증에 실패하면 VALIDATION을 리턴한다", async () => {
    const result = await requestPasswordReset(null, new FormData());

    expect(result).toEqual({
      success: false,
      error: {
        category: "VALIDATION",
        message: "입력 값을 확인해주세요.",
        fieldErrors: expect.any(Object),
      },
    });
    expect(checkEmailDuplicate).not.toHaveBeenCalled();
  });

  it("등록되지 않은 이메일이면 VALIDATION을 리턴한다", async () => {
    vi.mocked(checkEmailDuplicate).mockResolvedValue(false);

    const result = await requestPasswordReset(null, buildFormData());

    expect(result).toEqual({
      success: false,
      error: { category: "VALIDATION", message: "등록되지 않은 이메일입니다." },
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("정상 경로: entry token을 발급하고 이메일을 발송한다", async () => {
    vi.mocked(checkEmailDuplicate).mockResolvedValue(true);
    vi.mocked(encrypt).mockResolvedValue("entry-token");
    vi.mocked(sendEmail).mockResolvedValue(undefined as never);

    const result = await requestPasswordReset(null, buildFormData());

    expect(encrypt).toHaveBeenCalledWith({ id: "a@b.com", type: "ENTRY" });
    expect(sendEmail).toHaveBeenCalledWith({
      email: "a@b.com",
      path: expect.any(String),
    });
    expect(result).toEqual({
      success: true,
      data: { message: "이메일 발송에 성공하였습니다.", email: "a@b.com" },
    });
  });

  it("이메일 발송에 실패하면 AppError를 리턴값으로 번역한다", async () => {
    vi.mocked(checkEmailDuplicate).mockResolvedValue(true);
    vi.mocked(encrypt).mockResolvedValue("entry-token");
    vi.mocked(sendEmail).mockRejectedValue(
      new AppError("EXTERNAL_SERVICE", "이메일 발송에 실패했습니다."),
    );

    const result = await requestPasswordReset(null, buildFormData());

    expect(result).toEqual({
      success: false,
      error: {
        category: "EXTERNAL_SERVICE",
        message: "외부 서비스 연동에 실패했습니다. 잠시 후 다시 시도해주세요.",
        fieldErrors: undefined,
      },
    });
  });
});
