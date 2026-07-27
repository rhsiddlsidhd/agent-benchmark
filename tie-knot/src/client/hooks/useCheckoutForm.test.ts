import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CheckoutItem } from "@/shared/types";
import { useCheckoutForm } from "./useCheckoutForm";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import { toast } from "sonner";

const buildOrder = (overrides?: Partial<CheckoutItem>): CheckoutItem => ({
  productId: "product-1",
  title: "봄맞이 청첩장",
  thumbnail: "https://example.com/thumb.jpg",
  originalPrice: 10000,
  discountedPrice: 9000,
  discountAmount: 1000,
  optionsTotalPrice: 0,
  finalPrice: 9000,
  quantity: 1,
  selectedFeatures: [],
  ...overrides,
});

const buildSubmitEvent = () => {
  const form = document.createElement("form");
  const fields = {
    buyerName: "홍길동",
    buyerEmail: "test@example.com",
    buyerPhone: "010-1234-5678",
    payMethod: "CARD",
  };
  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  return {
    preventDefault: vi.fn(),
    currentTarget: form,
  } as unknown as React.FormEvent;
};

describe("useCheckoutForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("order가 없으면 에러 토스트와 함께 /products로 이동한다", () => {
    const routerReplace = vi.fn();
    const action = vi.fn();
    const { result } = renderHook(() =>
      useCheckoutForm({ query: "q1", order: null, action, router: { replace: routerReplace } as never }),
    );

    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(toast.error).toHaveBeenCalledWith("주문 정보를 찾을 수 없습니다. 다시 시도해주세요.");
    expect(routerReplace).toHaveBeenCalledWith("/products");
    expect(action).not.toHaveBeenCalled();
  });

  it("입력값 검증에 실패하면 errors에 담고 action을 호출하지 않는다", () => {
    const routerReplace = vi.fn();
    const action = vi.fn();
    const { result } = renderHook(() =>
      useCheckoutForm({
        query: "q1",
        order: buildOrder(),
        action,
        router: { replace: routerReplace } as never,
      }),
    );

    const event = buildSubmitEvent();
    (event.currentTarget as HTMLFormElement).querySelector<HTMLInputElement>(
      'input[name="buyerEmail"]',
    )!.value = "invalid-email";

    act(() => {
      result.current.handleSubmit(event);
    });

    expect(action).not.toHaveBeenCalled();
    expect(result.current.errors.buyerEmail).toBeDefined();
  });

  it("정상 입력이면 주문 정보를 formData에 담아 action을 호출한다", () => {
    const routerReplace = vi.fn();
    const action = vi.fn();
    const order = buildOrder({ coupleInfoId: "couple-1" });
    const { result } = renderHook(() =>
      useCheckoutForm({ query: "q1", order, action, router: { replace: routerReplace } as never }),
    );

    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0][0] as FormData;
    expect(formData.get("productId")).toBe("product-1");
    expect(formData.get("coupleInfoId")).toBe("couple-1");
    expect(result.current.errors).toEqual({});
  });
});
