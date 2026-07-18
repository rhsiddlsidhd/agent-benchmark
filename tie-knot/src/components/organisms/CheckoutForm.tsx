"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

import { createOrderAction, type CreateOrderResult } from "@/actions/createOrderAction";
import { APIResponse } from "@/types/error";
import { useOrderStore } from "@/store/order.store";
import { usePortOnePayment } from "@/hooks/usePortOnePayment";
import { useCheckoutData } from "@/hooks/useCheckoutData";
import { useCheckoutForm } from "@/hooks/useCheckoutForm";

import Spinner from "@/components/molecules/Spinner";
import { PaymentPendingOverlay } from "@/components/molecules/PaymentPendingOverlay";
import { TypographySmall, TypographyMuted } from "@/components/atoms/typoqraphy";
import { BuyerInfoCard } from "@/app/(main)/(checkout)/payment/_components/BuyerInfoCard";
import { TermsAgreementCard } from "@/app/(main)/(checkout)/payment/_components/TermsAgreementCard";
import { CheckoutSubmitBar } from "@/app/(main)/(checkout)/payment/_components/CheckoutSubmitBar";
import PaymentMethodSelector from "./PaymentMethodSelector";

export function CheckoutForm({ query }: { query: string }) {
  const router = useRouter();
  const clearOrder = useOrderStore((state) => state.clearOrder);

  const [state, action, pending] = useActionState<APIResponse<CreateOrderResult>, FormData>(
    createOrderAction,
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

  if (loading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="relative">
      <PaymentPendingOverlay visible={paymentStatus === "PENDING"} />
      <form onSubmit={handleFormSubmit} className="space-y-6 pb-24">
        <BuyerInfoCard errors={errors} />
        <PaymentMethodSelector error={errors.payMethod?.[0]} />
        <TermsAgreementCard agreed={agreed} onAgreedChange={setAgreed} />

        {errorMessage && (
          <div className="border-destructive/50 bg-destructive/10 text-destructive flex items-start gap-3 rounded-lg border p-4 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <TypographySmall className="font-medium">오류가 발생했습니다</TypographySmall>
              <TypographyMuted className="text-destructive/80 mt-1">{errorMessage}</TypographyMuted>
            </div>
          </div>
        )}

        <CheckoutSubmitBar
          disabled={!agreed}
          pending={pending}
          paymentStatus={paymentStatus}
        />
      </form>
    </div>
  );
}
