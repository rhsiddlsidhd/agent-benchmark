import { APIResponse, ErrorResponse, HTTPError } from "@/types";

/**
 * API 응답에서 특정 필드의 에러 메시지를 안전하게 추출합니다.
 * 옵셔널 체이닝을 사용하여 런타임 에러를 방지합니다.
 *
 * @param state - useActionState가 반환하는 전체 응답 상태
 * @param field - 에러를 확인할 필드명
 * @returns 필드의 첫 번째 에러 메시지 또는 undefined
 *
 * @example
 * const emailError = getFieldError(state, 'email');
 * {emailError && <p className="text-red-500">{emailError}</p>}
 */
export const getFieldError = (
  state: APIResponse<unknown> | null,
  field: string,
): string | undefined => {
  // state가 없거나, 성공 상태이면 에러가 없으므로 undefined를 반환합니다.
  if (!state || state.success === true) {
    return undefined;
  }

  return state.error.fieldErrors?.[field]?.[0];
};

/**
 * API 응답에 필드 에러가 있는지 확인
 *
 * @param state - API 응답 상태
 * @returns 필드 에러 존재 여부
 *
 * @example
 * if (hasFieldErrors(state)) {
 *   // 필드별 에러 처리
 * }
 */

export const hasFieldErrors = (error: ErrorResponse["error"]): boolean => {
  return Boolean(
    error.fieldErrors && Object.keys(error.fieldErrors).length > 0,
  );
};

export type ClientFieldErrors = { fieldErrors: Record<string, string[]> };
export type ClientMessageError = { message: string };

/**
 * fetcher/apiRequest가 throw한 에러(주로 HTTPError)를 받아 클라이언트가
 * 무엇을 보여줄지 결정한다 — 필드 에러 우선, 없으면 상태 코드별 메시지/void.
 */
export const handleClientError = (
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
