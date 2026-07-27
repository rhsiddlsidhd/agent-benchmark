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
  ProductSummary: ({ onPurchase }: { onPurchase: (item: CheckoutItem) => void }): null => {
    onPurchaseRef.current = onPurchase;
    return null;
  },
}));

const onPurchaseRef: { current: ((item: CheckoutItem) => void) | null } = { current: null };

import { ProductSummary } from "./ProductSummary";

describe("ProductSummary (컨테이너)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onPurchaseRef.current = null;
  });

  it("구매 시 주문 정보를 store에 저장하고 /couple-info로 이동한다", () => {
    render(
      <ProductSummary
        product={{ _id: "product-1" } as never}
        options={[]}
      />,
    );

    const checkoutItem: CheckoutItem = {
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

    onPurchaseRef.current?.(checkoutItem);

    expect(setOrderMock).toHaveBeenCalledWith(checkoutItem);
    expect(pushMock).toHaveBeenCalledWith("/couple-info");
  });
});
