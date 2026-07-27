import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

const { pushMock, clearOrderMock, usePortOnePaymentMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  clearOrderMock: vi.fn(),
  usePortOnePaymentMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/server/actions", () => ({ createOrder: vi.fn() }));

vi.mock("@/client/store", () => ({
  useOrderStore: (selector: (s: { clearOrder: () => void }) => unknown) =>
    selector({ clearOrder: clearOrderMock }),
}));

vi.mock("@/client/hooks", () => ({
  usePortOnePayment: usePortOnePaymentMock,
  useCheckoutData: () => ({ data: null as unknown, loading: false }),
  useCheckoutForm: () => ({ errors: {}, handleSubmit: vi.fn() }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

import { toast } from "sonner";
import { CheckoutForm } from "./CheckoutForm";

describe("CheckoutForm (컨테이너)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePortOnePaymentMock.mockReturnValue({ paymentStatus: "IDLE", triggerPayment: vi.fn() });
  });

  it("결제 성공 시 주문 정보를 비우고 /payment/success로 이동한다", () => {
    render(<CheckoutForm query="q1" />);

    const { onSuccess } = usePortOnePaymentMock.mock.calls[0][0];
    onSuccess("merchant-1");

    expect(clearOrderMock).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("결제가 완료되었습니다!");
    expect(pushMock).toHaveBeenCalledWith("/payment/success?orderId=merchant-1");
  });
});
