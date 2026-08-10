import { beforeEach, describe, expect, it, vi } from "vitest";

const { verify, isUnrecognizedWebhook, syncPayment } = vi.hoisted(() => ({
  verify: vi.fn(),
  isUnrecognizedWebhook: vi.fn(),
  syncPayment: vi.fn(),
}));

vi.mock("@portone/server-sdk", () => ({ Webhook: { verify, isUnrecognizedWebhook } }));
vi.mock("@/server/services/payment.service", () => ({ syncPayment }));

import { POST } from "./route";

const request = (body = "raw-body") => new Request("http://localhost/api/webhooks/portone", {
  method: "POST",
  body,
  headers: {
    "webhook-id": "event-1",
    "webhook-signature": "v1,signature",
    "webhook-timestamp": "123",
  },
});

describe("POST /api/webhooks/portone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("PORTONE_WEBHOOK_SECRET", "webhook-secret");
    vi.stubEnv("NEXT_PUBLIC_PORTONE_STORE_ID", "store-1");
    isUnrecognizedWebhook.mockReturnValue(false);
  });

  it("raw body와 공식 헤더로 서명을 검증한 뒤 서버 결제 조회를 실행한다", async () => {
    verify.mockResolvedValue({
      type: "Transaction.Paid",
      timestamp: "2026-08-10T00:00:00.000Z",
      data: { paymentId: "payment-1", transactionId: "tx-1", storeId: "store-1" },
    });

    const response = await POST(request());

    expect(verify).toHaveBeenCalledWith("webhook-secret", "raw-body", {
      "webhook-id": "event-1",
      "webhook-signature": "v1,signature",
      "webhook-timestamp": "123",
    });
    expect(syncPayment).toHaveBeenCalledWith("payment-1");
    expect(response.status).toBe(200);
  });

  it("서명 검증 실패를 400으로 거부한다", async () => {
    verify.mockRejectedValue(new Error("invalid signature"));

    const response = await POST(request());

    expect(response.status).toBe(400);
    expect(syncPayment).not.toHaveBeenCalled();
  });

  it("다른 store의 유효한 webhook을 거부한다", async () => {
    verify.mockResolvedValue({ type: "Transaction.Failed", timestamp: "now", data: { paymentId: "payment-1", transactionId: "tx-1", storeId: "other" } });

    const response = await POST(request());

    expect(response.status).toBe(400);
    expect(syncPayment).not.toHaveBeenCalled();
  });

  it("SDK가 아직 모르는 webhook은 재시도 폭주 없이 202로 수신 처리한다", async () => {
    verify.mockResolvedValue({ type: "Future.Event", data: {} });
    isUnrecognizedWebhook.mockReturnValue(true);

    const response = await POST(request());

    expect(response.status).toBe(202);
    expect(syncPayment).not.toHaveBeenCalled();
  });

  it("webhook secret이나 store 설정이 없으면 503으로 차단한다", async () => {
    vi.stubEnv("PORTONE_WEBHOOK_SECRET", "");

    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(verify).not.toHaveBeenCalled();
  });
});
