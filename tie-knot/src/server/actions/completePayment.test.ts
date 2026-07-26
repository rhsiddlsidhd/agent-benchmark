import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/shared/types";

vi.mock("@/server/services", () => ({
  requireAuth: vi.fn(),
  syncPayment: vi.fn(),
}));

import { requireAuth, syncPayment } from "@/server/services";
import { completePayment } from "./completePayment";

describe("completePayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("인증 세션이 없으면 UNAUTHENTICATED를 리턴한다", async () => {
    vi.mocked(requireAuth).mockRejectedValue(
      new AppError("UNAUTHENTICATED", "인증이 필요합니다."),
    );

    const result = await completePayment("merchant-1");

    expect(result).toEqual({
      success: false,
      error: { category: "UNAUTHENTICATED", message: "인증이 필요합니다.", fieldErrors: undefined },
    });
    expect(syncPayment).not.toHaveBeenCalled();
  });

  it("paymentId가 빈 문자열이면 VALIDATION을 리턴한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "USER",
      email: "a@b.com",
      userId: "user-1",
    });

    const result = await completePayment("");

    expect(result).toEqual({
      success: false,
      error: { category: "VALIDATION", message: "올바르지 않은 요청입니다.", fieldErrors: undefined },
    });
    expect(syncPayment).not.toHaveBeenCalled();
  });

  it("syncPayment가 실패하면 INTERNAL을 리턴한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "USER",
      email: "a@b.com",
      userId: "user-1",
    });
    vi.mocked(syncPayment).mockResolvedValue(
      null as unknown as Awaited<ReturnType<typeof syncPayment>>,
    );

    const result = await completePayment("merchant-1");

    expect(result).toEqual({
      success: false,
      error: {
        category: "INTERNAL",
        message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        fieldErrors: undefined,
      },
    });
  });

  it("정상 경로: syncPayment 결과의 status를 그대로 리턴한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "USER",
      email: "a@b.com",
      userId: "user-1",
    });
    vi.mocked(syncPayment).mockResolvedValue({
      status: "PAID",
    } as unknown as Awaited<ReturnType<typeof syncPayment>>);

    const result = await completePayment("merchant-1");

    expect(result).toEqual({ success: true, data: { status: "PAID" } });
  });
});
