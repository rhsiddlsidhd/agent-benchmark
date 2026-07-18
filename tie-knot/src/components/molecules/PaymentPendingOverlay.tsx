import Spinner from "@/components/molecules/Spinner";
import { TypographyLarge, TypographyMuted } from "@/components/atoms/typoqraphy";

interface PaymentPendingOverlayProps {
  visible: boolean;
}

export function PaymentPendingOverlay({ visible }: PaymentPendingOverlayProps) {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-white/80 backdrop-blur-sm">
      <Spinner />
      <TypographyLarge>결제 진행 중...</TypographyLarge>
      <TypographyMuted>잠시만 기다려주세요.</TypographyMuted>
    </div>
  );
}
