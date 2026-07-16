"use server";

import { handleActionError } from "@/api/error";
import { APIResponse, success } from "@/api/response";
import { HTTPError } from "@/types/error";
import { getCookie } from "@/lib/cookies/get";
import { decrypt } from "@/lib/token";
import { deleteProductService } from "@/services/product.service";
import { getUserById } from "@/services/user.service";
import { revalidatePath } from "next/cache";

export const deleteProductAction = async (
  productId: string,
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

    await deleteProductService(productId);

    revalidatePath("/admin/products");
    revalidatePath("/products");

    return success({
      message: "상품이 성공적으로 삭제되었습니다.",
    });
  } catch (e) {
    return handleActionError(e);
  }
};
