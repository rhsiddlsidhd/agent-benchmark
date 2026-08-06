import { ProductModel, InvitationProductModel, ProductJSON, ProductDB, IProduct } from "@/server/models";
import { ProductDto } from "@/shared/schemas";
import { dbConnect } from "@/server/lib/mongodb";
import { calculatePrice, escapeRegExp, findProductCategoriesByTerm, findSubCategoriesByTerm } from "@/shared/utils";
import { AppError } from "@/shared/types";
import { InvitationTheme, POPULAR_PRODUCTS_LIMIT } from "@/shared/constants";
import mongoose, { Model, Types } from "mongoose";

// Product 타입을 export (다른 파일에서 사용)
export type Product = ProductJSON;

type LeanProduct = ProductDB & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  previewUrl?: string;
  theme?: InvitationTheme;
  __v?: number;
};

// previewUrl은 invitation 카테고리 discriminator 전용 필드라 base ProductModel로
// 쓰면 strict 모드에 의해 조용히 버려진다 — 생성/수정 시 카테고리별로 모델을 골라야 한다.
// Model<IProduct>로 통일해서 리턴한다 — discriminator Model과 base Model의 union을
// 그대로 리턴하면 오버로드 시그니처가 갈라져 findOneAndUpdate 호출이 막힌다.
const getWritableProductModel = (category: string): Model<IProduct> =>
  category === "invitation" ? (InvitationProductModel as Model<IProduct>) : ProductModel;

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
    deletedAt: deletedAt ? deletedAt.toISOString() : null,
    // .lean()이라 mongoose default가 레거시 문서엔 안 채워진다 — 여기서 정규화한다.
    // maxQuantity 폴백은 0(무제한)이 아니라 1(고정) — 레거시 문서는 전부 invitation이고
    // invitation의 정답은 (1,1)이다. 0으로 폴백하면 레거시 상세가 무제한 stepper로
    // 렌더돼 REQ-4 회귀를 일으킨다(01_db_schema.md §7-3).
    images: rest.images ?? [],
    minQuantity: rest.minQuantity ?? 1,
    maxQuantity: rest.maxQuantity ?? 1,
  };
};

// REQ-5(주문 수량 검증) 전용 — 클라이언트가 보낸 minQuantity/maxQuantity를 신뢰하지 않고
// order.service가 이 함수로 DB를 재조회한다. .lean() + select라 여기도 default가
// 안 채워지므로 transformProduct와 동일한 레거시 폴백(?? 1 / ?? 1)을 적용한다.
export const getProductQuantityBoundsService = async (
  productId: string,
): Promise<{ minQuantity: number; maxQuantity: number } | null> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(productId)) {
    return null;
  }

  const product = await ProductModel.findOne({ _id: productId, deletedAt: null })
    .select("minQuantity maxQuantity")
    .lean();

  if (!product) return null;

  return {
    minQuantity: product.minQuantity ?? 1,
    maxQuantity: product.maxQuantity ?? 1,
  };
};

// 상품생성
export const createProductService = async (
  data: Omit<ProductDto, "thumbnail" | "images"> & {
    thumbnail: string;
    images: string[];
    authorId: string;
    previewUrl?: string;
  },
): Promise<boolean> => {
  await dbConnect();

  const WritableProductModel = getWritableProductModel(data.category);

  const newProduct = await new WritableProductModel({
    ...data,
    status: data.status || "active",
    featureIds:
      data.isPremium && data.featureIds
        ? data.featureIds.map((value) => new mongoose.Types.ObjectId(value))
        : [],
  })
    .save()
    .catch((err) => {
      throw new AppError(
        "INTERNAL",
        err instanceof Error ? err.message : "상품 등록에 실패했습니다.",
      );
    });

  return !!newProduct;
};

// 단일 상품 조회
export const getProductService = async (
  productId: string,
  userId?: string,
): Promise<ProductJSON | null> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(productId)) {
    return null;
  }

  const product = await ProductModel.findOne({
    _id: productId,
    deletedAt: null,
  }).lean();

  return product ? transformProduct(product, userId) : null;
};

// 상품 상세페이지 방문 시 조회수 증가 — getProductService에는 안 넣는다.
// payment.service.ts(결제 검증용 조회)와 (main)/page.tsx(고정 미리보기)도
// getProductService를 호출하는데 그 두 호출까지 조회수로 잡히면 안 되기 때문.
export const incrementProductViewsService = async (
  productId: string,
): Promise<boolean> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(productId)) {
    return false;
  }

  const updated = await ProductModel.findOneAndUpdate(
    { _id: productId, deletedAt: null },
    { $inc: { views: 1 } },
    { new: true, runValidators: true },
  ).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "조회수 갱신에 실패했습니다.",
    );
  });

  return !!updated;
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

