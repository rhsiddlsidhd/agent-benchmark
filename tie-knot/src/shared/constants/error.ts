import { ErrorCategory } from "@/shared/types";

export const ERROR_SAFE_MESSAGES = {
  INTERNAL: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
  EXTERNAL_SERVICE: "외부 서비스 연동에 실패했습니다. 잠시 후 다시 시도해주세요.",
} as const satisfies Partial<Record<ErrorCategory, string>>;
