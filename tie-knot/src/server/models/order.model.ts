import mongoose, { Schema, Types, Model } from "mongoose";
import { PayMethod } from "./payment.model";
import { PAY_METHOD } from "@/shared/constants";
interface ProductPricing {
  originalPrice: number;
  discountedPrice: number;
}
interface SelectedFeatureSnapShot {
  featureId: Types.ObjectId | string;
  code: string;
  label: string;
  price: number;
}

interface ProductSnapShot {
  productId: Types.ObjectId | string;
  title: string;
  thumbnail: string;
  pricing: ProductPricing;
  quantity: number;
  selectedFeatures: SelectedFeatureSnapShot[];
}

const selectedFeatureSnapShotSchema = new Schema<SelectedFeatureSnapShot>(
  {
    featureId: {
      type: Schema.Types.ObjectId,
      ref: "Feature",
      required: true,
    },
    code: { type: String, required: true },
    label: { type: String, required: true },
    price: { type: Number, required: true },
  },
  {
    _id: false,
  },
);

const ProductSnapShotSchema = new Schema<ProductSnapShot>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    title: { type: String, required: true },
    thumbnail: { type: String, required: true },
    pricing: {
      originalPrice: { type: Number, required: true },
      discountedPrice: {
        type: Number,
        required: true,
      },
    },
    quantity: { type: Number, required: true, default: 1 },
    selectedFeatures: {
      type: [selectedFeatureSnapShotSchema],
      default: [],
    },
  },
  { _id: false },
);

// 학습중

const ORDER_STATUS = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
] as const;

type OrderStatusType = (typeof ORDER_STATUS)[number];

export interface IOrder {
  _id: Types.ObjectId;
  merchantUid: string;
  coupleInfoId: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  product: ProductSnapShot;
  finalPrice: number;
  discountRate: number;
  discountAmount: number;
  payMethod: PayMethod;
  orderStatus: OrderStatusType;
  paymentId?: Types.ObjectId | string;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    // 식별자
    merchantUid: { type: String, required: true, unique: true },
    coupleInfoId: {
      type: Schema.Types.ObjectId,
      ref: "CoupleInfo",
      required: true,
    },

    // 구매자
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // 공통 Dto
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    buyerPhone: { type: String, required: true },

    // 상품정보
    product: { type: ProductSnapShotSchema, required: true },
    finalPrice: { type: Number },
    discountRate: { type: Number, default: 0, min: 0, max: 1 },
    discountAmount: { type: Number, default: 0 },

    // 결제 수단
    payMethod: {
      type: String,
      enum: PAY_METHOD,
      required: true,
    },

    // 주문 상태
    orderStatus: {
      type: String,
      enum: ORDER_STATUS,
      required: true,
      default: "PENDING",
    },

    // 결제 참조
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },

    // 이력
    cancelledAt: { type: Date },
    cancelReason: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
    },
  },
);

export const OrderModel =
  (mongoose.models.Order as Model<IOrder>) ||
  mongoose.model<IOrder>("Order", orderSchema);
