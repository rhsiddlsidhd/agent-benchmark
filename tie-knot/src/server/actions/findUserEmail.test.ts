import { describe, it, expect } from "vitest";
import { findUserEmail } from "./findUserEmail";

describe("findUserEmail", () => {
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
  });
});
