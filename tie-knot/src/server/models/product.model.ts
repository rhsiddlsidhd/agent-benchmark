import mongoose, { model, Schema, Model } from "mongoose";
import {
  ProductCategory,
  SubCategory,
  SUB_CATEGORY_MAP,
} from "@/shared/utils";

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

export interface IProduct extends ProductDB {
  _id: mongoose.Types.ObjectId;
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

const productSchema = new Schema<IProduct>(
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
        validator: function (this: IProduct, value: string) {
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

export const ProductModel =
  (mongoose.models.Product as Model<IProduct>) ||
  model<IProduct>("Product", productSchema);
