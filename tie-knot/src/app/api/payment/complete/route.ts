import { APIRouteResponse, apiOk, apiFail } from "@/server/response";
import { AppError } from "@/shared/types";
import { syncPayment, requireAuth } from "@/server/services";
import { NextRequest } from "next/server";
import { PayStatus } from "@/server/models";

export const POST = async (
  req: NextRequest,
): Promise<APIRouteResponse<{ status: PayStatus }>> => {
  try {
    await requireAuth();

    const body = await req.json();
    const { paymentId } = body;

    if (typeof paymentId !== "string") {
      throw new AppError("VALIDATION", "올바르지 않은 요청입니다.");
    }

    const payment = await syncPayment(paymentId);

    if (!payment) {
      throw new AppError("INTERNAL", "결제 동기화에 실패했습니다.");
    }

    return apiOk<{ status: PayStatus }>({ status: payment.status });
  } catch (error) {
    return apiFail(error);
  }
};
