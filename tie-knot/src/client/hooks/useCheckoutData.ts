"use client";

import { useOrderStore } from "@/client/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { routes } from "@/shared/constants";

// 결제 진행/실패/완료 중엔 order가 곧 클리어되므로(성공 시 clearOrder) "주문 없음"
// 오탐 리다이렉트를 막아야 한다 — paymentStatus를 store에서 직접 읽어 CheckoutForm/
// OrderSummary(sibling, 서로 다른 컴포넌트) 양쪽이 같은 값으로 가드되게 한다.
const SKIP_PAYMENT_STATUSES = ["PENDING", "FAILED", "PAID"] as const;

export function useCheckoutData() {
  const router = useRouter();
  const order = useOrderStore((state) => state.order);
  const hasHydrated = useOrderStore((state) => state._hasHydrated);
  const paymentStatus = useOrderStore((state) => state.paymentStatus);

  const skip = (SKIP_PAYMENT_STATUSES as readonly string[]).includes(paymentStatus);

  // hydration 완료 후에만 order 유무 체크
  const error =
    !skip && hasHydrated && !order
      ? "주문 정보가 없습니다. 상품 페이지로 이동합니다."
      : null;

  useEffect(() => {
    if (error) {
      toast.error(error);
      router.replace(routes.products.root);
    }
  }, [error, router]);

  return {
    data: order,
    loading: !hasHydrated,
    error,
  };
}
