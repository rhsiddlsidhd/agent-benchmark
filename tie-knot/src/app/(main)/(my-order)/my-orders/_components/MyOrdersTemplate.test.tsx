import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { IOrder } from "@/server/models";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/client/store", () => ({
  useOrderStore: (selector: (s: { setOrder: (item: unknown) => void }) => unknown) =>
    selector({ setOrder: vi.fn() }),
}));

import { MyOrdersTemplate } from "./MyOrdersTemplate";

const buildOrder = (overrides?: Partial<IOrder>): IOrder =>
  ({
    _id: { toString: () => "order-1" },
    merchantUid: "merchant-1",
    coupleInfoId: { toString: () => "couple-1" },
    finalPrice: 9000,
    discountRate: 0,
    discountAmount: 0,
    payMethod: "CARD",
    orderStatus: "PENDING",
    product: {
      productId: { toString: () => "product-1" },
      title: "봄맞이 청첩장",
      thumbnail: "https://example.com/thumb.jpg",
      pricing: { originalPrice: 10000, discountedPrice: 9000 },
      quantity: 1,
      selectedFeatures: [],
    },
    ...overrides,
  }) as unknown as IOrder;

describe("MyOrdersTemplate", () => {
  it("주문이 없으면 빈 상태 메시지를 렌더링한다", () => {
    render(<MyOrdersTemplate groupedOrders={[]} />);

    expect(screen.getByText("주문 내역이 없습니다.")).toBeInTheDocument();
  });

  it("날짜별로 그룹핑된 주문을 렌더링한다", () => {
    render(
      <MyOrdersTemplate
        groupedOrders={[["2026-01-01", [buildOrder()]]]}
      />,
    );

    expect(screen.getByText("2026년 01월 01일")).toBeInTheDocument();
    expect(screen.getByText("봄맞이 청첩장")).toBeInTheDocument();
    expect(screen.getByText("주문대기")).toBeInTheDocument();
  });

  it("PENDING 상태면 결제하기 버튼을 보여준다", () => {
    render(
      <MyOrdersTemplate
        groupedOrders={[["2026-01-01", [buildOrder({ orderStatus: "PENDING" })]]]}
      />,
    );

    expect(screen.getByRole("button", { name: /결제하기/ })).toBeInTheDocument();
  });

  it("CONFIRMED 상태면 환불신청 버튼을 보여준다", () => {
    render(
      <MyOrdersTemplate
        groupedOrders={[["2026-01-01", [buildOrder({ orderStatus: "CONFIRMED" })]]]}
      />,
    );

    expect(screen.getByRole("button", { name: /환불신청/ })).toBeInTheDocument();
  });

  it("COMPLETED 상태면 리뷰 버튼을 보여준다", () => {
    render(
      <MyOrdersTemplate
        groupedOrders={[["2026-01-01", [buildOrder({ orderStatus: "COMPLETED" })]]]}
      />,
    );

    expect(screen.getByRole("button", { name: /리뷰/ })).toBeInTheDocument();
  });

  it("CANCELLED 상태면 수정하기 링크를 보여주지 않는다", () => {
    render(
      <MyOrdersTemplate
        groupedOrders={[["2026-01-01", [buildOrder({ orderStatus: "CANCELLED" })]]]}
      />,
    );

    expect(screen.queryByRole("link", { name: /수정하기/ })).not.toBeInTheDocument();
  });

  it("결제완료(CONFIRMED)인데 coupleInfoId가 없으면 정보입력 대기 배너를 보여주고 수정하기는 숨긴다", () => {
    render(
      <MyOrdersTemplate
        groupedOrders={[
          ["2026-01-01", [buildOrder({ orderStatus: "CONFIRMED", coupleInfoId: undefined })]],
        ]}
      />,
    );

    expect(
      screen.getByText(/청첩장 정보가 아직 입력되지 않았어요/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /정보 입력하기/ })).toHaveAttribute(
      "href",
      "/my-orders/couple-info?orderId=order-1",
    );
    expect(screen.queryByRole("link", { name: /수정하기/ })).not.toBeInTheDocument();
  });

  it("coupleInfoId가 있으면 정보입력 대기 배너 없이 수정하기 링크를 보여준다", () => {
    render(
      <MyOrdersTemplate
        groupedOrders={[["2026-01-01", [buildOrder({ orderStatus: "CONFIRMED" })]]]}
      />,
    );

    expect(
      screen.queryByText(/청첩장 정보가 아직 입력되지 않았어요/),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /수정하기/ })).toHaveAttribute(
      "href",
      "/my-orders/edit?q=couple-1",
    );
  });
});
