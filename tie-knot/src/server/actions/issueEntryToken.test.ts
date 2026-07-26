import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/lib/jose", () => ({
  encrypt: vi.fn().mockResolvedValue("mock-entry-token"),
}));

vi.mock("@/server/lib/cookies", () => ({
  setCookie: vi.fn().mockResolvedValue(undefined),
  deleteCookie: vi.fn().mockResolvedValue(undefined),
}));

import { encrypt } from "@/server/lib/jose";
import { setCookie, deleteCookie } from "@/server/lib/cookies";
import { issueEntryToken } from "./issueEntryToken";

describe("issueEntryToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("정상 경로: entry 토큰을 발급하고 token 쿠키를 지운 뒤 entry 쿠키를 설정한다", async () => {
    const result = await issueEntryToken("/login");

    expect(encrypt).toHaveBeenCalledWith({ type: "ENTRY" });
    expect(deleteCookie).toHaveBeenCalledWith("token");
    expect(setCookie).toHaveBeenCalledWith({
      name: "entry",
      value: "mock-entry-token",
      maxAge: 600,
    });
    expect(result).toEqual({ success: true, data: { path: "/login" } });
  });

  it("nextPath가 빈 문자열이면 쿠키를 건드리지 않고 에러를 리턴한다", async () => {
    const result = await issueEntryToken("");

    expect(setCookie).not.toHaveBeenCalled();
    expect(deleteCookie).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: { category: "UNAUTHENTICATED", message: "잘못된 요청입니다.", fieldErrors: undefined },
    });
  });
});
