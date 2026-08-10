"use client";

import { useCallback } from "react";
import { requestPayment } from "@/client/lib/portone/request-payment";
import { PayStatus } from "@/server/models";
import { completePayment, CreateOrderResult } from "@/server/actions";
import { useOrderStore } from "@/client/store";
import { toast } from "sonner";

interface UsePortOnePaymentOptions {
  onSuccess: (merchantUid: string) => void;
  onError?: (message: string) => void;
}

export function usePortOnePayment({ onSuccess, onError }: UsePortOnePaymentOptions) {
  // OrderSummary(sibling)도 같은 결제 진행 상태를 봐야 "주문 없음" 오탐 리다이렉트를 막을 수
  // 있어 로컬 state가 아니라 order.store에 둔다(useCheckoutData.ts 참고).
  const paymentStatus = useOrderStore((state) => state.paymentStatus);
  const setPaymentStatus = useOrderStore((state) => state.setPaymentStatus);

  const fail = (message: string, status: PayStatus = "FAILED") => {
    setPaymentStatus(status);
    toast.error(message);
    onError?.(message);
  };

  const triggerPayment = useCallback(
    async (orderData: CreateOrderResult) => {
      const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
      const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;
      if (!storeId || !channelKey) {
        fail("결제 설정이 올바르지 않습니다.");
        return;
      }

      const {
        merchantUid,
        finalPrice,
        payMethod,
        buyerName,
        buyerEmail,
        buyerPhone,
        title,
        userId,
        productId,
      } = orderData;

      setPaymentStatus("PENDING");

      try {
        const payment = await requestPayment({
          storeId,
          channelKey,
          paymentId: merchantUid,
          orderName: `${title} 모바일 청첩장`,
          totalAmount: finalPrice,
          currency: "CURRENCY_KRW",
          payMethod,
          productType: "DIGITAL",
          virtualAccount:
            payMethod === "VIRTUAL_ACCOUNT"
              ? { accountExpiry: { validHours: 24 } }
              : undefined,
          easyPay:
            payMethod === "EASY_PAY" ? { easyPayProvider: "KAKAOPAY" } : undefined,
          customer: {
            customerId: userId,
            fullName: buyerName,
            phoneNumber: buyerPhone,
            email: buyerEmail,
          },
          customData: { productId },
        });

        if (payment?.code !== undefined) {
          fail(`결제에 실패했습니다: ${payment.message}`);
          return;
        }

        if (!payment?.paymentId) {
          fail("결제 정보가 올바르지 않습니다.");
          return;
        }

        const result = await completePayment(payment.paymentId);

        if (result.success === false) {
          fail(result.error.message);
          return;
        }

        if (result.data.status !== "PAID") {
          fail(
            "결제 검증에 실패했습니다. 고객센터에 문의해주세요.",
            result.data.status,
          );
          return;
        }

        setPaymentStatus("PAID");
        onSuccess(merchantUid);
      } catch (error) {
        console.error("Payment error:", error);
        fail("결제 중 오류가 발생했습니다.");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onSuccess, onError],
  );

  return { paymentStatus, triggerPayment };
}
