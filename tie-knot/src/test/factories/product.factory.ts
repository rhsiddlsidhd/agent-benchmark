import mongoose from "mongoose";
import { ProductDto } from "@/shared/schemas";

type CreateProductServiceInput = Omit<ProductDto, "thumbnail" | "images"> & {
  thumbnail: string;
  images: string[];
  authorId: string;
  previewUrl?: string;
};

export const buildProductInput = (
  overrides?: Partial<CreateProductServiceInput>,
): CreateProductServiceInput => ({
  authorId: new mongoose.Types.ObjectId().toString(),
  title: "봄맞이 청첩장",
  description: "봄 시즌 한정 모바일 청첩장 템플릿입니다.",
  category: "invitation",
  subCategory: "wedding",
  price: 9900,
  isPremium: false,
  isFeatured: false,
  priority: 0,
  thumbnail: "https://example.com/thumbnail.jpg",
  images: [],
  minQuantity: 1,
  maxQuantity: 0,
  ...overrides,
});
