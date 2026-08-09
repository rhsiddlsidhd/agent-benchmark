"use server";

import { APIResponse } from "@/shared/types";
import { uploadProductImage } from "@/server/lib/cloudinary";
import { requireAuth, createProductService } from "@/server/services";
import { actionError } from "@/server/boundary";
import { productSchema } from "@/shared/schemas";
import { routes } from "@/shared/constants";

import { revalidatePath } from "next/cache";
import { validateAndFlatten } from "@/shared/utils";

// 빈 문자열/null이면 undefined를 넘겨 zod .default()가 동작하게 한다 —
// Number(null)===0 / Number("")===0으로 파싱되면 min(1) 검증에 걸린다.
const parseOptionalNumber = (raw: FormDataEntryValue | null): number | undefined =>
  raw ? Number(raw) : undefined;

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
    theme: (formData.get("theme") as string) || undefined,
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
    images: {
      // create 흐름에선 currentImages가 항상 빈 배열이다(유지할 기존 이미지가 없음).
      existing: formData.getAll("currentImages") as string[],
      newFiles: (formData.getAll("images") as File[]).filter((f) => f.size > 0),
    },
    minQuantity: parseOptionalNumber(formData.get("minQuantity")),
    maxQuantity: parseOptionalNumber(formData.get("maxQuantity")),
  };

  const parsed = validateAndFlatten(productSchema, data);

  if (!parsed.success) {
    return {
      success: false,
      error: { category: "VALIDATION", message: "입력값을 확인해주세요", fieldErrors: parsed.error },
    };
  }

  try {
    const { role, userId } = await requireAuth();
    if (role !== "ADMIN") {
      return {
        success: false,
        error: { category: "FORBIDDEN", message: "관리자 권한이 필요합니다." },
      };
    }

    const thumbnailUrl = await uploadProductImage(thumbnailFile, "thumbnail");

    let previewUrl: string | undefined;
    if (previewFile && previewFile.size > 0) {
      previewUrl = await uploadProductImage(previewFile, "preview");
    }

    const uploadedImageUrls = (
      await Promise.all(
        parsed.data.images.newFiles.map((file) => uploadProductImage(file, "images")),
      )
    ).filter((url): url is string => Boolean(url));
    const images = [...parsed.data.images.existing, ...uploadedImageUrls];

    await createProductService({
      ...parsed.data,
      images,
      authorId: userId,
      thumbnail: thumbnailUrl,
      previewUrl,
    });

    revalidatePath(routes.admin.products.root);
    revalidatePath(routes.products.root);

    return {
      success: true,
      data: { message: "상품이 성공적으로 등록되었습니다." },
    };
  } catch (e) {
    return actionError(e);
  }
};
