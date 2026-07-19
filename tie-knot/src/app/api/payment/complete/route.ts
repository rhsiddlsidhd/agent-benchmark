import { APIRouteResponse, apiOk, apiFail } from "@/api/response";
import { HTTPError } from "@/types";
import { syncPayment } from "@/services/payment.service";
import { NextRequest } from "next/server";
import { PayStatus } from "@/models/payment.model";
import { requireAuth } from "@/services/auth.service";

export const POST = async (
  req: NextRequest,
): Promise<APIRouteResponse<{ status: PayStatus }>> => {
  try {
    await requireAuth();

    const body = await req.json();
    const { paymentId } = body;

    if (typeof paymentId !== "string") {
      throw new HTTPError("올바르지 않은 요청입니다.", 400);
    }

    const payment = await syncPayment(paymentId);

    if (!payment) {
      throw new HTTPError("결제 동기화에 실패했습니다.", 500);
    }

    return apiOk<{ status: PayStatus }>({ status: payment.status });
  } catch (error) {
    return apiFail(error);
  }
};
