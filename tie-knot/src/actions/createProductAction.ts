"use server";

import { handleActionError } from "@/api/error";
import { APIResponse, success } from "@/api/response";
import { HTTPError } from "@/types/error";
import { uploadProductImage } from "@/lib/cloudinary";
import { getCookie } from "@/lib/cookies/get";
import { decrypt } from "@/lib/token";
import { productSchema } from "@/schemas/product.schema";
import { createProductService } from "@/services/product.service";
import { getUserById } from "@/services/user.service";
import { revalidatePath } from "next/cache";
import { validateAndFlatten } from "@/lib/validation/validateAndFlatten";

export const createProductAction = async (
  _prev: unknown,
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
      throw new HTTPError("입력값을 확인해주세요", 400, parsed.error);
    }

    const thumbnailUrl = await uploadProductImage(thumbnailFile, "thumbnail");

    let previewUrl: string | undefined;
    if (previewFile && previewFile.size > 0) {
      previewUrl = await uploadProductImage(previewFile, "preview");
    }

    const product = await createProductService({
      ...parsed.data,
      authorId: payload.id,
      thumbnail: thumbnailUrl,
      previewUrl,
    });

    if (!product) throw new HTTPError("상품 등록에 실패하였습니다.", 500);

    revalidatePath("/admin/products");
    revalidatePath("/products");

    return success({
      message: "상품이 성공적으로 등록되었습니다.",
    });
  } catch (e) {
    return handleActionError(e);
  }
};
