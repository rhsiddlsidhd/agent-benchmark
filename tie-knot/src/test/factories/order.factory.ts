import mongoose from "mongoose";
import { CreateOrderDto } from "@/shared/schemas";

export const buildOrderInput = (
  overrides?: Partial<CreateOrderDto & { userId: string }>,
): CreateOrderDto & { userId: string } => ({
  userId: new mongoose.Types.ObjectId().toString(),
  coupleInfoId: new mongoose.Types.ObjectId().toString(),
  buyerName: "김철수",
  buyerEmail: "buyer@example.com",
  buyerPhone: "010-1234-5678",
  payMethod: "CARD",
  discountRate: 0,
  discountAmount: 0,
  product: {
    productId: new mongoose.Types.ObjectId().toString(),
    title: "봄맞이 청첩장",
    thumbnail: "https://example.com/thumbnail.jpg",
    pricing: { originalPrice: 9900, discountedPrice: 9900 },
    quantity: 1,
    selectedFeatures: [],
  },
  ...overrides,
});
