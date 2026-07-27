// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/services", () => ({
  getUser: vi.fn(),
}));

vi.mock("@/server/lib/bcrypt", () => ({
  comparePasswords: vi.fn(),
}));

vi.mock("@/server/lib/cookies", () => ({
  setCookie: vi.fn().mockResolvedValue(undefined),
}));

import { getUser } from "@/server/services";
import { comparePasswords } from "@/server/lib/bcrypt";
import { setCookie } from "@/server/lib/cookies";
import { loginUser } from "./loginUser";

const buildFormData = (overrides?: Record<string, string>) => {
  const formData = new FormData();
  const fields: Record<string, string> = {
    email: "a@b.com",
    password: "pw1234!",
    ...overrides,
  };
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return formData;
};

describe("loginUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("이메일/비밀번호 미입력 시 VALIDATION을 리턴한다", async () => {
    const result = await loginUser(null, buildFormData({ email: "" }));

    expect(result).toEqual({
      success: false,
      error: { category: "VALIDATION", message: "아이디와 비밀번호를 확인해주세요." },
    });
    expect(getUser).not.toHaveBeenCalled();
  });

  it("스키마 검증에 실패하면 VALIDATION과 fieldErrors를 리턴한다", async () => {
    const result = await loginUser(null, buildFormData({ email: "not-an-email" }));

    expect(result).toMatchObject({
      success: false,
      error: { category: "VALIDATION", fieldErrors: expect.any(Object) },
    });
  });

  it("존재하지 않는 유저면 UNAUTHENTICATED를 리턴한다", async () => {
    vi.mocked(getUser).mockResolvedValue(null);

    const result = await loginUser(null, buildFormData());

    expect(result).toEqual({
      success: false,
      error: { category: "UNAUTHENTICATED", message: "이메일 또는 비밀번호가 일치하지 않습니다." },
    });
  });

  it("비밀번호가 틀리면 UNAUTHENTICATED를 리턴한다", async () => {
    vi.mocked(getUser).mockResolvedValue({
      _id: "u1",
      email: "a@b.com",
      name: "홍길동",
      phone: "010-0000-0000",
      password: "hashed",
      role: "USER",
      isDelete: false,
    });
    vi.mocked(comparePasswords).mockResolvedValue(false);

    const result = await loginUser(null, buildFormData());

    expect(result).toEqual({
      success: false,
      error: { category: "UNAUTHENTICATED", message: "이메일 또는 비밀번호가 일치하지 않습니다." },
    });
  });

  it("정상 로그인 시 token 쿠키만 발급한다(access 쿠키 없음)", async () => {
    vi.mocked(getUser).mockResolvedValue({
      _id: "u1",
      email: "a@b.com",
      name: "홍길동",
      phone: "010-0000-0000",
      password: "hashed",
      role: "USER",
      isDelete: false,
    });
    vi.mocked(comparePasswords).mockResolvedValue(true);

    const result = await loginUser(null, buildFormData({ remember: "true" }));

    expect(setCookie).toHaveBeenCalledTimes(1);
    expect(setCookie).toHaveBeenCalledWith({
      name: "token",
      value: expect.any(String),
      remember: true,
    });
    expect(result).toEqual({
      success: true,
      data: { role: "USER", email: "a@b.com", userId: "u1" },
    });
  });
});
