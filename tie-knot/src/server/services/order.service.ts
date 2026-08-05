import mongoose from "mongoose";
import { IOrder, OrderJSON, OrderModel } from "@/server/models";
import { CreateOrderDto } from "@/shared/schemas";
import { generateUid } from "@/shared/utils";
import { dbConnect } from "@/server/lib/mongodb";
import { AppError } from "@/shared/types";
import { COUPLE_INFO_DEADLINE_DAYS } from "@/shared/constants";

const assertObjectIdLike = (id: string, label: string): void => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    throw new AppError("VALIDATION", `${label} 형식이 올바르지 않습니다.`);
  }
};

export const createOrderService = async (
  data: CreateOrderDto & { userId: string },
): Promise<IOrder> => {
  await dbConnect();

  if (data.coupleInfoId) assertObjectIdLike(data.coupleInfoId, "커플 정보 ID");
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
    coupleInfoId: data.coupleInfoId
      ? new mongoose.Types.ObjectId(data.coupleInfoId)
      : undefined,
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

/**
 * 결제 완료된 주문에 couple-info를 연결한다(TODO.md "couple-info를 payment
 * 이후로 분리" 참고) — 소유권과 결제 상태를 재검증한 뒤에만 연결한다.
 */
export const attachCoupleInfoToOrder = async (
  orderId: string,
  coupleInfoId: string,
  userId: string,
): Promise<IOrder> => {
  await dbConnect();

  assertObjectIdLike(orderId, "주문 ID");
  assertObjectIdLike(coupleInfoId, "커플 정보 ID");

  const order = await OrderModel.findById(orderId);

  if (!order) {
    throw new AppError("NOT_FOUND", "주문을 찾을 수 없습니다.");
  }

  if (order.userId.toString() !== userId) {
    throw new AppError("FORBIDDEN", "본인 주문만 연결할 수 있습니다.");
  }

  if (order.orderStatus !== "CONFIRMED") {
    throw new AppError(
      "VALIDATION",
      "결제 완료된 주문에만 커플 정보를 연결할 수 있습니다.",
    );
  }

  order.coupleInfoId = new mongoose.Types.ObjectId(coupleInfoId);
  await order.save();

  return order.toObject();
};

/**
 * 결제완료(CONFIRMED)됐지만 coupleInfoId를 채우지 않은 채 기한을 넘긴
 * 주문을 조회한다(자동취소 대상, TODO.md "couple-info를 payment 이후로
 * 분리" 참고) — 순수 조회만 담당. 실제 취소(PortOne 환불)는
 * payment.service의 cancelPayment가 맡는다(order.service가 payment.service를
 * import하면 순환 의존이 생기므로, 오케스트레이션은 호출부에서 두 함수를
 * 조합한다).
 */
export const findExpiredAwaitingCoupleInfoOrders = async (
  userId: string | mongoose.Types.ObjectId,
): Promise<IOrder[]> => {
  await dbConnect();

  const deadline = new Date();
  deadline.setDate(deadline.getDate() - COUPLE_INFO_DEADLINE_DAYS);

  return OrderModel.find({
    userId,
    orderStatus: "CONFIRMED",
    coupleInfoId: { $exists: false },
    confirmedAt: { $lt: deadline },
  }).lean<IOrder[]>();
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
): Promise<OrderJSON[]> => {
  await dbConnect();

  const orders = await OrderModel.find({ userId })
    .sort({ createdAt: -1 })
    .lean<IOrder[]>();

  // .lean() 결과의 ObjectId 필드를 명시적으로 문자열화한다(services/CLAUDE.md
  // 컨벤션) — Server Component(my-orders/page.tsx)가 Client Component로 그대로
  // 넘기므로, ObjectId 인스턴스가 하나라도 남으면 "Only plain objects..." 에러가 난다.
  return orders.map((order) => ({
    ...order,
    _id: order._id.toString(),
    coupleInfoId: order.coupleInfoId?.toString(),
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
