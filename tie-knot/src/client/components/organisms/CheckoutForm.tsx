import { AlertCircle } from "lucide-react";

import { PayStatus } from "@/server/models";
import { BuyerInfo } from "@/shared/schemas";

import { Spinner } from "@/client/components/molecules";
import { PaymentPendingOverlay } from "@/app/(main)/(checkout)/payment/_components/PaymentPendingOverlay";
import { TypographySmall, TypographyMuted } from "@/client/components/atoms";
import { BuyerInfoCard } from "@/app/(main)/(checkout)/payment/_components/BuyerInfoCard";
import { TermsAgreementCard } from "@/app/(main)/(checkout)/payment/_components/TermsAgreementCard";
import { CheckoutSubmitBar } from "@/app/(main)/(checkout)/payment/_components/CheckoutSubmitBar";
import { PaymentMethodSelector } from "./PaymentMethodSelector";

interface CheckoutFormProps {
  loading: boolean;
  paymentStatus: PayStatus | "IDLE";
  agreed: boolean;
  onAgreedChange: (agreed: boolean) => void;
  errorMessage: string | null;
  errors: Partial<Record<keyof BuyerInfo, string[]>>;
  pending: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function CheckoutForm({
  loading,
  paymentStatus,
  agreed,
  onAgreedChange,
  errorMessage,
  errors,
  pending,
  onSubmit,
}: CheckoutFormProps) {
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
      <form onSubmit={onSubmit} className="space-y-6 pb-24">
        <BuyerInfoCard errors={errors} />
        <PaymentMethodSelector error={errors.payMethod?.[0]} />
        <TermsAgreementCard agreed={agreed} onAgreedChange={onAgreedChange} />

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
