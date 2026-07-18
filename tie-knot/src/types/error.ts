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
 * Unified error response structure.
 * `fieldErrors` is optional and only present for validation-related errors.
 */
export type ErrorResponse = {
  success: false;
  error: {
    message: string;
    code: number;
    fieldErrors?: Record<string, string[]>;
  };
};

/**
 * Generic API response (success or error).
 */
export type APIResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

/**
 * API Route response type (NextResponse wrapper).
 */
export type APIRouteResponse<T = unknown> = NextResponse<APIResponse<T>>;
