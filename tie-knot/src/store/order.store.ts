import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CheckoutItem } from "@/types/checkout";

interface OrderState {
  order: CheckoutItem | null;
  setOrder: (orderData: CheckoutItem) => void;
  clearOrder: () => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      order: null as CheckoutItem | null,
      setOrder: (orderData) => set({ order: orderData }),
      clearOrder: () => set({ order: null }),
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
