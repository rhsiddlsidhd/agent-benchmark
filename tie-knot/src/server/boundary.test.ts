import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/shared/types";
import { routeSuccess, routeError, actionError, toErrorPayload, ERROR_STATUS_MAP } from "./boundary";

describe("routeSuccess", () => {
  it("success:true와 data를 담아 200으로 응답한다", async () => {
    const res = routeSuccess({ id: "1" });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      data: { id: "1" },
    });
  });

  it("status를 지정하면 그 값을 쓴다", () => {
    const res = routeSuccess({ id: "1" }, 201);
    expect(res.status).toBe(201);
  });
});

describe("routeError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("AppError 분류를 ERROR_STATUS_MAP에 따라 HTTP status로 번역한다", async () => {
    const res = routeError(new AppError("NOT_FOUND", "상품을 찾을 수 없습니다"));

    expect(res.status).toBe(ERROR_STATUS_MAP.NOT_FOUND);
    await expect(res.json()).resolves.toEqual({
      success: false,
      error: {
        category: "NOT_FOUND",
        message: "상품을 찾을 수 없습니다",
        fieldErrors: undefined,
      },
    });
  });

  it("미확인 예외는 500 INTERNAL로 응답한다", async () => {
    const res = routeError(new Error("db down"));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      success: false,
      error: {
        category: "INTERNAL",
        message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
    });
  });
});

describe("actionError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("AppError를 { success:false, error: ErrorPayload }로 번역한다", () => {
    const result = actionError(
      new AppError("VALIDATION", "입력값을 확인해주세요", {
        email: ["형식이 올바르지 않습니다"],
      }),
    );

    expect(result).toEqual({
      success: false,
      error: {
        category: "VALIDATION",
        message: "입력값을 확인해주세요",
        fieldErrors: { email: ["형식이 올바르지 않습니다"] },
      },
    });
  });

  it("미확인 예외는 INTERNAL 안전 문구로 번역한다", () => {
    const result = actionError(new Error("unexpected"));

    expect(result).toEqual({
      success: false,
      error: {
        category: "INTERNAL",
        message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
    });
  });
});

describe("toErrorPayload", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("AppError면 category/message/fieldErrors를 그대로 담는다", () => {
    const error = new AppError("VALIDATION", "이메일 형식이 올바르지 않습니다", {
      email: ["형식이 올바르지 않습니다"],
    });

    const payload = toErrorPayload(error, "Route");

    expect(payload).toEqual({
      category: "VALIDATION",
      message: "이메일 형식이 올바르지 않습니다",
      fieldErrors: { email: ["형식이 올바르지 않습니다"] },
    });
  });

  it("민감 분류(INTERNAL)는 원문 대신 안전 문구로 치환한다", () => {
    const error = new AppError("INTERNAL", "DB connection refused at 10.0.0.5");

    const payload = toErrorPayload(error, "Route");

    expect(payload.message).toBe(
      "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    );
    expect(payload.message).not.toContain("10.0.0.5");
  });

  it("민감 분류(EXTERNAL_SERVICE)도 안전 문구로 치환한다", () => {
    const error = new AppError("EXTERNAL_SERVICE", "PortOne API timeout");

    const payload = toErrorPayload(error, "Action");

    expect(payload.message).toBe(
      "외부 서비스 연동에 실패했습니다. 잠시 후 다시 시도해주세요.",
    );
  });

  it("AppError가 아닌 미확인 예외는 INTERNAL로 분류하고 안전 문구를 담는다", () => {
    const payload = toErrorPayload(new Error("unexpected"), "Action");

    expect(payload).toEqual({
      category: "INTERNAL",
      message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    });
  });

  it("로그에 채널 구분용 logPrefix를 남긴다", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    toErrorPayload(new AppError("NOT_FOUND", "없음"), "Route");
    toErrorPayload(new Error("boom"), "Action");

    expect(spy).toHaveBeenCalledWith("[Route] NOT_FOUND: 없음");
    expect(spy).toHaveBeenCalledWith("[Action] Unknown error:", expect.any(Error));
  });
});
