import { useState, useCallback } from "react";
import PortOne from "@portone/browser-sdk/v2";
import { PayStatus } from "@/models/payment";
import { fetcher } from "@/api/fetcher";
import { toast } from "sonner";
import type { CreateOrderResult } from "@/actions/createOrderAction";

const storeId = process.env.NEXT_PUBLIC_POST_ONE_STORE_ID;
const channelKey = process.env.NEXT_PUBLIC_POST_ONE_CHANNELKEY;

interface UsePortOnePaymentOptions {
  onSuccess: (merchantUid: string) => void;
  onError?: (message: string) => void;
}

export function usePortOnePayment({ onSuccess, onError }: UsePortOnePaymentOptions) {
  const [paymentStatus, setPaymentStatus] = useState<PayStatus | "IDLE">("IDLE");

  const fail = (message: string, status: PayStatus = "FAILED") => {
    setPaymentStatus(status);
    toast.error(message);
    onError?.(message);
  };

  const triggerPayment = useCallback(
    async (orderData: CreateOrderResult) => {
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
        const payment = await PortOne.requestPayment({
          storeId,
          channelKey,
          paymentId: merchantUid,
          orderName: `${title} 모바일 청첩장`,
          totalAmount: finalPrice,
          currency: "CURRENCY_KRW",
          payMethod,
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

        const result = await fetcher<{ status: PayStatus }>(
          "/api/payment/complete",
          { auth: true },
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId: payment.paymentId }),
          },
        );

        if (result.status !== "PAID") {
          fail("결제 검증에 실패했습니다. 고객센터에 문의해주세요.", result.status);
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
