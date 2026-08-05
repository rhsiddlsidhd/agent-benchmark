import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { CreateOrderResult } from "@/server/actions";

const { requestPaymentMock } = vi.hoisted(() => ({
  requestPaymentMock: vi.fn(),
}));

vi.mock("@portone/browser-sdk/v2", () => ({
  default: { requestPayment: requestPaymentMock },
}));

vi.mock("@/server/actions", () => ({
  completePayment: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

// paymentStatus가 order.store로 이전됨(OrderSummary와 공유 목적) — 실제 zustand
// create로 대체 구현해 hook의 selector 구독이 실제로 재렌더를 트리거하게 한다.
vi.mock("@/client/store", async () => {
  const { create } = await import("zustand");
  const useOrderStore = create<{
    paymentStatus: string;
    setPaymentStatus: (status: string) => void;
  }>((set) => ({
    paymentStatus: "IDLE",
    setPaymentStatus: (status) => set({ paymentStatus: status }),
  }));
  return { useOrderStore };
});

import { completePayment } from "@/server/actions";
import { useOrderStore } from "@/client/store";
import { usePortOnePayment } from "./usePortOnePayment";

const orderData: CreateOrderResult = {
  merchantUid: "merchant-1",
  finalPrice: 10000,
  payMethod: "CARD",
  buyerName: "홍길동",
  buyerEmail: "a@b.com",
  buyerPhone: "010-0000-0000",
  title: "청첩장",
  userId: "user-1",
  productId: "product-1",
  message: "",
};

describe("usePortOnePayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOrderStore.setState({ paymentStatus: "IDLE" });
    process.env.NEXT_PUBLIC_POST_ONE_STORE_ID = "store-1";
    process.env.NEXT_PUBLIC_POST_ONE_CHANNELKEY = "channel-1";
  });

  it("정상 경로: 결제/검증 성공 시 onSuccess를 merchantUid로 호출한다", async () => {
    requestPaymentMock.mockResolvedValue({ paymentId: "merchant-1" });
    vi.mocked(completePayment).mockResolvedValue({
      success: true,
      data: { status: "PAID" },
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => usePortOnePayment({ onSuccess }));

    await act(async () => {
      await result.current.triggerPayment(orderData);
    });

    expect(completePayment).toHaveBeenCalledWith("merchant-1");
    await waitFor(() => {
      expect(result.current.paymentStatus).toBe("PAID");
    });
    expect(onSuccess).toHaveBeenCalledWith("merchant-1");
  });

  it("서버 검증 실패 시 실패 상태로 전환하고 onError를 호출한다", async () => {
    requestPaymentMock.mockResolvedValue({ paymentId: "merchant-1" });
    vi.mocked(completePayment).mockResolvedValue({
      success: false,
      error: { category: "VALIDATION", message: "결제 검증에 실패했습니다." },
    });

    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() =>
      usePortOnePayment({ onSuccess, onError }),
    );

    await act(async () => {
      await result.current.triggerPayment(orderData);
    });

    await waitFor(() => {
      expect(result.current.paymentStatus).toBe("FAILED");
    });
    expect(onError).toHaveBeenCalledWith("결제 검증에 실패했습니다.");
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("paymentId가 없으면 결제 정보 오류로 처리하고 completePayment를 호출하지 않는다", async () => {
    requestPaymentMock.mockResolvedValue({ paymentId: undefined });

    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() =>
      usePortOnePayment({ onSuccess, onError }),
    );

    await act(async () => {
      await result.current.triggerPayment(orderData);
    });

    expect(completePayment).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith("결제 정보가 올바르지 않습니다.");
  });

  it("검증은 성공했지만 상태가 PAID가 아니면 실패로 처리한다", async () => {
    requestPaymentMock.mockResolvedValue({ paymentId: "merchant-1" });
    vi.mocked(completePayment).mockResolvedValue({
      success: true,
      data: { status: "PENDING" },
    });

    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() =>
      usePortOnePayment({ onSuccess, onError }),
    );

    await act(async () => {
      await result.current.triggerPayment(orderData);
    });

    await waitFor(() => {
      expect(result.current.paymentStatus).toBe("PENDING");
    });
    expect(onError).toHaveBeenCalledWith(
      "결제 검증에 실패했습니다. 고객센터에 문의해주세요.",
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("PortOne SDK 호출이 예외를 던지면 결제 중 오류로 처리한다", async () => {
    requestPaymentMock.mockRejectedValue(new Error("network down"));

    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() =>
      usePortOnePayment({ onSuccess, onError }),
    );

    await act(async () => {
      await result.current.triggerPayment(orderData);
    });

    expect(completePayment).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith("결제 중 오류가 발생했습니다.");
  });
});
