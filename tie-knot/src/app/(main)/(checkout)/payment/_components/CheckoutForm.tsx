"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createOrder, type CreateOrderResult } from "@/server/actions";
import { APIResponse } from "@/shared/types";
import { useOrderStore } from "@/client/store";
import { usePortOnePayment } from "@/client/hooks";
import { useCheckoutData } from "@/client/hooks";
import { useCheckoutForm } from "@/client/hooks";
import { CheckoutForm as PureCheckoutForm } from "@/client/components/organisms";
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

  const [prevActionState, setPrevActionState] = useState(state);
  if (state !== prevActionState) {
    setPrevActionState(state);
    setErrorMessage(state && state.success === false ? state.error.message : null);
  }

  useEffect(() => {
    if (state && state.success !== false) {
      triggerPayment(state.data);
    }
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
