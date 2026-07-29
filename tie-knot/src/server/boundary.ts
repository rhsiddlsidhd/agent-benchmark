import { NextResponse } from "next/server";
import {
  AppError,
  ErrorCategory,
  ErrorPayload,
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

type ActionErrorResult = { success: false; error: ErrorPayload };

export const routeSuccess = <T>(
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

// route.ts(채널 B)/Server Action(채널 A) 공용 — AppError 캐치·로깅·민감분류 message 일반화만 담당한다.
// 최종 응답 shape(Response vs 함수 리턴값)으로의 wrapping은 아래 routeError/actionError가 한다.
export const toErrorPayload = (e: unknown, logPrefix: string): ErrorPayload => {
  if (e instanceof AppError) {
    console.error(`[${logPrefix}] ${e.category}: ${e.message}`);
    return {
      category: e.category,
      message: SAFE_MESSAGES[e.category] ?? e.message,
      fieldErrors: e.fieldErrors,
    };
  }

  console.error(`[${logPrefix}] Unknown error:`, e);
  return { category: "INTERNAL", message: ERROR_SAFE_MESSAGES.INTERNAL };
};

// route.ts(채널 B) 전용 최종 wrapping — HTTP status 매핑 + Response 번역까지 담당.
export const routeError = (e: unknown): NextResponse<ErrorResponse> => {
  const error = toErrorPayload(e, "Route");
  return NextResponse.json(
    { success: false, error },
    { status: ERROR_STATUS_MAP[error.category] },
  );
};

// Server Action(채널 A) 전용 최종 wrapping — 함수 리턴값으로 번역까지 담당.
export const actionError = (e: unknown): ActionErrorResult => {
  return { success: false, error: toErrorPayload(e, "Action") };
};
