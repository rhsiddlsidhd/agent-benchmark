"use client";

import { useOrderStore } from "@/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function useCheckoutData({ skip = false }: { skip?: boolean } = {}) {
  const router = useRouter();
  const order = useOrderStore((state) => state.order);
  const hasHydrated = useOrderStore((state) => state._hasHydrated);

  // hydration 완료 후에만 order 유무 체크
  const error =
    !skip && hasHydrated && !order
      ? "주문 정보가 없습니다. 상품 페이지로 이동합니다."
      : null;

  useEffect(() => {
    if (error) {
      toast.error(error);
      router.replace("/products");
    }
  }, [error, router]);

  return {
    data: order,
    loading: !hasHydrated,
    error,
  };
}
