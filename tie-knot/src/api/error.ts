/**
 * Centralized error handling module
 *
 * This module provides consistent error handlers for different contexts:
 * - Server Actions (handleActionError)
 * - API Routes (handleRouteError)
 * - Client Side (handleClientError)
 *
 * All handlers delegate to corresponding create functions in response.ts
 */

export { type ErrorResponse } from "@/api/response";
import {
  createErrorResponse,
  createApiErrorResponse,
  createClientErrorResponse,
  type ErrorResponse,
  ClientFieldErrors,
  ClientMessageError,
} from "@/api/response";
import { NextResponse } from "next/server";

export const handleActionError = (e: unknown): ErrorResponse => {
  return createErrorResponse(e);
};

export const handleRouteError = (e: unknown): NextResponse<ErrorResponse> => {
  return createApiErrorResponse(e);
};

export const handleClientError = (
  e: unknown,
): ClientFieldErrors | ClientMessageError | void => {
  return createClientErrorResponse(e);
};
