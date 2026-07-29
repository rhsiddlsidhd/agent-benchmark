import { format } from "date-fns";
import { IOrder } from "@/server/models";

export const groupOrdersByDate = (orders: IOrder[]) => {
  const grouped: Record<string, IOrder[]> = {};

  orders.forEach((order) => {
    const dateKey = format(new Date(order.createdAt), "yyyy-MM-dd");
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(order);
  });

  return Object.entries(grouped).sort(([dateA], [dateB]) =>
    dateB.localeCompare(dateA),
  );
};
