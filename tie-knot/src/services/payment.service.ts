import * as PortOne from "@portone/server-sdk";
import { PaymentModel, PayStatus } from "@/models/payment";
import { OrderModel } from "@/models/order.model";
import { getProductService } from "./product.service";
import { getOrderSeviceByMerchantUid } from "./order.service";
import { HTTPError } from "@/types/error";
import { dbConnect } from "@/utils/mongodb";

// 환경 변수 확인
const PORTONE_API_SECRET = process.env.POST_ONE_API_KEY;

if (!PORTONE_API_SECRET) {
  throw new Error("POST_ONE_API_KEY is not defined");
}

// 포트원 클라이언트 설정
const portone = PortOne.PortOneClient({
  secret: PORTONE_API_SECRET,
});

// 타입 정의: 결제 조회 결과
type GetPaymentResult = Awaited<ReturnType<typeof portone.payment.getPayment>>;
type PaidPayment = Extract<GetPaymentResult, { status: "PAID" }>;
type FailedPayment = Extract<GetPaymentResult, { status: "FAILED" }>;

/**
 * PortOne 결제 상태를 시스템 상태로 매핑
 * - 알 수 없는 상태는 에러를 던져 즉시 감지
 * - 결제는 민감한 영역이므로 silent failure 방지
 */
function mapPortOneStatus(status: unknown): PayStatus {
  if (typeof status !== "string") {
    console.error(`[mapPortOneStatus] Invalid status type: ${typeof status}`);
    throw new HTTPError("유효하지 않은 결제 상태입니다.", 400);
  }

  const statusMap: Record<string, PayStatus> = {
    READY: "PENDING",
    VIRTUAL_ACCOUNT_ISSUED: "PENDING",
    PAID: "PAID",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED",
    PARTIAL_CANCELLED: "PARTIAL_CANCELLED",
  };

  if (!(status in statusMap)) {
    console.error(`[mapPortOneStatus] Unknown status: ${status}`);
    throw new HTTPError(`알 수 없는 결제 상태: ${status}`, 400);
  }

  return statusMap[status];
}
/**
 * 결제 데이터 검증 (위변조 방지)
 */
async function verifyPayment(payment: PaidPayment): Promise<boolean> {
  try {
    // 1. customData 존재 확인 및 파싱
    if (!payment.customData) {
      console.error("[verifyPayment] customData is missing");
      return false;
    }

    const parsed = JSON.parse(payment.customData);
    const { productId } = parsed;

    if (!productId) {
      console.error("[verifyPayment] productId is missing in customData");
      return false;
    }

    // 2. DB에서 주문 및 상품 정보 병렬 조회
    const [product, order] = await Promise.all([
      getProductService(productId),
      getOrderSeviceByMerchantUid(payment.id), // payment.id는 우리가 보낸 merchantUid
    ]);

    if (!product) {
      console.error("[verifyPayment] Product not found:", productId);
      return false;
    }

    if (!order) {
      console.error("[verifyPayment] Order not found:", payment.id);
      return false;
    }

    // 3. 실제 결제된 금액 vs DB 주문 금액 비교
    const isAmountMatch = payment.amount.paid === order.finalPrice;

    if (!isAmountMatch) {
      console.error(
        `[verifyPayment] Amount mismatch: expected ${order.finalPrice}, got ${payment.amount.paid}`,
      );
      return false;
    }

    // 4. 상품명 비교 (선택사항이지만 보안 강화)
    const expectedOrderName = `${product.title} 모바일 청첩장`;
    const isTitleMatch = payment.orderName === expectedOrderName;

    if (!isTitleMatch) {
      console.warn(
        `[verifyPayment] Title mismatch: expected "${expectedOrderName}", got "${payment.orderName}"`,
      );
      // 상품명 불일치는 경고만 하고 통과시킴 (금액이 맞으면 OK)
    }

    return isAmountMatch;
  } catch (e) {
    console.error("[verifyPayment] Error:", e);
    return false;
  }
}

/**
 * PortOne 결제 정보 동기화 및 검증
 * @param paymentId - merchantUid (주문번호)
 */
export const syncPayment = async (paymentId: string) => {
  await dbConnect();

  try {
    // 1. 포트원 서버에서 최신 결제 상태 조회
    const actualPayment: GetPaymentResult = await portone.payment.getPayment({
      paymentId,
    });

    // 2. merchantUid로 Order 찾기
    const order = await OrderModel.findOne({ merchantUid: paymentId });

    if (!order) {
      throw new HTTPError("주문을 찾을 수 없습니다.", 404);
    }

    // 3. 결제가 완료(PAID)된 경우에만 검증 및 DB 반영
    if (actualPayment.status === "PAID") {
      const isValid = await verifyPayment(actualPayment as PaidPayment);

      if (!isValid) {
        throw new HTTPError(
          "결제 검증에 실패했습니다. 금액 불일치 또는 데이터 오류",
          400,
        );
      }

      // 4. Payment 모델 생성/업데이트
      let payment = await PaymentModel.findOne({ merchantUid: paymentId });

      const paymentData = {
        merchantUid: paymentId,
        impUid: actualPayment.transactionId,
        orderId: order._id,
        buyerName: order.buyerName,
        buyerEmail: order.buyerEmail,
        buyerTel: order.buyerPhone,
        requestAmount: order.finalPrice,
        paidAmount: actualPayment.amount.paid,
        status: mapPortOneStatus(actualPayment.status),
        pgProvider: actualPayment.channel?.pgProvider,
        pgTid: actualPayment.pgTxId,
        paidAt: new Date(actualPayment.paidAt),
        receiptUrl: actualPayment.receiptUrl,
      };

      if (!payment) {
        payment = await PaymentModel.create(paymentData);
      } else {
        Object.assign(payment, paymentData);
        await payment.save();
      }

      // 5. Order 상태 업데이트
      order.orderStatus = "CONFIRMED";
      order.paymentId = payment._id;
      await order.save();

      return {
        success: true,
        status: payment.status,
        payment: payment.toObject(),
      };
    }

    // 6. 결제 실패 시 처리
    if (actualPayment.status === "FAILED") {
      const failedPayment = actualPayment as FailedPayment;

      // Payment 모델 생성/업데이트
      let payment = await PaymentModel.findOne({ merchantUid: paymentId });

      const paymentData = {
        merchantUid: paymentId,
        orderId: order._id,
        buyerName: order.buyerName,
        buyerEmail: order.buyerEmail,
        buyerTel: order.buyerPhone,
        requestAmount: order.finalPrice,
        status: mapPortOneStatus(actualPayment.status),
        failedAt: new Date(failedPayment.failedAt),
        failReason: failedPayment.failure?.reason,
      };

      if (!payment) {
        payment = await PaymentModel.create(paymentData);
      } else {
        Object.assign(payment, paymentData);
        await payment.save();
      }

      // Order 상태 업데이트
      order.orderStatus = "CANCELLED";
      await order.save();

      return {
        success: false,
        status: payment.status,
        message: failedPayment.failure?.reason || "결제 실패",
      };
    }

    // 결제 대기 중
    return { success: false, status: mapPortOneStatus(actualPayment.status) };
  } catch (e) {
    if (e instanceof PortOne.PortOneError) {
      throw new HTTPError(`포트원 오류: ${e.message}`, 400);
    }
    throw e;
  }
};
