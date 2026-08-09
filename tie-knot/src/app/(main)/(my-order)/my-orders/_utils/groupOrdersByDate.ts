import { format } from "date-fns";
import { OrderJSON } from "@/server/models";

export const groupOrdersByDate = (orders: OrderJSON[]) => {
  const grouped: Record<string, OrderJSON[]> = {};

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
