"use client";

import BottomActionBar from "@/components/organisms/BottomActionBar";
import Spinner from "@/components/molecules/Spinner";
import { Save } from "lucide-react";
import type { PayStatus } from "@/models/payment";

interface CheckoutSubmitBarProps {
  disabled: boolean;
  pending: boolean;
  paymentStatus: PayStatus | "IDLE";
}

export function CheckoutSubmitBar({
  disabled,
  pending,
  paymentStatus,
}: CheckoutSubmitBarProps) {
  const isProcessing = pending || paymentStatus === "PENDING";

  return (
    <BottomActionBar disabled={disabled}>
      {isProcessing ? <Spinner /> : <Save className="mr-2 aspect-square w-5" />}
      {pending
        ? "주문 처리 중..."
        : paymentStatus === "PENDING"
          ? "결제 진행 중..."
          : "결제하기"}
    </BottomActionBar>
  );
}
