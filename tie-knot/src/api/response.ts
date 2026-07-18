import { NextResponse } from "next/server";
import {
  HTTPError,
  SuccessResponse,
  ErrorResponse,
  APIResponse,
  APIRouteResponse,
} from "@/types/error";

// Re-export types for convenience
export type {
  HTTPError,
  SuccessResponse,
  ErrorResponse,
  APIResponse,
  APIRouteResponse,
};

export const success = <T>(data: T): SuccessResponse<T> => ({
  success: true,
  data,
});

// 모든 에러 케이스에서 fieldErrors를 포함하여 일관된 구조로 반환
export const createErrorResponse = (e: unknown): ErrorResponse => {
  if (e instanceof HTTPError) {
    return {
      success: false,
      error: {
        message: e.message,
        code: e.code,
        fieldErrors: e.fieldErrors, // fieldErrors 사용
      },
    };
  }

  return {
    success: false,
    error: {
      message: "알 수 없는 오류가 발생했습니다.",
      code: 500,
    },
  };
};

export const apiSuccess = <T>(
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
export const createApiErrorResponse = (
  e: unknown,
): NextResponse<ErrorResponse> => {
  if (e instanceof HTTPError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: e.message,
          code: e.code,
          fieldErrors: e.fieldErrors, // fieldErrors 사용
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

// 1. 반환 타입을 명확히 하기 위해 별도로 정의합니다. (이미 fieldErrors 사용)
export type ClientFieldErrors = { fieldErrors: Record<string, string[]> };
export type ClientMessageError = { message: string };

export const createClientErrorResponse = (
  e: unknown,
): ClientFieldErrors | ClientMessageError | void => {
  let error: ErrorResponse["error"];

  // 1. 다양한 형태의 에러를 일관된 `error` 객체로 정규화합니다.
  if (e instanceof HTTPError) {
    error = { code: e.code, message: e.message, fieldErrors: e.fieldErrors };
  } else if (typeof e === "object" && e && "code" in e && "message" in e) {
    // 이미 ErrorResponse['error'] 형태를 가진 객체일 경우
    error = e as ErrorResponse["error"];
  } else {
    // 그 외 모든 알 수 없는 에러 처리
    console.error("Unknown error:", e);
    error = { code: 500, message: "알 수 없는 오류가 발생했습니다." };
  }

  // 2. 필드 에러가 존재하면 다른 것을 확인하지 않고 즉시 반환합니다.
  if (error.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
    return { fieldErrors: error.fieldErrors };
  }

  // 3. 필드 에러가 없는 경우, 에러 코드를 기반으로 메시지를 반환합니다.
  switch (error.code) {
    case 400: // 필드 에러가 없는 400 에러는 메시지만 반환합니다.
      return { message: error.message };

    case 401: // 인증 에러는 리다이렉션 등을 위해 void를 반환합니다.
      if (process.env.NODE_ENV === "development") {
        console.error(`세션이 만료되었습니다. 다시 로그인해주세요.`);
      }

      return;

    case 403:
    case 404:
    case 500:
    default: // 그 외 서버 에러는 통일된 메시지를 반환합니다.
      console.error(`Error ${error.code}: ${error.message}`);
      return {
        message: "예상치 못한 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
      };
  }
};
