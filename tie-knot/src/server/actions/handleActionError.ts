import { AppError, ErrorPayload } from "@/shared/types";
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

  console.error("[Action] Unknown error:", e);
  return {
    success: false,
    error: { category: "INTERNAL", message: ERROR_SAFE_MESSAGES.INTERNAL },
  };
};
