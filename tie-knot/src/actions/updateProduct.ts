"use server";

import { APIResponse } from "@/types";
import { HTTPError } from "@/types";
import { uploadProductImage } from "@/lib/cloudinary";
import { requireAuth, updateProductService } from "@/services";
import { validateAndFlatten } from "@/utils";

import { productSchema } from "@/schemas";

import { revalidatePath } from "next/cache";

export const updateProduct = async (
  productId: string,
  prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  const thumbnailFile = formData.get("thumbnail") as File;
  const previewFile = formData.get("previewUrl") as File;

  const data = {
    title: formData.get("title"),
    category: formData.get("category"),
    subCategory: formData.get("subCategory"),
    status: formData.get("status"),
    description: formData.get("description"),
    isFeatured: formData.get("isFeatured") === "true",
    price: Number(formData.get("price")),
    isPremium: formData.get("isPremium") === "true",
    featureIds: formData.getAll("featureIds") as string[],
    priority: Number(formData.get("priority")),
  };

  const parsed = validateAndFlatten(productSchema, data);

  if (!parsed.success) {
    return {
      success: false,
      error: { message: "입력값을 확인해주세요", code: 400, fieldErrors: parsed.error },
    };
  }

  try {
    const { role } = await requireAuth();
    if (role !== "ADMIN") {
      return {
        success: false,
        error: { message: "관리자 권한이 필요합니다.", code: 403 },
      };
    }

    let thumbnailUrl = formData.get("currentThumbnail") as string;
    if (thumbnailFile && thumbnailFile.size > 0) {
      thumbnailUrl = await uploadProductImage(thumbnailFile, "thumbnail");
    }

    let previewUrl: string | undefined = formData.get(
      "currentPreviewUrl",
    ) as string;
    if (previewFile && previewFile.size > 0) {
      previewUrl = await uploadProductImage(previewFile, "preview");
    }

    await updateProductService(productId, {
      ...parsed.data,
      thumbnail: thumbnailUrl,
      previewUrl,
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);

    return {
      success: true,
      data: { message: "상품이 성공적으로 수정되었습니다." },
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
