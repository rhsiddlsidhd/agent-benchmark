import mongoose from "mongoose";
import { IOrder, OrderModel } from "@/server/models";
import { CreateOrderDto } from "@/shared/schemas";
import { generateUid } from "@/shared/utils";
import { dbConnect } from "@/server/lib/mongodb";
import { AppError } from "@/shared/types";

const assertObjectIdLike = (id: string, label: string): void => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    throw new AppError("VALIDATION", `${label} 형식이 올바르지 않습니다.`);
  }
};

export const createOrderService = async (
  data: CreateOrderDto & { userId: string },
): Promise<IOrder> => {
  await dbConnect();

  assertObjectIdLike(data.coupleInfoId, "커플 정보 ID");
  assertObjectIdLike(data.userId, "사용자 ID");
  assertObjectIdLike(data.product.productId, "상품 ID");
  data.product.selectedFeatures.forEach((f) => assertObjectIdLike(f.featureId, "옵션 ID"));

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

  const order = await OrderModel.create(orderData).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "주문 생성에 실패했습니다.",
    );
  });

  return order.toObject();
};

export const getOrderSeviceByMerchantUid = async (
  merchantUid: string,
): Promise<IOrder | null> => {
  await dbConnect();

  const order = await OrderModel.findOne({ merchantUid }).lean<IOrder>();

  return order;
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
): Promise<IOrder[]> => {
  await dbConnect();

  const orders = await OrderModel.find({ userId })
    .sort({ createdAt: -1 })
    .lean<IOrder[]>();

  // .lean() 결과의 ObjectId 유니온 필드(_id 제외 — IOrder에서 ObjectId로 고정 타입)를
  // 명시적으로 문자열화한다(services/CLAUDE.md 컨벤션) — 소비처(my-orders/page.tsx)가
  // 이미 이 필드들에 .toString()을 호출하므로 동작은 그대로다.
  return orders.map((order) => ({
    ...order,
    coupleInfoId: order.coupleInfoId.toString(),
    userId: order.userId.toString(),
    paymentId: order.paymentId?.toString(),
    product: {
      ...order.product,
      productId: order.product.productId.toString(),
      selectedFeatures: order.product.selectedFeatures.map((f) => ({
        ...f,
        featureId: f.featureId.toString(),
      })),
    },
  }));
};
