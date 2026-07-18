import mongoose from "mongoose";
import { IOrder, OrderModel } from "@/models/order.model";

import { CreateOrderDto } from "@/schemas/order.schema";
import { generateUid } from "@/utils/id";
import { dbConnect } from "@/utils/mongodb";

export const createOrderService = async (
  data: CreateOrderDto & { userId: string },
): Promise<IOrder> => {
  await dbConnect();

  const merchantUid = generateUid("ORDER");

  // DB 저장을 위한 최종 데이터 가공(Trans)
  const orderData = {
    ...data,
    coupleInfo: new mongoose.Types.ObjectId(data.coupleInfoId),
    userId: new mongoose.Types.ObjectId(data.userId),
    merchantUid,
    product: {
      ...data.product,
      productId: new mongoose.Types.ObjectId(data.product.productId),
      selectedFeatures: data.product.selectedFeatures.map((f) => ({
        ...f,
        featureId: new mongoose.Types.ObjectId(f.featureId),
      })),
    },
  };

  const order = await OrderModel.create(orderData);

  const orderObj = order.toJSON();

  return orderObj;
};

export const getOrderSeviceByMerchantUid = async (
  merchantUid: string,
): Promise<IOrder | null> => {
  await dbConnect();

  const order = await OrderModel.findOne({ merchantUid });

  if (!order) return null;

  return order.toObject({ versionKey: false }) as IOrder;
};

export const getActiveOrderInfoByCoupleInfoId = async (
  coupleInfoId: string,
): Promise<{ features: string[]; productId: string | null }> => {
  await dbConnect();

  const order = await OrderModel.findOne({
    coupleInfoId: new mongoose.Types.ObjectId(coupleInfoId),
    orderStatus: { $in: ["CONFIRMED", "COMPLETED"] },
  })
    .select("product.productId product.selectedFeatures")
    .lean();

  if (!order) return { features: [], productId: null };

  return {
    features: order.product.selectedFeatures.map((f) => f.code),
    productId: order.product.productId?.toString() ?? null,
  };
};

export const getOrdersByUserId = async (
  userId: string | mongoose.Types.ObjectId,
) => {
  await dbConnect();

  const orders = await OrderModel.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  return orders;
};
