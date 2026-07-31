import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/shared/types";

vi.mock("@/server/services", () => ({
  checkEmailDuplicate: vi.fn(),
  createUser: vi.fn(),
}));

vi.mock("@/server/lib/bcrypt", () => ({
  hashPassword: vi.fn(),
}));

import { checkEmailDuplicate, createUser } from "@/server/services";
import { hashPassword } from "@/server/lib/bcrypt";
import { signupUser } from "./signupUser";

const buildFormData = (overrides?: Record<string, string>) => {
  const formData = new FormData();
  const fields: Record<string, string> = {
    email: "a@b.com",
    name: "홍길동",
    phone: "010-1234-5678",
    password: "pw1234!",
    confirmPassword: "pw1234!",
    ...overrides,
  };
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return formData;
};

describe("signupUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("입력값 검증에 실패하면 VALIDATION을 리턴한다", async () => {
    const result = await signupUser(null, new FormData());

    expect(result).toEqual({
      success: false,
      error: { category: "VALIDATION", message: "입력값을 확인해주세요", fieldErrors: expect.any(Object) },
    });
    expect(checkEmailDuplicate).not.toHaveBeenCalled();
  });

  it("이미 존재하는 이메일이면 VALIDATION을 리턴한다", async () => {
    vi.mocked(checkEmailDuplicate).mockResolvedValue(true);

    const result = await signupUser(null, buildFormData());

    expect(result).toEqual({
      success: false,
      error: { category: "VALIDATION", message: "이미 존재하는 이메일 입니다." },
    });
    expect(createUser).not.toHaveBeenCalled();
  });

  it("정상 경로: 비밀번호를 해싱해 유저를 생성하고 이메일이 포함된 메시지를 리턴한다", async () => {
    vi.mocked(checkEmailDuplicate).mockResolvedValue(false);
    vi.mocked(hashPassword).mockResolvedValue("hashed-password");
    vi.mocked(createUser).mockResolvedValue({} as never);

    const result = await signupUser(null, buildFormData());

    expect(hashPassword).toHaveBeenCalledWith("pw1234!");
    expect(createUser).toHaveBeenCalledWith({
      password: "hashed-password",
      email: "a@b.com",
      name: "홍길동",
      phone: "010-1234-5678",
    });
    expect(result).toEqual({
      success: true,
      data: { message: "a@b.com님 회원가입을 축하드립니다." },
    });
  });

  it("services가 던진 AppError를 리턴값으로 번역한다", async () => {
    vi.mocked(checkEmailDuplicate).mockResolvedValue(false);
    vi.mocked(hashPassword).mockResolvedValue("hashed-password");
    vi.mocked(createUser).mockRejectedValue(
      new AppError("INTERNAL", "회원가입에 실패했습니다."),
    );

    const result = await signupUser(null, buildFormData());

    expect(result).toEqual({
      success: false,
      error: {
        category: "INTERNAL",
        message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        fieldErrors: undefined,
      },
    });
  });
});
