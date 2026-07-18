import { APIResponse, ErrorResponse } from "@/types/error";

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
