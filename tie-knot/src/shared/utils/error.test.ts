import { describe, it, expect } from "vitest";
import { getFieldError, hasFieldErrors } from "./error";
import { APIResponse, ErrorResponse } from "@/shared/types";

describe("getFieldError", () => {
  it("state가 null이면 undefined를 반환한다", () => {
    expect(getFieldError(null, "email")).toBeUndefined();
  });

  it("state가 성공이면 undefined를 반환한다", () => {
    const state: APIResponse<{ message: string }> = {
      success: true,
      data: { message: "ok" },
    };

    expect(getFieldError(state, "email")).toBeUndefined();
  });

  it("해당 필드의 첫 번째 에러 메시지를 반환한다", () => {
    const state: APIResponse<unknown> = {
      success: false,
      error: {
        category: "VALIDATION",
        message: "입력값을 확인해주세요.",
        fieldErrors: { email: ["이메일 형식이 올바르지 않습니다."] },
      },
    };

    expect(getFieldError(state, "email")).toBe(
      "이메일 형식이 올바르지 않습니다.",
    );
  });

  it("해당 필드에 에러가 없으면 undefined를 반환한다", () => {
    const state: APIResponse<unknown> = {
      success: false,
      error: { category: "VALIDATION", message: "입력값을 확인해주세요." },
    };

    expect(getFieldError(state, "email")).toBeUndefined();
  });
});

describe("hasFieldErrors", () => {
  it("fieldErrors가 있으면 true를 반환한다", () => {
    const error: ErrorResponse["error"] = {
      category: "VALIDATION",
      message: "입력값을 확인해주세요.",
      fieldErrors: { email: ["이메일 형식이 올바르지 않습니다."] },
    };

    expect(hasFieldErrors(error)).toBe(true);
  });

  it("fieldErrors가 없으면 false를 반환한다", () => {
    const error: ErrorResponse["error"] = {
      category: "VALIDATION",
      message: "입력값을 확인해주세요.",
    };

    expect(hasFieldErrors(error)).toBe(false);
  });

  it("fieldErrors가 빈 객체면 false를 반환한다", () => {
    const error: ErrorResponse["error"] = {
      category: "VALIDATION",
      message: "입력값을 확인해주세요.",
      fieldErrors: {},
    };

    expect(hasFieldErrors(error)).toBe(false);
  });
});
