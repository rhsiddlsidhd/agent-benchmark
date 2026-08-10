"use server";

import { APIResponse } from "@/shared/types";
import { deleteProductAsset, uploadProductImage } from "@/server/lib/cloudinary";
import { requireAuth, updateProductService } from "@/server/services";
import { actionError } from "@/server/boundary";
import { validateAndFlatten } from "@/shared/utils";

import { productSchema } from "@/shared/schemas";
import { routes } from "@/shared/constants";
import { AppError } from "@/shared/types";

import { revalidatePath } from "next/cache";

// 빈 문자열/null이면 undefined를 넘겨 zod .default()가 동작하게 한다 —
// Number(null)===0 / Number("")===0으로 파싱되면 min(1) 검증에 걸린다.
const parseOptionalNumber = (raw: FormDataEntryValue | null): number | undefined =>
  raw ? Number(raw) : undefined;

export const updateProduct = async (
  productId: string,
  prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  const uploadedPublicIds: string[] = [];
  const recordUpload = ({ publicId }: { publicId: string }) => uploadedPublicIds.push(publicId);
  const thumbnailFile = formData.get("thumbnail") as File;
  const previewFile = formData.get("previewUrl") as File;

  const data = {
    title: formData.get("title"),
    category: formData.get("category"),
    subCategory: formData.get("subCategory"),
    theme: (formData.get("theme") as string) || undefined,
    status: formData.get("status"),
    description: formData.get("description"),
    isFeatured: formData.get("isFeatured") === "true",
    price: Number(formData.get("price")),
    isPremium: formData.get("isPremium") === "true",
    featureIds: formData.getAll("featureIds") as string[],
    priority: Number(formData.get("priority")),
    thumbnail:
      thumbnailFile && thumbnailFile.size > 0
        ? thumbnailFile
        : (formData.get("currentThumbnail") as string),
    images: {
      // 유지할 기존 URL — 폼이 hidden input으로 반복 전송한다.
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
    const { role } = await requireAuth();
    if (role !== "ADMIN") {
      return {
        success: false,
        error: { category: "FORBIDDEN", message: "관리자 권한이 필요합니다." },
      };
    }

    let thumbnailUrl = formData.get("currentThumbnail") as string;
    if (thumbnailFile && thumbnailFile.size > 0) {
      thumbnailUrl = await uploadProductImage(thumbnailFile, "thumbnail", recordUpload);
    }

    let previewUrl: string | undefined = formData.get(
      "currentPreviewUrl",
    ) as string;
    if (previewFile && previewFile.size > 0) {
      previewUrl = await uploadProductImage(previewFile, "preview", recordUpload);
    }

    const uploadedImageUrls = (
      await Promise.all(
        parsed.data.images.newFiles.map((file) => uploadProductImage(file, "images", recordUpload)),
      )
    ).filter((url): url is string => Boolean(url));
    const images = [...parsed.data.images.existing, ...uploadedImageUrls];

    const updated = await updateProductService(productId, {
      ...parsed.data,
      images,
      thumbnail: thumbnailUrl,
      previewUrl,
    });

    // REQ-7: discriminatorKey가 "category"라 category를 바꿔 요청하면 mongoose가
    // 바뀐 category 기준 모델로 원래 문서를 찾다가 매칭 실패 → null을 리턴한다.
    // 검사 없이 넘어가면 실패인데 success:true가 나가는 무증상 실패가 된다.
    if (!updated) {
      throw new AppError("NOT_FOUND", "상품을 찾을 수 없습니다.");
    }

    revalidatePath(routes.admin.products.root);
    revalidatePath(routes.products.root);
    revalidatePath(routes.products.detail(parsed.data.category, productId));

    return {
      success: true,
      data: { message: "상품이 성공적으로 수정되었습니다." },
    };
  } catch (e) {
    await Promise.allSettled(uploadedPublicIds.map((publicId) => deleteProductAsset(publicId)));
    return actionError(e);
  }
};
