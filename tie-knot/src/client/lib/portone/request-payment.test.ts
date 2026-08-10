import { beforeEach, describe, expect, it, vi } from "vitest";

const { sdkRequestPayment } = vi.hoisted(() => ({ sdkRequestPayment: vi.fn() }));
vi.mock("@portone/browser-sdk/v2", () => ({
  default: { requestPayment: sdkRequestPayment },
}));

import { requestPayment } from "./request-payment";

const request = {
  storeId: "store-test",
  channelKey: "channel-test",
  paymentId: "payment-test",
  orderName: "테스트 주문",
  totalAmount: 12000,
  currency: "CURRENCY_KRW" as const,
  payMethod: "CARD" as const,
};

describe("PortOne browser adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    sessionStorage.clear();
  });

  it("PR E2E mock은 외부 SDK를 호출하지 않고 동일 paymentId를 반환한다", async () => {
    vi.stubEnv("NEXT_PUBLIC_PORTONE_E2E_MOCK", "enabled");
    await expect(requestPayment(request)).resolves.toMatchObject({ paymentId: "payment-test" });
    expect(sdkRequestPayment).not.toHaveBeenCalled();
  });

  it("manual smoke은 cleanup용 paymentId를 기록하고 실제 SDK를 호출한다", async () => {
    vi.stubEnv("NEXT_PUBLIC_PORTONE_MANUAL_SMOKE", "enabled");
    sdkRequestPayment.mockResolvedValue({
      transactionType: "PAYMENT",
      txId: "tx-test",
      paymentId: "payment-test",
    });

    await requestPayment(request);

    expect(sessionStorage.getItem("portone-smoke-payment-id")).toBe("payment-test");
    expect(sdkRequestPayment).toHaveBeenCalledWith(request);
  });
});
