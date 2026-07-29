import { describe, it, expect } from "vitest";
import { updateUserPassword } from "./updateUserPassword";

describe("updateUserPassword", () => {
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
  });
});
