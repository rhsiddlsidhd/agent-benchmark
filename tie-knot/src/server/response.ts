import { NextResponse } from "next/server";
import {
  AppError,
  ErrorCategory,
  SuccessResponse,
  ErrorResponse,
  APIResponse,
  APIRouteResponse,
} from "@/shared/types";
import { ERROR_SAFE_MESSAGES } from "@/shared/constants";

// Re-export types for convenience
export type { SuccessResponse, ErrorResponse, APIResponse, APIRouteResponse };

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
