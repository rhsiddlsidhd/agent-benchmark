import { ProductModel, ProductJSON, ProductDB } from "@/models/product.model";
import { ProductDto } from "@/schemas/product.schema";
import { dbConnect } from "@/utils/mongodb";
import { calculatePrice } from "@/utils/price";
import mongoose, { Types } from "mongoose";

// Product 타입을 export (다른 파일에서 사용)
export type Product = ProductJSON;

type LeanProduct = ProductDB & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
};

const transformProduct = (product: LeanProduct, userId?: string): ProductJSON => {
  const { deletedAt, _id, featureIds, likes, createdAt, updatedAt, ...rest } = product;

  return {
    ...rest,
    _id: _id.toString(),
    likes: likes?.map((id) => id.toString()) || [],
    featureIds: featureIds?.map((id) => id.toString()) || [],
    isLiked: userId
      ? (likes || []).some((id) => id.toString() === userId)
      : false,
    discountedPrice: calculatePrice(product.price, product.discount),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    ...(deletedAt && { deletedAt: deletedAt.toISOString() }),
  };
};

// 상품생성
export const createProductService = async (
  data: Omit<ProductDto, "thumbnail"> & {
    thumbnail: string;
    authorId: string;
    previewUrl?: string;
  },
): Promise<boolean> => {
  await dbConnect();
  try {
    const newProduct = await new ProductModel({
      ...data,
      status: data.status || "active",
      featureIds:
        data.isPremium && data.featureIds
          ? data.featureIds.map((value) => new mongoose.Types.ObjectId(value))
          : [],
    }).save();

    return !!newProduct;
  } catch (error: unknown) {
    const err = error as { message?: string; errors?: Record<string, { message: string }> };
    console.error("Mongoose Save Error Detailed:", err.message);
    if (err.errors) {
      Object.keys(err.errors).forEach((key) => {
        console.error(`Field [${key}]:`, err.errors![key].message);
      });
    }
    return false;
  }
};

// 단일 상품 조회
export const getProductService = async (
  productId: string,
  userId?: string,
): Promise<ProductJSON | null> => {
  await dbConnect();

  const product = await ProductModel.findOne({
    _id: productId,
    deletedAt: null,
  }).lean();

  return product ? transformProduct(product, userId) : null;
};

// 모든 상품 조회
export const getAllProductsService = async (
  category?: string,
  userId?: string,
): Promise<ProductJSON[]> => {
  await dbConnect();

  const query: Record<string, unknown> = { deletedAt: null };
  if (category) {
    query.category = category;
  }

  const products = await ProductModel.find(query)
    .sort({ isFeatured: -1, priority: -1, createdAt: -1 })
    .lean();

  return products.map((p) => transformProduct(p, userId));
};

/**
 * 특정 카테고리에서 우선순위(priority)가 1 이상인 추천 템플릿들을 조회합니다.
 */
export const getFeaturedTemplatesService = async (
  category: string,
  userId?: string,
): Promise<ProductJSON[]> => {
  await dbConnect();

  const products = await ProductModel.find({
    category,
    priority: { $gte: 1 },
    status: "active",
    deletedAt: null,
  })
    .sort({ priority: -1, createdAt: -1 })
    .lean();

  return products.map((p) => transformProduct(p, userId));
};

// 상품 업데이트
export const updateProductService = async (
  productId: string,
  data: Partial<Omit<ProductDto, "thumbnail">> & {
    thumbnail?: string;
    previewUrl?: string;
    isPremium?: boolean;
    featureIds?: string[];
  },
): Promise<ProductJSON | null> => {
  await dbConnect();

  const updateData = {
    ...data,
    featureIds:
      data.isPremium && data.featureIds
        ? data.featureIds.map((value) => new mongoose.Types.ObjectId(value))
        : [],
  };

  const updatedProduct = await ProductModel.findOneAndUpdate(
    { _id: productId, deletedAt: null },
    updateData,
    { new: true, lean: true },
  );

  return updatedProduct ? transformProduct(updatedProduct) : null;
};

// 상품 삭제
export const deleteProductService = async (
  productId: string,
): Promise<boolean> => {
  await dbConnect();

  const deletedProduct = await ProductModel.findOneAndUpdate(
    { _id: productId, deletedAt: null },
    { status: "deleted", deletedAt: new Date() },
    { new: true },
  );

  return !!deletedProduct;
};

// 상품 좋아요 토글
export const updateProductLikeService = async (
  productId: string,
  userId: string,
): Promise<boolean> => {
  await dbConnect();

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const product = await ProductModel.findOne({
    _id: productId,
    deletedAt: null,
  }).select("likes");

  if (!product) return false;

  const hasLiked = product.likes.some((id) => id.equals(userObjectId));

  const updated = await ProductModel.findOneAndUpdate(
    { _id: productId, deletedAt: null },
    hasLiked
      ? { $pull: { likes: userObjectId } }
      : { $addToSet: { likes: userObjectId } },
    { new: true },
  );

  return !!updated;
};
