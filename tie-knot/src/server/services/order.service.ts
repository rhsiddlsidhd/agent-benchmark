import mongoose from "mongoose";
import { IOrder, OrderModel } from "@/server/models";
import { CreateOrderDto } from "@/shared/schemas";
import { generateUid } from "@/shared/utils";
import { dbConnect } from "@/server/lib/mongodb";

export const createOrderService = async (
  data: CreateOrderDto & { userId: string },
): Promise<IOrder> => {
  await dbConnect();

  const merchantUid = generateUid("ORDER");

  // 최종 결제가 계산: 상품가*수량 + 옵션 합산 → 할인율 적용 → 고정 할인 차감 → 음수 방지
  const productTotal =
    data.product.pricing.discountedPrice * data.product.quantity;
  const optionsTotal = data.product.selectedFeatures.reduce(
    (acc, f) => acc + f.price,
    0,
  );
  const subTotal = productTotal + optionsTotal;
  const discounted =
    subTotal * (1 - (data.discountRate || 0)) - (data.discountAmount || 0);
  const finalPrice = Math.max(0, Math.floor(discounted));

  // DB 저장을 위한 최종 데이터 가공(Trans)
  const orderData = {
    ...data,
    coupleInfoId: new mongoose.Types.ObjectId(data.coupleInfoId),
    userId: new mongoose.Types.ObjectId(data.userId),
    merchantUid,
    finalPrice,
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

  return order.toObject();
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
