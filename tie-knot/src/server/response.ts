import { NextResponse } from "next/server";
import {
  HTTPError,
  SuccessResponse,
  ErrorResponse,
  APIResponse,
  APIRouteResponse,
} from "@/shared/types";

// Re-export types for convenience
export type {
  HTTPError,
  SuccessResponse,
  ErrorResponse,
  APIResponse,
  APIRouteResponse,
};

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
  if (e instanceof HTTPError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: e.message,
          code: e.code,
          fieldErrors: e.fieldErrors,
        },
      },
      { status: e.code },
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        message: "알 수 없는 오류가 발생했습니다.",
        code: 500,
      },
    },
    { status: 500 },
  );
};
