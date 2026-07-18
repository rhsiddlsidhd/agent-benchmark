import { APIRouteResponse, apiSuccess } from "@/api/response";
import { handleRouteError } from "@/api/error";
import { HTTPError } from "@/types/error";
import { syncPayment } from "@/services/payment.service";
import { NextRequest } from "next/server";
import { PayStatus } from "@/models/payment";
import { decrypt } from "@/lib/token";

export const POST = async (
  req: NextRequest,
): Promise<APIRouteResponse<{ status: PayStatus }>> => {
  try {
    // 인증 확인 - Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HTTPError("로그인이 필요합니다.", 401);
    }

    const token = authHeader.substring(7); // "Bearer " 제거

    const { payload } = await decrypt({ token, type: "ACCESS" });

    if (!payload.id) throw new HTTPError("유효하지 않은 토큰입니다.", 401);

    const body = await req.json();
    const { paymentId } = body;

    if (typeof paymentId !== "string") {
      throw new HTTPError("올바르지 않은 요청입니다.", 400);
    }

    const payment = await syncPayment(paymentId);

    if (!payment) {
      throw new HTTPError("결제 동기화에 실패했습니다.", 500);
    }

    return apiSuccess<{ status: PayStatus }>({ status: payment.status });
  } catch (error) {
    return handleRouteError(error);
  }
};
