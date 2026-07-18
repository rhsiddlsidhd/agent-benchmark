"use server";

import { handleActionError } from "@/api/error";
import { APIResponse, success } from "@/api/response";
import { HTTPError } from "@/types/error";
import { uploadProductImage } from "@/lib/cloudinary";
import { getCookie } from "@/lib/cookies/get";
import { decrypt } from "@/lib/token";
import { validateAndFlatten } from "@/lib/validation/validateAndFlatten";

import { productSchema } from "@/schemas/product.schema";
import { updateProductService } from "@/services/product.service";
import { getUserById } from "@/services/user.service";
import { revalidatePath } from "next/cache";

export const updateProductAction = async (
  productId: string,
  prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  try {
    const cookie = await getCookie("token");

    if (!cookie?.value) {
      throw new HTTPError("로그인이 필요합니다.", 401);
    }

    const { payload } = await decrypt({ token: cookie.value, type: "REFRESH" });

    if (!payload.id) throw new HTTPError("유효하지 않은 토큰입니다.", 401);

    const user = await getUserById(payload.id);
    if (user.role !== "ADMIN") {
      throw new HTTPError("관리자 권한이 필요합니다.", 403);
    }

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
      throw new HTTPError("입력값을 확인해주세요", 400, parsed.error);
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

    return success({
      message: "상품이 성공적으로 수정되었습니다.",
    });
  } catch (e) {
    return handleActionError(e);
  }
};
