import { describe, it, expect } from "vitest";
import { IOrder } from "@/server/models";
import { groupOrdersByDate } from "./groupOrdersByDate";

const buildOrder = (overrides?: Partial<IOrder>): IOrder =>
  ({
    _id: "order-1",
    merchantUid: "merchant-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }) as IOrder;

describe("groupOrdersByDate", () => {
  it("같은 날짜의 주문을 하나의 그룹으로 묶는다", () => {
    const orders = [
      buildOrder({ merchantUid: "a", createdAt: new Date("2026-01-01T09:00:00.000Z") }),
      buildOrder({ merchantUid: "b", createdAt: new Date("2026-01-01T10:00:00.000Z") }),
    ];

    const grouped = groupOrdersByDate(orders);

    expect(grouped).toHaveLength(1);
    expect(grouped[0][1]).toHaveLength(2);
  });

  it("최신 날짜가 먼저 오도록 내림차순 정렬한다", () => {
    const orders = [
      buildOrder({ merchantUid: "old", createdAt: new Date("2026-01-01T09:00:00.000Z") }),
      buildOrder({ merchantUid: "new", createdAt: new Date("2026-01-03T09:00:00.000Z") }),
    ];

    const grouped = groupOrdersByDate(orders);

    expect(grouped[0][0]).toBe("2026-01-03");
    expect(grouped[1][0]).toBe("2026-01-01");
  });

  it("주문이 없으면 빈 배열을 리턴한다", () => {
    expect(groupOrdersByDate([])).toEqual([]);
  });
});
