import mongoose from "mongoose";
import * as PortOne from "@portone/server-sdk";
import { PaymentModel, PayStatus, IPayment, OrderModel, ProductModel } from "@/server/models";

import { getProductService } from "./product.service";
import { getOrderSeviceByMerchantUid } from "./order.service";
import { AppError } from "@/shared/types";
import { dbConnect } from "@/server/lib/mongodb";

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
    throw new AppError(
      "EXTERNAL_SERVICE",
      `유효하지 않은 결제 상태 타입: ${typeof status}`,
    );
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
    throw new AppError("EXTERNAL_SERVICE", `알 수 없는 결제 상태: ${status}`);
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
      throw new AppError("NOT_FOUND", "주문을 찾을 수 없습니다.");
    }

    // 3. 결제가 완료(PAID)된 경우에만 검증 및 DB 반영
    if (actualPayment.status === "PAID") {
      const isValid = await verifyPayment(actualPayment as PaidPayment);

      if (!isValid) {
        throw new AppError(
          "VALIDATION",
          "결제 검증에 실패했습니다. 금액 불일치 또는 데이터 오류",
        );
      }

      // 4~6. Payment 저장 + Order 상태 전이 + Product salesCount 증가는 하나의
      // 논리적 단위라 트랜잭션으로 묶는다 — 중간에 하나라도 실패하면 전부
      // 롤백된다(services/CLAUDE.md "트랜잭션" 섹션 참고).
      let payment!: mongoose.HydratedDocument<IPayment>;

      await mongoose.connection.transaction(async (session) => {
        const existing = await PaymentModel.findOne({ merchantUid: paymentId }).session(session);

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

        if (!existing) {
          [payment] = await PaymentModel.create([paymentData], { session });
        } else {
          Object.assign(existing, paymentData);
          payment = await existing.save({ session });
        }

        // 5. Order 상태 업데이트
        order.orderStatus = "CONFIRMED";
        order.paymentId = payment._id;
        await order.save({ session });

        // 6. 판매 수량 반영 — "판매 건수"가 아니라 quantity 합산 기준(수량 개념 있는
        // 상품군 확장 대비, 지금은 quantity가 거의 항상 1).
        await ProductModel.findByIdAndUpdate(
          order.product.productId,
          { $inc: { salesCount: order.product.quantity } },
          { session },
        );
      });

      return {
        success: true,
        status: payment.status,
        payment: payment.toObject(),
      };
    }

    // 6. 결제 실패 시 처리 — Payment 저장 + Order 상태 전이도 하나의 논리적
    // 단위라 트랜잭션으로 묶는다(PAID 분기와 같은 이유).
    if (actualPayment.status === "FAILED") {
      const failedPayment = actualPayment as FailedPayment;

      let payment!: mongoose.HydratedDocument<IPayment>;

      await mongoose.connection.transaction(async (session) => {
        const existing = await PaymentModel.findOne({ merchantUid: paymentId }).session(session);

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

        if (!existing) {
          [payment] = await PaymentModel.create([paymentData], { session });
        } else {
          Object.assign(existing, paymentData);
          payment = await existing.save({ session });
        }

        // Order 상태 업데이트
        order.orderStatus = "CANCELLED";
        await order.save({ session });
      });

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
      throw new AppError("EXTERNAL_SERVICE", `포트원 오류: ${e.message}`);
    }
    throw e;
  }
};
