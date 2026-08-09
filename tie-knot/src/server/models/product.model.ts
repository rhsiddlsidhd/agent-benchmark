import mongoose, { model, Schema, Model } from "mongoose";
import {
  ProductCategory,
  SubCategory,
  SUB_CATEGORY_MAP,
  PRODUCT_CATEGORIES,
  InvitationTheme,
} from "@/shared/constants";

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
  // 스키마가 default: null이라 모든 문서에 항상 존재한다 — optional이 아니라 nullable.
  deletedAt: Date | null;
  images: string[];
  minQuantity: number;
  maxQuantity: number;
}

export interface IProduct extends ProductDB {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// invitation 카테고리 전용 필드 — mongoose discriminator로 base(IProduct)에 병합된다.
export interface IInvitationProduct extends IProduct {
  previewUrl?: string;
  theme?: InvitationTheme;
}

export interface ProductJSON extends Omit<ProductDB, "likes" | "featureIds" | "deletedAt"> {
  _id: string;
  likes: string[];
  featureIds: string[];
  previewUrl?: string;
  theme?: InvitationTheme;
  isLiked: boolean;
  discountedPrice: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

const productSchema = new Schema<IProduct>(
  {
    authorId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    thumbnail: { type: String, required: true },
    price: { type: Number, required: true },
    category: {
      type: String,
      enum: PRODUCT_CATEGORIES,
      required: true,
    },
    subCategory: {
      type: String,
      required: true,
      validate: {
        validator: async function (
          this: mongoose.Document<unknown, unknown, IProduct> | mongoose.Query<unknown, IProduct>,
          value: string,
        ) {
          let category = this.get("category") as ProductCategory | undefined;
          if (!category && "getQuery" in this) {
            const existing = await (this.model as mongoose.Model<IProduct>)
              .findOne(this.getQuery())
              .select("category")
              .lean();
            category = existing?.category;
          }
          // 카테고리가 5종으로 늘면서 SUB_CATEGORY_MAP 인덱싱 결과가 카테고리별로 다른
          // 리터럴 튜플 타입의 union이 된다 — 명시적으로 readonly string[]로 넓혀야
          // .includes()가 "not assignable to parameter of type 'never'"로 막히지 않는다.
          const allowed: readonly string[] | undefined =
            SUB_CATEGORY_MAP[category as ProductCategory];
          return allowed?.includes(value) ?? false;
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
    images: { type: [String], default: [] },
    minQuantity: { type: Number, required: true, default: 1, min: 1 },
    maxQuantity: { type: Number, required: true, default: 0, min: 0 },
  },
  {
    timestamps: true,
    // 이미 존재하는 category 필드를 판별키로 재사용한다 — 카테고리별 discriminator를
    // 추가할 때 새 필드를 만들지 않는다(src/server/models/CLAUDE.md 참고).
    discriminatorKey: "category",
  },
);

export const ProductModel =
  (mongoose.models.Product as Model<IProduct>) ||
  model<IProduct>("Product", productSchema);

const invitationProductSchema = new Schema<IInvitationProduct>({
  previewUrl: { type: String },
  theme: { type: String, enum: ["blossom", "default"], default: "default" },
});

// discriminator 이름("invitation")이 곧 category 필드에 저장되는 값이다 —
// 기존 category enum 값과 그대로 일치시킨다. HMR 재컴파일 시 이미 등록된
// discriminator를 재사용해 "Cannot overwrite discriminator" 에러를 피한다.
export const InvitationProductModel =
  (ProductModel.discriminators?.invitation as Model<IInvitationProduct>) ||
  ProductModel.discriminator<IInvitationProduct>("invitation", invitationProductSchema);
