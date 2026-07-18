import { useOrderStore } from "@/store/order.store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function useCheckoutData({ skip = false }: { skip?: boolean } = {}) {
  const router = useRouter();
  const order = useOrderStore((state) => state.order);
  const hasHydrated = useOrderStore((state) => state._hasHydrated);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (skip) return;
    // hydration 완료 후에만 order 유무 체크
    if (hasHydrated && !order) {
      const errorMessage = "주문 정보가 없습니다. 상품 페이지로 이동합니다.";
      setError(errorMessage);
      toast.error(errorMessage);
      router.replace("/products");
    }
  }, [hasHydrated, order, router, skip]);

  return {
    data: order,
    loading: !hasHydrated,
    error,
  };
}
