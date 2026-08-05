import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CheckoutItem } from "@/shared/types";
import { PayStatus } from "@/server/models";

interface OrderState {
  order: CheckoutItem | null;
  setOrder: (orderData: CheckoutItem) => void;
  clearOrder: () => void;
  paymentStatus: PayStatus | "IDLE";
  setPaymentStatus: (status: PayStatus | "IDLE") => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      order: null as CheckoutItem | null,
      // order 트리거 시점(구매하기/결제하기)과 paymentStatus 트리거 시점(체크아웃 폼 제출)이
      // 서로 달라, 리셋 안 하면 이전 결제 시도의 상태가 새 주문으로 새어 들어간다.
      setOrder: (orderData) => set({ order: orderData, paymentStatus: "IDLE" }),
      clearOrder: () => set({ order: null }),
      paymentStatus: "IDLE",
      setPaymentStatus: (status) => set({ paymentStatus: status }),
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "order-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state): Pick<OrderState, "order"> => ({
        order: state.order,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
