import * as z from "zod";
import { PRODUCT_CATEGORIES } from "@/shared/utils";

const isoDateString = z.string().refine((v) => !isNaN(Date.parse(v)), {
  message: "ISO date string이 아님",
});

export const productResponseSchema = z.object({
  _id: z.string(),
  authorId: z.string(),
  title: z.string(),
  description: z.string(),
  thumbnail: z.string(),
  previewUrl: z.string().optional(),
  theme: z.enum(["blossom", "default"]).optional(),
  price: z.number(),
  category: z.enum(PRODUCT_CATEGORIES),
  subCategory: z.string(),
  isPremium: z.boolean(),
  featureIds: z.array(z.string()),
  isFeatured: z.boolean(),
  priority: z.number(),
  likes: z.array(z.string()),
  views: z.number(),
  salesCount: z.number(),
  discount: z.object({
    discountType: z.enum(["rate", "amount"]),
    value: z.number(),
  }),
  status: z.enum(["active", "inactive", "soldOut", "deleted"]),
  isLiked: z.boolean(),
  discountedPrice: z.number(),
  createdAt: isoDateString,
  updatedAt: isoDateString,
  deletedAt: isoDateString.nullable(),

  // ── 신규 (REQ-2) — 셋 다 non-optional. transformProduct 정규화가 보장한다. ──
  images: z.array(z.string()),
  minQuantity: z.number(),
  maxQuantity: z.number(),
});

export const productsResponseSchema = z.array(productResponseSchema);

export type ProductResponse = z.infer<typeof productResponseSchema>;
