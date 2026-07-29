"use server";

import { APIResponse, AppError } from "@/shared/types";
import { syncPayment, requireAuth } from "@/server/services";
import { PayStatus } from "@/server/models";
import { actionError } from "@/server/boundary";

export const completePayment = async (
  paymentId: string,
): Promise<APIResponse<{ status: PayStatus }>> => {
  try {
    await requireAuth();

    if (typeof paymentId !== "string" || !paymentId) {
      throw new AppError("VALIDATION", "올바르지 않은 요청입니다.");
    }

    const payment = await syncPayment(paymentId);

    if (!payment) {
      throw new AppError("INTERNAL", "결제 동기화에 실패했습니다.");
    }

    return { success: true, data: { status: payment.status } };
  } catch (e) {
    return actionError(e);
  }
};
