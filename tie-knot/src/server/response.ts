import { NextResponse } from "next/server";
import {
  AppError,
  ErrorCategory,
  HTTPError,
  SuccessResponse,
  ErrorResponse,
  APIResponse,
  APIRouteResponse,
} from "@/shared/types";
import { ERROR_SAFE_MESSAGES } from "@/shared/constants";

// Re-export types for convenience
export type {
  HTTPError,
  SuccessResponse,
  ErrorResponse,
  APIResponse,
  APIRouteResponse,
};

// 분류→HTTP status 매핑 — services/AppError는 HTTP를 모르므로 이 경계에서만 번역한다(src/CLAUDE.md 참고).
export const ERROR_STATUS_MAP: Record<ErrorCategory, number> = {
  VALIDATION: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL: 500,
  DISABLED: 503,
  EXTERNAL_SERVICE: 502,
};

const SAFE_MESSAGES: Partial<Record<string, string>> = ERROR_SAFE_MESSAGES;

export const apiOk = <T>(
  data: T,
  status: number = 200,
): NextResponse<SuccessResponse<T>> => {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status },
  );
};

// 모든 에러 케이스에서 fieldErrors를 포함하여 일관된 구조로 반환
export const apiFail = (e: unknown): NextResponse<ErrorResponse> => {
  if (e instanceof AppError) {
    console.error(`[Route] ${e.category}: ${e.message}`);
    return NextResponse.json(
      {
        success: false,
        error: {
          category: e.category,
          message: SAFE_MESSAGES[e.category] ?? e.message,
          fieldErrors: e.fieldErrors,
        },
      },
      { status: ERROR_STATUS_MAP[e.category] },
    );
  }

  // HTTPError는 B3(services 계층 정리) 완료 전까지 남아있는 레거시 경로.
  // 원래 status(e.code)는 그대로 응답에 실어 기존 동작을 유지하고, body의 category는
  // 실제 분류를 모르므로 placeholder(INTERNAL)만 채운다 — 지금 소비처는 message/fieldErrors만 읽는다.
  if (e instanceof HTTPError) {
    console.error(`[Route][legacy HTTPError ${e.code}] ${e.message}`);
    return NextResponse.json(
      {
        success: false,
        error: {
          category: "INTERNAL",
          message: e.message,
          fieldErrors: e.fieldErrors,
        },
      },
      { status: e.code },
    );
  }

  console.error("[Route] Unknown error:", e);
  return NextResponse.json(
    {
      success: false,
      error: {
        category: "INTERNAL",
        message: ERROR_SAFE_MESSAGES.INTERNAL,
      },
    },
    { status: 500 },
  );
};
