import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const { useOrderStoreMock, routerReplaceMock } = vi.hoisted(() => ({
  useOrderStoreMock: vi.fn(),
  routerReplaceMock: vi.fn(),
}));

vi.mock("@/client/store", () => ({ useOrderStore: useOrderStoreMock }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplaceMock }),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import { toast } from "sonner";
import { useCheckoutData } from "./useCheckoutData";

type State = { order: unknown; _hasHydrated: boolean };

const mockState = (state: State) => {
  useOrderStoreMock.mockImplementation((selector: (s: State) => unknown) => selector(state));
};

describe("useCheckoutData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hydration 전에는 loading true, order 유무를 체크하지 않는다", () => {
    mockState({ order: null, _hasHydrated: false });

    const { result } = renderHook(() => useCheckoutData());

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(routerReplaceMock).not.toHaveBeenCalled();
  });

  it("hydration 후 order가 없으면 에러 메시지와 함께 /products로 이동한다", () => {
    mockState({ order: null, _hasHydrated: true });

    const { result } = renderHook(() => useCheckoutData());

    expect(result.current.error).toBe("주문 정보가 없습니다. 상품 페이지로 이동합니다.");
    expect(toast.error).toHaveBeenCalledWith("주문 정보가 없습니다. 상품 페이지로 이동합니다.");
    expect(routerReplaceMock).toHaveBeenCalledWith("/products");
  });

  it("order가 있으면 이동하지 않는다", () => {
    mockState({ order: { productId: "p1" }, _hasHydrated: true });

    const { result } = renderHook(() => useCheckoutData());

    expect(result.current.data).toEqual({ productId: "p1" });
    expect(result.current.error).toBeNull();
    expect(routerReplaceMock).not.toHaveBeenCalled();
  });

  it("skip이 true면 order가 없어도 이동하지 않는다", () => {
    mockState({ order: null, _hasHydrated: true });

    const { result } = renderHook(() => useCheckoutData({ skip: true }));

    expect(result.current.error).toBeNull();
    expect(routerReplaceMock).not.toHaveBeenCalled();
  });
});
