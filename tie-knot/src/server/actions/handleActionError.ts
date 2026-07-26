import { AppError, ErrorPayload, HTTPError } from "@/shared/types";
import { ERROR_SAFE_MESSAGES } from "@/shared/constants";

type ActionErrorResult = { success: false; error: ErrorPayload };

const SAFE_MESSAGES: Partial<Record<string, string>> = ERROR_SAFE_MESSAGES;

export const handleActionError = (e: unknown): ActionErrorResult => {
  if (e instanceof AppError) {
    console.error(`[Action] ${e.category}: ${e.message}`);
    return {
      success: false,
      error: {
        category: e.category,
        message: SAFE_MESSAGES[e.category] ?? e.message,
        fieldErrors: e.fieldErrors,
      },
    };
  }

  // HTTPError는 B3(services 계층 정리) 완료 전까지 남아있는 레거시 경로 — services가 아직 이 타입을 던질 수 있다.
  // category는 실제 분류를 모르므로 placeholder(INTERNAL)만 채운다 — 지금 소비처는 message/fieldErrors만 읽는다.
  if (e instanceof HTTPError) {
    console.error(`[Action][legacy HTTPError ${e.code}] ${e.message}`);
    return {
      success: false,
      error: {
        category: "INTERNAL",
        message: e.message,
        fieldErrors: e.fieldErrors,
      },
    };
  }

  console.error("[Action] Unknown error:", e);
  return {
    success: false,
    error: { category: "INTERNAL", message: ERROR_SAFE_MESSAGES.INTERNAL },
  };
};
