import { describe, it, expect, beforeEach } from "vitest";
import { useOrderStore } from "./order.store";
import type { CheckoutItem } from "@/shared/types";

const mockOrder: CheckoutItem = {
  productId: "product-1",
  title: "청첩장",
  thumbnail: "https://example.com/thumb.png",
  originalPrice: 10000,
  discountedPrice: 9000,
  discountAmount: 1000,
  optionsTotalPrice: 0,
  finalPrice: 9000,
  quantity: 1,
  selectedFeatures: [],
};

describe("useOrderStore", () => {
  beforeEach(() => {
    useOrderStore.setState({ order: null, paymentStatus: "IDLE", _hasHydrated: false });
  });

  it("초기 상태는 order null, paymentStatus IDLE이다", () => {
    const state = useOrderStore.getState();

    expect(state.order).toBeNull();
    expect(state.paymentStatus).toBe("IDLE");
  });

  it("setOrder 호출 시 order를 저장하고 paymentStatus를 IDLE로 리셋한다", () => {
    useOrderStore.getState().setPaymentStatus("PAID");

    useOrderStore.getState().setOrder(mockOrder);

    const state = useOrderStore.getState();
    expect(state.order).toEqual(mockOrder);
    expect(state.paymentStatus).toBe("IDLE");
  });

  it("clearOrder 호출 시 order만 null로 만들고 paymentStatus는 건드리지 않는다", () => {
    useOrderStore.getState().setOrder(mockOrder);
    useOrderStore.getState().setPaymentStatus("PENDING");

    useOrderStore.getState().clearOrder();

    const state = useOrderStore.getState();
    expect(state.order).toBeNull();
    expect(state.paymentStatus).toBe("PENDING");
  });

  it("setPaymentStatus 호출 시 paymentStatus를 갱신한다", () => {
    useOrderStore.getState().setPaymentStatus("FAILED");

    expect(useOrderStore.getState().paymentStatus).toBe("FAILED");
  });
});
