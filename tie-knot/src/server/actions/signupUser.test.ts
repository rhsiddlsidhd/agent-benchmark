import { describe, it, expect } from "vitest";
import { signupUser } from "./signupUser";

describe("signupUser", () => {
  it("입력값 검증에 실패하면 VALIDATION을 리턴한다", async () => {
    const result = await signupUser(null, new FormData());

    expect(result).toEqual({
      success: false,
      error: { category: "VALIDATION", message: "입력값을 확인해주세요", fieldErrors: expect.any(Object) },
    });
  });
});
