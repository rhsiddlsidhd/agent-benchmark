export const dynamic = "force-dynamic";

import {
  verifySession,
  getOrdersByUserId,
  cancelExpiredAwaitingCoupleInfoOrders,
} from "@/server/services";
import { groupOrdersByDate } from "./_utils";
import { MyOrdersTemplate } from "./_components";

const Page = async () => {
  const session = await verifySession();
  await cancelExpiredAwaitingCoupleInfoOrders(session.userId);
  const orders = await getOrdersByUserId(session.userId);

  const groupedOrders = groupOrdersByDate(orders);

  return <MyOrdersTemplate groupedOrders={groupedOrders} />;
};

export default Page;
