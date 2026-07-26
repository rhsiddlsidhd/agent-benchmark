import { NextResponse } from "next/server";

/**
 * Custom HTTP Error class for structured error handling.
 * The `fieldErrors` property is optional and holds validation errors.
 */
export class HTTPError extends Error {
  code: number;
  fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    code: number = 400,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "HTTPError";
    this.code = code;
    this.fieldErrors = fieldErrors;
    Object.setPrototypeOf(this, HTTPError.prototype);
  }
}

/**
 * Success response structure.
 */
export type SuccessResponse<T> = {
  success: true;
  data: T;
};

/**
 * Unified error response structure — `error`는 `ErrorPayload`(아래 정의)를 그대로 싣는다.
 */
export type ErrorResponse = {
  success: false;
  error: ErrorPayload;
};

/**
 * Generic API response (success or error).
 */
export type APIResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

/**
 * API Route response type (NextResponse wrapper).
 */
export type APIRouteResponse<T = unknown> = NextResponse<APIResponse<T>>;

export const ERROR_CATEGORIES = [
  "VALIDATION",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "INTERNAL",
  "DISABLED",
  "EXTERNAL_SERVICE",
] as const;

export type ErrorCategory = (typeof ERROR_CATEGORIES)[number];

/**
 * services가 던지는 앱 고유 에러. HTTP status는 모른다 — route.ts 경계에서만 번역한다.
 */
export class AppError extends Error {
  category: ErrorCategory;
  fieldErrors?: Record<string, string[]>;

  constructor(
    category: ErrorCategory,
    message: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
    this.category = category;
    this.fieldErrors = fieldErrors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * 클라이언트-facing 에러 표현. 채널 A 리턴과 채널 B Response body가 공유한다.
 */
export type ErrorPayload = {
  category: ErrorCategory;
  message: string;
  fieldErrors?: Record<string, string[]>;
};
