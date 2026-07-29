import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IOrder } from "@/server/models";

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

import { PaymentButton } from "./PaymentButton";

const buildOrder = (): IOrder =>
  ({
    coupleInfoId: { toString: () => "couple-1" },
    finalPrice: 9000,
    product: {
      productId: { toString: () => "product-1" },
      title: "봄맞이 청첩장",
      thumbnail: "https://example.com/thumb.jpg",
      pricing: { originalPrice: 10000, discountedPrice: 9000 },
      quantity: 1,
      selectedFeatures: [],
    },
  }) as unknown as IOrder;

describe("PaymentButton (컨테이너)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("클릭 시 주문 정보를 store에 저장하고 결제 페이지로 이동한다", async () => {
    const user = userEvent.setup();
    render(<PaymentButton order={buildOrder()} />);

    await user.click(screen.getByRole("button", { name: /결제하기/ }));

    expect(setOrderMock).toHaveBeenCalledWith(
      expect.objectContaining({ productId: "product-1", coupleInfoId: "couple-1" }),
    );
    expect(pushMock).toHaveBeenCalledWith("/payment");
  });
});
