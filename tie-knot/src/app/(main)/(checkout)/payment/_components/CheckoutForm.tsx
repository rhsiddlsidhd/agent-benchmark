"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createOrder, type CreateOrderResult } from "@/actions/createOrder";
import { APIResponse } from "@/types";
import { useOrderStore } from "@/store/order.store";
import { usePortOnePayment } from "@/hooks";
import { useCheckoutData } from "@/hooks";
import { useCheckoutForm } from "@/hooks";
import { CheckoutForm as PureCheckoutForm } from "@/components/organisms/CheckoutForm";

export function CheckoutForm({ query }: { query: string }) {
  const router = useRouter();
  const clearOrder = useOrderStore((state) => state.clearOrder);

  const [state, action, pending] = useActionState<APIResponse<CreateOrderResult>, FormData>(
    createOrder,
    null,
  );
  const [agreed, setAgreed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // paymentStatus를 먼저 확보해야 useCheckoutData의 skip 조건에 사용 가능
  const handlePaymentSuccess = useCallback(
    (merchantUid: string) => {
      clearOrder();
      toast.success("결제가 완료되었습니다!");
      router.push(`/payment/success?orderId=${merchantUid}`);
    },
    [clearOrder, router],
  );

  const { paymentStatus, triggerPayment } = usePortOnePayment({
    onSuccess: handlePaymentSuccess,
    onError: setErrorMessage,
  });

  // 결제 진행 중이거나 실패한 경우, order 없음 감지로 인한 리다이렉트 방지
  const { data: order, loading } = useCheckoutData({
    skip: paymentStatus === "PENDING" || paymentStatus === "FAILED" || paymentStatus === "PAID",
  });

  const { errors, handleSubmit } = useCheckoutForm({ query, order, action, router });

  useEffect(() => {
    if (!state) return;
    if (state.success === false) {
      setErrorMessage(state.error.message);
      return;
    }
    setErrorMessage(null);
    triggerPayment(state.data);
  }, [state, triggerPayment]);

  // 결제 실패 후 재시도 시 기존 주문(merchantUid)으로 재결제 — DB 주문 중복 생성 방지
  const handleFormSubmit = (e: React.FormEvent) => {
    if (state?.success) {
      e.preventDefault();
      setErrorMessage(null);
      triggerPayment(state.data);
      return;
    }
    handleSubmit(e);
  };

  return (
    <PureCheckoutForm
      loading={loading}
      paymentStatus={paymentStatus}
      agreed={agreed}
      onAgreedChange={setAgreed}
      errorMessage={errorMessage}
      errors={errors}
      pending={pending}
      onSubmit={handleFormSubmit}
    />
  );
}
