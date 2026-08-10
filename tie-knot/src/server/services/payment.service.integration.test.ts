import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/mongodb";
import { buildOrderInput, buildProductInput, clearCollections } from "@/test";
import { ProductModel, OrderModel, PaymentModel } from "@/server/models";
import { createProductService } from "./product.service";
import { createOrderService } from "./order.service";

const { getPaymentMock, cancelPaymentMock } = vi.hoisted(() => ({
  getPaymentMock: vi.fn(),
  cancelPaymentMock: vi.fn(),
}));

vi.mock("@portone/server-sdk", () => {
  class PortOneError extends Error {}
  return {
    PortOneClient: () => ({
      payment: { getPayment: getPaymentMock, cancelPayment: cancelPaymentMock },
    }),
    PortOneError,
  };
});

import { PortOneError } from "@portone/server-sdk";
import { syncPayment, cancelPayment, cancelExpiredAwaitingCoupleInfoOrders } from "./payment.service";

describe("payment.service", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  const setupProductAndOrder = async (quantity: number) => {
    const productInput = buildProductInput({ price: 9900 });
    await createProductService(productInput);
    const savedProduct = await ProductModel.findOne({ title: productInput.title }).lean();

    const order = await createOrderService(
      buildOrderInput({
        product: {
          productId: savedProduct!._id.toString(),
          title: productInput.title,
          thumbnail: productInput.thumbnail,
          pricing: { originalPrice: 9900, discountedPrice: 9900 },
          quantity,
          selectedFeatures: [],
        },
      }),
    );

    return { savedProduct: savedProduct!, order };
  };

  const paidPayload = (merchantUid: string, productId: string, amount: number) => ({
    status: "PAID" as const,
    id: merchantUid,
    customData: JSON.stringify({ productId }),
    amount: { paid: amount },
    orderName: "아무거나",
    transactionId: "txn_1",
    channel: { pgProvider: "TOSSPAYMENTS" },
    pgTxId: "pgtid_1",
    paidAt: new Date().toISOString(),
    receiptUrl: "https://receipt.example.com",
  });

  describe("PAID 상태 처리", () => {
    it("order.product.quantity만큼 salesCount가 증가하고 Order가 CONFIRMED로 전이된다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(2);
      getPaymentMock.mockResolvedValue(
        paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice),
      );

      const result = await syncPayment(order.merchantUid);

      expect(result.success).toBe(true);
      const updatedProduct = await ProductModel.findById(savedProduct._id).lean();
      expect(updatedProduct?.salesCount).toBe(2);
    });

    it("Order.confirmedAt이 결제 완료 시점으로 세팅된다(자동취소 기한 계산용)", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice),
      );

      const before = new Date();
      await syncPayment(order.merchantUid);
      const after = new Date();

      const updatedOrder = await OrderModel.findById(order._id).lean();
      expect(updatedOrder?.confirmedAt).toBeInstanceOf(Date);
      expect(updatedOrder!.confirmedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(updatedOrder!.confirmedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("동일 PAID 동기화를 재시도해도 salesCount는 한 번만 증가한다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice),
      );

      await syncPayment(order.merchantUid);
      await syncPayment(order.merchantUid);

      const updatedProduct = await ProductModel.findById(savedProduct._id).lean();
      expect(updatedProduct?.salesCount).toBe(1);
      expect(await PaymentModel.countDocuments({ merchantUid: order.merchantUid })).toBe(1);
    });

    it("금액이 불일치하면 AppError(VALIDATION)를 던지고 salesCount를 증가시키지 않는다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice + 1000),
      );

      await expect(syncPayment(order.merchantUid)).rejects.toMatchObject({
        category: "VALIDATION",
      });
      const updatedProduct = await ProductModel.findById(savedProduct._id).lean();
      expect(updatedProduct?.salesCount).toBe(0);
    });

    it("customData에 productId가 없으면 검증 실패로 처리한다", async () => {
      const { order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        ...paidPayload(order.merchantUid, "unused", order.finalPrice),
        customData: JSON.stringify({}),
      });

      await expect(syncPayment(order.merchantUid)).rejects.toMatchObject({
        category: "VALIDATION",
      });
    });

    it("customData의 productId에 해당하는 상품이 없으면 검증 실패로 처리한다", async () => {
      const { order } = await setupProductAndOrder(1);
      const missingProductId = new mongoose.Types.ObjectId().toString();
      getPaymentMock.mockResolvedValue(
        paidPayload(order.merchantUid, missingProductId, order.finalPrice),
      );

      await expect(syncPayment(order.merchantUid)).rejects.toMatchObject({
        category: "VALIDATION",
      });
    });

    it("PortOne 응답의 id가 실제 merchantUid와 다르면 주문을 못 찾아 검증 실패로 처리한다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload("다른-merchantUid", savedProduct._id.toString(), order.finalPrice),
      );

      await expect(syncPayment(order.merchantUid)).rejects.toMatchObject({
        category: "VALIDATION",
      });
    });

    it("트랜잭션 도중(salesCount 반영 단계) 실패하면 Payment 생성과 Order 상태 전이도 함께 롤백된다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(2);
      getPaymentMock.mockResolvedValue(
        paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice),
      );
      const findByIdAndUpdateSpy = vi
        .spyOn(ProductModel, "findByIdAndUpdate")
        .mockRejectedValueOnce(new Error("의도적 트랜잭션 중단"));

      await expect(syncPayment(order.merchantUid)).rejects.toThrow("의도적 트랜잭션 중단");

      const payment = await PaymentModel.findOne({ merchantUid: order.merchantUid }).lean();
      expect(payment).toBeNull();

      const updatedOrder = await OrderModel.findById(order._id).lean();
      expect(updatedOrder?.orderStatus).toBe("PENDING");

      const updatedProduct = await ProductModel.findById(savedProduct._id).lean();
      expect(updatedProduct?.salesCount).toBe(0);

      findByIdAndUpdateSpy.mockRestore();
    });
  });

  describe("결제수단(payMethod/methodDetail) 매핑", () => {
    it("카드 결제: payMethod=CARD, methodDetail.card에 SDK 필드 그대로 저장된다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        ...paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice),
        method: {
          type: "PaymentMethodCard",
          card: { publisher: "kb", issuer: "kb", brand: "MASTER", number: "1234-****-****-5678" },
          approvalNumber: "app-1",
          installment: { month: 3, isInterestFree: true },
          pointUsed: false,
        },
      });

      await syncPayment(order.merchantUid);

      const payment = await PaymentModel.findOne({ merchantUid: order.merchantUid }).lean();
      expect(payment?.payMethod).toBe("CARD");
      expect(payment?.methodDetail?.type).toBe("PaymentMethodCard");
      expect(payment?.methodDetail?.card).toMatchObject({
        publisher: "kb",
        number: "1234-****-****-5678",
        approvalNumber: "app-1",
        installment: { month: 3, isInterestFree: true },
        pointUsed: false,
      });
    });

    it("가상계좌: payMethod=VIRTUAL_ACCOUNT, 날짜 필드가 Date로 변환되어 저장된다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      const expiredAt = new Date("2026-08-01T00:00:00.000Z").toISOString();
      getPaymentMock.mockResolvedValue({
        ...paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice),
        method: {
          type: "PaymentMethodVirtualAccount",
          bank: "KOOKMIN",
          accountNumber: "110-1234-5678",
          expiredAt,
        },
      });

      await syncPayment(order.merchantUid);

      const payment = await PaymentModel.findOne({ merchantUid: order.merchantUid }).lean();
      expect(payment?.payMethod).toBe("VIRTUAL_ACCOUNT");
      expect(payment?.methodDetail?.virtualAccount?.accountNumber).toBe("110-1234-5678");
      expect(payment?.methodDetail?.virtualAccount?.expiredAt?.toISOString()).toBe(expiredAt);
    });

    it("계좌이체: payMethod=TRANSFER로 매핑된다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        ...paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice),
        method: { type: "PaymentMethodTransfer", bank: "SHINHAN", accountNumber: "110-9999" },
      });

      await syncPayment(order.merchantUid);

      const payment = await PaymentModel.findOne({ merchantUid: order.merchantUid }).lean();
      expect(payment?.payMethod).toBe("TRANSFER");
      expect(payment?.methodDetail?.transfer?.bank).toBe("SHINHAN");
    });

    it("휴대폰: payMethod=MOBILE로 매핑된다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        ...paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice),
        method: { type: "PaymentMethodMobile", phoneNumber: "01000000000" },
      });

      await syncPayment(order.merchantUid);

      const payment = await PaymentModel.findOne({ merchantUid: order.merchantUid }).lean();
      expect(payment?.payMethod).toBe("MOBILE");
      expect(payment?.methodDetail?.mobile?.phoneNumber).toBe("01000000000");
    });

    it("간편결제: payMethod=EASY_PAY로 매핑된다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        ...paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice),
        method: { type: "PaymentMethodEasyPay", provider: "KAKAOPAY", easyPayMethod: { type: "CARD" } },
      });

      await syncPayment(order.merchantUid);

      const payment = await PaymentModel.findOne({ merchantUid: order.merchantUid }).lean();
      expect(payment?.payMethod).toBe("EASY_PAY");
      expect(payment?.methodDetail?.easyPay?.provider).toBe("KAKAOPAY");
    });

    it("상품권: payMethod=GIFT_CERTIFICATE로 매핑된다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        ...paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice),
        method: {
          type: "PaymentMethodGiftCertificate",
          giftCertificateType: "CULTURELAND",
          approvalNumber: "gc-1",
        },
      });

      await syncPayment(order.merchantUid);

      const payment = await PaymentModel.findOne({ merchantUid: order.merchantUid }).lean();
      expect(payment?.payMethod).toBe("GIFT_CERTIFICATE");
      expect(payment?.methodDetail?.giftCertificate?.approvalNumber).toBe("gc-1");
    });

    it("편의점: 우리 PAY_METHOD 6종에 없으므로 payMethod는 비워두고 methodDetail만 기록한다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        ...paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice),
        method: { type: "PaymentMethodConvenienceStore", convenienceStoreBrand: "CU" },
      });

      await syncPayment(order.merchantUid);

      const payment = await PaymentModel.findOne({ merchantUid: order.merchantUid }).lean();
      expect(payment?.payMethod).toBeUndefined();
      expect(payment?.methodDetail?.type).toBe("PaymentMethodConvenienceStore");
    });

    it("인식 불가한 type 값이면 Unrecognized로 폴백해 흔적을 남긴다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        ...paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice),
        method: { type: "PaymentMethodFutureThing" },
      });

      await syncPayment(order.merchantUid);

      const payment = await PaymentModel.findOne({ merchantUid: order.merchantUid }).lean();
      expect(payment?.payMethod).toBeUndefined();
      expect(payment?.methodDetail?.type).toBe("Unrecognized");
    });

    it("method 자체가 없으면 payMethod/methodDetail 둘 다 비운다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice),
      );

      await syncPayment(order.merchantUid);

      const payment = await PaymentModel.findOne({ merchantUid: order.merchantUid }).lean();
      expect(payment?.payMethod).toBeUndefined();
      expect(payment?.methodDetail).toBeUndefined();
    });
  });

  describe("FAILED 상태 처리", () => {
    it("salesCount를 증가시키지 않고 Order를 CANCELLED로 전이시킨다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(3);
      const failedAt = new Date().toISOString();

      getPaymentMock.mockResolvedValue({
        status: "FAILED",
        id: order.merchantUid,
        failedAt,
        failure: { reason: "카드 한도 초과" },
      });

      const result = await syncPayment(order.merchantUid);

      expect(result.success).toBe(false);
      const updatedProduct = await ProductModel.findById(savedProduct._id).lean();
      expect(updatedProduct?.salesCount).toBe(0);

      const updatedOrder = await OrderModel.findById(order._id).lean();
      expect(updatedOrder?.cancelReason).toBe("카드 한도 초과");
      expect(updatedOrder?.cancelledAt?.toISOString()).toBe(failedAt);
    });

    it("이미 Payment 문서가 있으면 새로 만들지 않고 갱신한다", async () => {
      const { order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        status: "FAILED",
        id: order.merchantUid,
        failedAt: new Date().toISOString(),
        failure: { reason: "카드 한도 초과" },
      });

      await syncPayment(order.merchantUid);
      const result = await syncPayment(order.merchantUid);

      expect(result).toMatchObject({ success: false, message: "카드 한도 초과" });
    });

    it("트랜잭션 도중(Order 상태 전이 단계) 실패하면 이미 생성된 Payment도 함께 롤백된다", async () => {
      const { order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        status: "FAILED",
        id: order.merchantUid,
        failedAt: new Date().toISOString(),
        failure: { reason: "카드 한도 초과" },
      });
      const saveSpy = vi
        .spyOn(OrderModel.prototype, "save")
        .mockRejectedValueOnce(new Error("의도적 트랜잭션 중단"));

      await expect(syncPayment(order.merchantUid)).rejects.toThrow("의도적 트랜잭션 중단");

      const payment = await PaymentModel.findOne({ merchantUid: order.merchantUid }).lean();
      expect(payment).toBeNull();

      const updatedOrder = await OrderModel.findById(order._id).lean();
      expect(updatedOrder?.orderStatus).toBe("PENDING");

      saveSpy.mockRestore();
    });
  });

  describe("webhook 취소 상태 처리", () => {
    it("PAID 이후 CANCELLED 동기화는 Payment/Order를 취소하고 판매 수량을 한 번만 되돌린다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(2);
      getPaymentMock.mockResolvedValue(
        paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice),
      );
      await syncPayment(order.merchantUid);

      const cancelledAt = new Date().toISOString();
      getPaymentMock.mockResolvedValue({
        status: "CANCELLED",
        id: order.merchantUid,
        transactionId: "txn_1",
        cancelledAt,
        amount: { paid: order.finalPrice, cancelled: order.finalPrice },
        cancellations: [{ status: "SUCCEEDED", totalAmount: order.finalPrice, reason: "고객 요청", cancelledAt }],
      });

      await syncPayment(order.merchantUid);
      await syncPayment(order.merchantUid);

      expect(await PaymentModel.findOne({ merchantUid: order.merchantUid }).lean()).toMatchObject({
        status: "CANCELLED",
        cancelAmount: order.finalPrice,
        cancelReason: "고객 요청",
      });
      expect(await OrderModel.findById(order._id).lean()).toMatchObject({
        orderStatus: "CANCELLED",
        cancelReason: "고객 요청",
      });
      expect((await ProductModel.findById(savedProduct._id).lean())?.salesCount).toBe(0);
    });

    it("PARTIAL_CANCELLED는 Payment에 취소 합계를 기록하고 Order는 CONFIRMED로 유지한다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(2);
      getPaymentMock.mockResolvedValue(
        paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice),
      );
      await syncPayment(order.merchantUid);

      const cancelledAt = new Date().toISOString();
      getPaymentMock.mockResolvedValue({
        status: "PARTIAL_CANCELLED",
        id: order.merchantUid,
        transactionId: "txn_1",
        cancelledAt,
        amount: { paid: order.finalPrice, cancelled: 1000 },
        cancellations: [{ status: "SUCCEEDED", totalAmount: 1000, reason: "부분 환불", cancelledAt }],
      });

      await syncPayment(order.merchantUid);

      expect(await PaymentModel.findOne({ merchantUid: order.merchantUid }).lean()).toMatchObject({
        status: "PARTIAL_CANCELLED",
        cancelAmount: 1000,
        cancelReason: "부분 환불",
      });
      expect((await OrderModel.findById(order._id).lean())?.orderStatus).toBe("CONFIRMED");
      expect((await ProductModel.findById(savedProduct._id).lean())?.salesCount).toBe(2);
    });
  });

  describe("그 외 상태 처리", () => {
    it("주문을 찾을 수 없으면 AppError(NOT_FOUND)를 던진다", async () => {
      getPaymentMock.mockResolvedValue({ status: "READY" });

      await expect(syncPayment("존재하지-않는-merchantUid")).rejects.toMatchObject({
        category: "NOT_FOUND",
      });
    });

    it("PAID/FAILED가 아니면 매핑된 상태로 결제 대기를 리턴한다", async () => {
      const { order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({ status: "READY", id: order.merchantUid });

      const result = await syncPayment(order.merchantUid);

      expect(result).toEqual({ success: false, status: "PENDING" });
    });

    it("알 수 없는 상태 문자열이면 EXTERNAL_SERVICE 에러가 전파된다", async () => {
      const { order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({ status: "ALIEN_STATUS", id: order.merchantUid });

      await expect(syncPayment(order.merchantUid)).rejects.toMatchObject({
        category: "EXTERNAL_SERVICE",
      });
    });

    it("상태값이 문자열이 아니면 EXTERNAL_SERVICE 에러가 전파된다", async () => {
      const { order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({ status: 12345, id: order.merchantUid });

      await expect(syncPayment(order.merchantUid)).rejects.toMatchObject({
        category: "EXTERNAL_SERVICE",
      });
    });

    it("PortOne SDK 자체 오류면 AppError(EXTERNAL_SERVICE)로 감싼다", async () => {
      const { order } = await setupProductAndOrder(1);
      // 실제 PortOneError는 abstract class라 직접 new할 수 없다 — 이 파일에서는
      // @portone/server-sdk 전체를 mock했으므로(위 vi.mock) concrete 클래스로
      // 대체됐지만, import 시점의 타입은 실제 .d.ts(abstract) 기준이라 캐스팅한다.
      const PortOneErrorCtor = PortOneError as unknown as new (message: string) => Error;
      getPaymentMock.mockRejectedValue(new PortOneErrorCtor("포트원 서버 오류"));

      await expect(syncPayment(order.merchantUid)).rejects.toMatchObject({
        category: "EXTERNAL_SERVICE",
      });
    });
  });

  describe("cancelPayment", () => {
    it("정상 취소: Order/Payment가 CANCELLED로 전이된다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice),
      );
      await syncPayment(order.merchantUid);

      cancelPaymentMock.mockResolvedValue({
        cancellation: {
          status: "SUCCEEDED",
          totalAmount: order.finalPrice,
          cancelledAt: new Date().toISOString(),
        },
      });

      await cancelPayment(order.merchantUid, "정보 미입력으로 인한 자동 취소");

      const updatedOrder = await OrderModel.findById(order._id).lean();
      expect(updatedOrder?.orderStatus).toBe("CANCELLED");
      expect(updatedOrder?.cancelReason).toBe("정보 미입력으로 인한 자동 취소");

      const payment = await PaymentModel.findOne({ merchantUid: order.merchantUid }).lean();
      expect(payment?.status).toBe("CANCELLED");
      expect(payment?.cancelAmount).toBe(order.finalPrice);
    });

    it("주문을 찾을 수 없으면 NOT_FOUND를 던진다", async () => {
      await expect(cancelPayment("존재하지-않는-merchantUid", "사유")).rejects.toMatchObject({
        category: "NOT_FOUND",
      });
    });

    it("PortOne 취소가 FAILED면 EXTERNAL_SERVICE를 던지고 상태를 바꾸지 않는다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice),
      );
      await syncPayment(order.merchantUid);

      cancelPaymentMock.mockResolvedValue({ cancellation: { status: "FAILED" } });

      await expect(cancelPayment(order.merchantUid, "사유")).rejects.toMatchObject({
        category: "EXTERNAL_SERVICE",
      });

      const updatedOrder = await OrderModel.findById(order._id).lean();
      expect(updatedOrder?.orderStatus).toBe("CONFIRMED");
    });
  });

  describe("cancelExpiredAwaitingCoupleInfoOrders", () => {
    const expireConfirmedAt = async (orderId: mongoose.Types.ObjectId) => {
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
      await OrderModel.updateOne(
        { _id: orderId },
        { confirmedAt: eightDaysAgo, $unset: { coupleInfoId: 1 } },
      );
    };

    it("기한(7일) 초과 + coupleInfoId 없는 CONFIRMED 주문을 자동취소한다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice),
      );
      await syncPayment(order.merchantUid);
      await expireConfirmedAt(order._id);

      cancelPaymentMock.mockResolvedValue({
        cancellation: {
          status: "SUCCEEDED",
          totalAmount: order.finalPrice,
          cancelledAt: new Date().toISOString(),
        },
      });

      await cancelExpiredAwaitingCoupleInfoOrders(order.userId.toString());

      const updatedOrder = await OrderModel.findById(order._id).lean();
      expect(updatedOrder?.orderStatus).toBe("CANCELLED");
    });

    it("기한이 안 지났으면 건드리지 않는다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice),
      );
      await syncPayment(order.merchantUid);
      await OrderModel.updateOne({ _id: order._id }, { $unset: { coupleInfoId: 1 } });

      await cancelExpiredAwaitingCoupleInfoOrders(order.userId.toString());

      expect(cancelPaymentMock).not.toHaveBeenCalled();
      const updatedOrder = await OrderModel.findById(order._id).lean();
      expect(updatedOrder?.orderStatus).toBe("CONFIRMED");
    });

    it("한 주문의 취소 실패가 같은 유저의 다른 만료 주문 처리를 막지 않는다", async () => {
      const { savedProduct, order: order1 } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(order1.merchantUid, savedProduct._id.toString(), order1.finalPrice),
      );
      await syncPayment(order1.merchantUid);
      await expireConfirmedAt(order1._id);

      const { savedProduct: savedProduct2, order: order2 } = await setupProductAndOrder(1);
      await OrderModel.updateOne({ _id: order2._id }, { userId: order1.userId });
      getPaymentMock.mockResolvedValue({
        ...paidPayload(order2.merchantUid, savedProduct2._id.toString(), order2.finalPrice),
        transactionId: "txn_2",
      });
      await syncPayment(order2.merchantUid);
      await expireConfirmedAt(order2._id);

      cancelPaymentMock.mockImplementation(({ paymentId }: { paymentId: string }) => {
        if (paymentId === order1.merchantUid) {
          return Promise.reject(new Error("PG 일시 오류"));
        }
        return Promise.resolve({
          cancellation: {
            status: "SUCCEEDED",
            totalAmount: order2.finalPrice,
            cancelledAt: new Date().toISOString(),
          },
        });
      });

      await expect(
        cancelExpiredAwaitingCoupleInfoOrders(order1.userId.toString()),
      ).resolves.toBeUndefined();

      const updatedOrder1 = await OrderModel.findById(order1._id).lean();
      const updatedOrder2 = await OrderModel.findById(order2._id).lean();
      expect(updatedOrder1?.orderStatus).toBe("CONFIRMED");
      expect(updatedOrder2?.orderStatus).toBe("CANCELLED");
    });
  });
});
