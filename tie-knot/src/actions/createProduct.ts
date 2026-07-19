"use server";

import { APIResponse } from "@/types";
import { HTTPError } from "@/types";
import { uploadProductImage } from "@/lib/cloudinary";
import { requireAuth } from "@/services/auth.service";
import { productSchema } from "@/schemas/product.schema";
import { createProductService } from "@/services/product.service";
import { revalidatePath } from "next/cache";
import { validateAndFlatten } from "@/utils";

export const createProduct = async (
  _prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  const thumbnailFile = formData.get("thumbnail") as File;
  const previewFile = formData.get("previewUrl") as File;

  const data = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    category: formData.get("category") as string,
    subCategory: formData.get("subCategory") as string,
    price: Number(formData.get("price")),
    isPremium: formData.get("isPremium") === "true",
    featureIds: formData.getAll("featureIds") as string[],
    isFeatured: formData.get("isFeatured") === "true",
    priority: Number(formData.get("priority")),
    discount: {
      discountType: formData.get("discount.discountType") as string,
      value: Number(formData.get("discount.value")),
    },
    thumbnail: thumbnailFile,
  };

  const parsed = validateAndFlatten(productSchema, data);

  if (!parsed.success) {
    return {
      success: false,
      error: { message: "입력값을 확인해주세요", code: 400, fieldErrors: parsed.error },
    };
  }

  try {
    const { role, userId } = await requireAuth();
    if (role !== "ADMIN") {
      return {
        success: false,
        error: { message: "관리자 권한이 필요합니다.", code: 403 },
      };
    }

    const thumbnailUrl = await uploadProductImage(thumbnailFile, "thumbnail");

    let previewUrl: string | undefined;
    if (previewFile && previewFile.size > 0) {
      previewUrl = await uploadProductImage(previewFile, "preview");
    }

    const product = await createProductService({
      ...parsed.data,
      authorId: userId,
      thumbnail: thumbnailUrl,
      previewUrl,
    });

    if (!product) {
      return {
        success: false,
        error: { message: "상품 등록에 실패하였습니다.", code: 500 },
      };
    }

    revalidatePath("/admin/products");
    revalidatePath("/products");

    return {
      success: true,
      data: { message: "상품이 성공적으로 등록되었습니다." },
    };
  } catch (e) {
    if (e instanceof HTTPError) {
      return { success: false, error: { message: e.message, code: e.code } };
    }
    return {
      success: false,
      error: { message: "서버 오류가 발생했습니다.", code: 500 },
    };
  }
};