// 상품 검색 — title 부분일치(대소문자 무시) OR 카테고리/서브카테고리 라벨 부분일치(역조회 후 $in).
// q가 없거나 공백뿐이면 DB를 치지 않고 즉시 빈 배열을 리턴한다 — 빈 $or는 MongoDB가 reject한다.
export const searchProductsService = async (
  q?: string,
  userId?: string,
): Promise<ProductJSON[]> => {
  const term = q?.trim();

  if (!term) return [];

  const or: Record<string, unknown>[] = [
    { title: { $regex: escapeRegExp(term), $options: "i" } },
  ];

  const categoryKeys = findProductCategoriesByTerm(term);
  if (categoryKeys.length > 0) {
    or.push({ category: { $in: categoryKeys } });
  }

  const subCategoryKeys = findSubCategoriesByTerm(term);
  if (subCategoryKeys.length > 0) {
    or.push({ subCategory: { $in: subCategoryKeys } });
  }

  await dbConnect();

  const products = await ProductModel.find({ deletedAt: null, $or: or })
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

// Home 인기 상품 섹션 — 좋아요 수(likes.length) 내림차순 Top N 조회.
// 배열 길이 정렬은 find().sort()로 불가능해 aggregation을 쓴다(01_db_schema.md §2-1).
export const getPopularProductsService = async (
  limit: number = POPULAR_PRODUCTS_LIMIT,
  userId?: string,
): Promise<ProductJSON[]> => {
  await dbConnect();

  // $limit은 0 이하를 받으면 빈 배열이 아니라 MongoServerError를 던진다 — 서비스가 방어한다.
  const take = Math.min(Math.max(Math.trunc(limit), 1), 50);

  // 파이프라인은 함수 안에서 매번 새 배열 리터럴로 만든다(모듈 상수로 빼지 않는다) —
  // mongoose가 discriminator 모델 aggregate 시 첫 $match를 직접 mutate하므로,
  // 상수로 빼면 discriminator 호출 한 번에 이후 모든 호출이 오염된다.
  const products = await ProductModel.aggregate<LeanProduct>([
    { $match: { deletedAt: null, "likes.0": { $exists: true } } },
    // $ifNull은 방어적 중복이지만 유지한다 — $size는 인자가 missing이면 null이 아니라 에러(Location17124)를 던진다.
    { $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
    { $sort: { likesCount: -1, isFeatured: -1, priority: -1, createdAt: -1, _id: -1 } },
    { $limit: take },
    { $unset: "likesCount" },
  ]).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "인기 상품 조회에 실패했습니다.",
    );
  });

  return products.map((p) => transformProduct(p, userId));
};

// 상품 업데이트
export const updateProductService = async (
  productId: string,
  data: Partial<Omit<ProductDto, "thumbnail" | "images">> & {
    thumbnail?: string;
    images?: string[];
    previewUrl?: string;
    isPremium?: boolean;
    featureIds?: string[];
  },
): Promise<ProductJSON | null> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(productId)) {
    return null;
  }

  const updateData = {
    ...data,
    featureIds:
      data.isPremium && data.featureIds
        ? data.featureIds.map((value) => new mongoose.Types.ObjectId(value))
        : [],
  };

  const WritableProductModel = data.category
    ? getWritableProductModel(data.category)
    : ProductModel;

  const updatedProduct = await WritableProductModel.findOneAndUpdate(
    { _id: productId, deletedAt: null },
    updateData,
    { new: true, lean: true, runValidators: true },
  ).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "상품 수정에 실패했습니다.",
    );
  });

  return updatedProduct ? transformProduct(updatedProduct) : null;
};

// 상품 삭제
export const deleteProductService = async (
  productId: string,
): Promise<boolean> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(productId)) {
    return false;
  }

  const deletedProduct = await ProductModel.findOneAndUpdate(
    { _id: productId, deletedAt: null },
    { status: "deleted", deletedAt: new Date() },
    { new: true, runValidators: true },
  ).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "상품 삭제에 실패했습니다.",
    );
  });

  return !!deletedProduct;
};

// 상품 좋아요 토글
export const updateProductLikeService = async (
  productId: string,
  userId: string,
): Promise<boolean> => {
  await dbConnect();

  if (!mongoose.isObjectIdOrHexString(productId)) {
    return false;
  }

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
    { new: true, runValidators: true },
  ).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "좋아요 갱신에 실패했습니다.",
    );
  });

  return !!updated;
};
