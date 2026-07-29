import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { CheckoutItem } from "@/shared/types";

const { pushMock, setOrderMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  setOrderMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/client/store", () => ({
  useOrderStore: (selector: (s: { setOrder: (item: unknown) => void }) => unknown) =>
    selector({ setOrder: setOrderMock }),
}));

vi.mock("@/client/components/organisms", () => ({
  ProductSummary: (props: {
    product: unknown;
    options: unknown;
    onPurchase: (item: CheckoutItem) => void;
  }): null => {
    receivedPropsRef.current = props;
    return null;
  },
}));

const receivedPropsRef: {
  current: { product: unknown; options: unknown; onPurchase: ((item: CheckoutItem) => void) | null } | null;
} = { current: null };

import { ProductSummary } from "./ProductSummary";

const CHECKOUT_ITEM: CheckoutItem = {
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
};

describe("ProductSummary (컨테이너)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    receivedPropsRef.current = null;
  });

  it("product/options를 순수 컴포넌트에 그대로 전달한다", () => {
    const product = { _id: "product-1", title: "봄맞이 청첩장" } as never;
    const options = [{ _id: "feature-1" }] as never;

    render(<ProductSummary product={product} options={options} />);

    expect(receivedPropsRef.current?.product).toBe(product);
    expect(receivedPropsRef.current?.options).toBe(options);
  });

  it("구매 시 주문 정보를 store에 저장하고 /payment로 이동한다", () => {
    render(<ProductSummary product={{ _id: "product-1" } as never} options={[]} />);

    receivedPropsRef.current?.onPurchase?.(CHECKOUT_ITEM);

    expect(setOrderMock).toHaveBeenCalledWith(CHECKOUT_ITEM);
    expect(setOrderMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith("/payment");
    expect(pushMock).toHaveBeenCalledTimes(1);
  });

  it("store 저장과 라우팅 순서는 setOrder가 먼저다", () => {
    const callOrder: string[] = [];
    setOrderMock.mockImplementation(() => callOrder.push("setOrder"));
    pushMock.mockImplementation(() => callOrder.push("push"));

    render(<ProductSummary product={{ _id: "product-1" } as never} options={[]} />);
    receivedPropsRef.current?.onPurchase?.(CHECKOUT_ITEM);

    expect(callOrder).toEqual(["setOrder", "push"]);
  });
});
