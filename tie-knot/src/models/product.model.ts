import mongoose, { model, Schema } from "mongoose";
import {
  ProductCategory,
  SubCategory,
  SUB_CATEGORY_MAP,
} from "@/utils/category";

export type { ProductCategory, SubCategory };
export { SUB_CATEGORY_MAP };

export type Status = "active" | "inactive" | "soldOut" | "deleted";

const discountSchema = new Schema(
  {
    discountType: {
      type: String,
      enum: ["rate", "amount"],
      default: "rate",
    },
    value: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

export interface ProductDB {
  authorId: string;
  title: string;
  description: string;
  thumbnail: string;
  previewUrl?: string;
  price: number;
  category: ProductCategory;
  subCategory: SubCategory;
  isPremium: boolean;
  featureIds?: mongoose.Types.ObjectId[];
  isFeatured: boolean;
  priority: number;
  likes: mongoose.Types.ObjectId[];
  views: number;
  salesCount: number;
  discount: {
    discountType: "rate" | "amount";
    value: number;
  };
  status: Status;
  deletedAt?: Date;
}

export interface ProductDocument extends ProductDB, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductJSON extends Omit<ProductDB, "likes" | "featureIds" | "deletedAt"> {
  _id: string;
  likes: string[];
  featureIds: string[];
  isLiked: boolean;
  discountedPrice: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

const productSchema = new Schema<ProductDocument>(
  {
    authorId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    thumbnail: { type: String, required: true },
    previewUrl: { type: String },
    price: { type: Number, required: true },
    category: {
      type: String,
      enum: ["invitation", "business-card"],
      required: true,
    },
    subCategory: {
      type: String,
      required: true,
      validate: {
        validator: function (this: ProductDocument, value: string) {
          const allowed = SUB_CATEGORY_MAP[this.category];
          return allowed?.includes(value as SubCategory) ?? false;
        },
        message: (props: { value: string }) =>
          `'${props.value}'는 해당 카테고리에서 허용되지 않는 subCategory입니다.`,
      },
    },
    isFeatured: { type: Boolean, default: false },
    priority: { type: Number, default: 0 },
    likes: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    views: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },
    discount: {
      type: discountSchema,
      default: () => ({ discountType: "rate", value: 0 }),
    },
    isPremium: { type: Boolean, required: true },
    status: {
      type: String,
      enum: ["active", "inactive", "soldOut", "deleted"],
      default: "active",
    },
    featureIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Feature" }],
      default: [],
    },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

// 모델 컴파일 전 기존 모델 삭제 (개발 환경에서의 캐싱 에러 방지)
if (mongoose.models.Product) {
  delete mongoose.models.Product;
}

export const ProductModel = model<ProductDocument>("Product", productSchema);
