import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/shared/types";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("@/server/lib/cookies", () => ({
  getCookie: vi.fn(),
}));

vi.mock("@/server/services", () => ({
  requireAuth: vi.fn(),
  createOrderService: vi.fn(),
}));

import { redirect } from "next/navigation";
import { getCookie } from "@/server/lib/cookies";
import { requireAuth, createOrderService } from "@/server/services";
import { createOrder } from "./createOrder";

const buildFormData = (overrides?: Record<string, string>) => {
  const formData = new FormData();
  const fields: Record<string, string> = {
    coupleInfoId: "couple-1",
    buyerName: "홍길동",
    buyerEmail: "a@b.com",
    buyerPhone: "010-1234-5678",
    payMethod: "CARD",
    productId: "product-1",
    productTitle: "봄맞이 청첩장",
    productThumbnail: "https://example.com/thumb.jpg",
    originalPrice: "10000",
    discountedPrice: "9000",
    productQuantity: "1",
    selectedFeatures: "[]",
    ...overrides,
  };
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return formData;
};

describe("createOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("로그인 쿠키가 없으면 /login으로 redirect한다", async () => {
    vi.mocked(getCookie).mockResolvedValue(undefined);

    await expect(createOrder(undefined, buildFormData())).rejects.toThrow("REDIRECT:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("입력값 검증에 실패하면 VALIDATION을 리턴한다", async () => {
    vi.mocked(getCookie).mockResolvedValue({ name: "token", value: "t" } as never);

    const result = await createOrder(undefined, buildFormData({ buyerEmail: "invalid" }));

    expect(result).toEqual({
      success: false,
      error: { category: "VALIDATION", message: "입력값이 올바르지 않습니다.", fieldErrors: expect.any(Object) },
    });
    expect(requireAuth).not.toHaveBeenCalled();
  });

  it("services가 던진 AppError를 리턴값으로 번역한다", async () => {
    vi.mocked(getCookie).mockResolvedValue({ name: "token", value: "t" } as never);
    vi.mocked(requireAuth).mockResolvedValue({ role: "USER", email: "a@b.com", userId: "user-1" });
    vi.mocked(createOrderService).mockRejectedValue(new AppError("INTERNAL", "주문 생성에 실패했습니다."));

    const result = await createOrder(undefined, buildFormData());

    expect(result).toEqual({
      success: false,
      error: {
        category: "INTERNAL",
        message: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        fieldErrors: undefined,
      },
    });
  });

  it("정상 경로: 주문 생성 결과를 리턴한다", async () => {
    vi.mocked(getCookie).mockResolvedValue({ name: "token", value: "t" } as never);
    vi.mocked(requireAuth).mockResolvedValue({ role: "USER", email: "a@b.com", userId: "user-1" });
    vi.mocked(createOrderService).mockResolvedValue({
      merchantUid: "merchant-1",
      finalPrice: 9000,
      payMethod: "CARD",
      buyerName: "홍길동",
      buyerEmail: "a@b.com",
      buyerPhone: "010-1234-5678",
      userId: { toString: () => "user-1" },
      product: { title: "봄맞이 청첩장", productId: { toString: () => "product-1" } },
    } as never);

    const result = await createOrder(undefined, buildFormData());

    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({
        merchantUid: "merchant-1",
        userId: "user-1",
        productId: "product-1",
      }),
    });
  });

  it("coupleInfoId 없이도(결제 이후 my-orders에서 채우는 흐름) 정상 생성된다", async () => {
    vi.mocked(getCookie).mockResolvedValue({ name: "token", value: "t" } as never);
    vi.mocked(requireAuth).mockResolvedValue({ role: "USER", email: "a@b.com", userId: "user-1" });
    vi.mocked(createOrderService).mockResolvedValue({
      merchantUid: "merchant-1",
      finalPrice: 9000,
      payMethod: "CARD",
      buyerName: "홍길동",
      buyerEmail: "a@b.com",
      buyerPhone: "010-1234-5678",
      userId: { toString: () => "user-1" },
      product: { title: "봄맞이 청첩장", productId: { toString: () => "product-1" } },
    } as never);

    const result = await createOrder(undefined, buildFormData({ coupleInfoId: "" }));

    expect(result.success).toBe(true);
    expect(vi.mocked(createOrderService).mock.calls[0][0]).not.toHaveProperty("coupleInfoId", "");
  });
});
