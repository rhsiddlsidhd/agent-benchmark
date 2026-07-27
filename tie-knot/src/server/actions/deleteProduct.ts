"use server";

import { APIResponse } from "@/shared/types";
import { requireAuth, deleteProductService } from "@/server/services";
import { handleActionError } from "@/server/actions/handleActionError";
import { routes } from "@/shared/constants";

import { revalidatePath } from "next/cache";

export const deleteProduct = async (
  productId: string,
): Promise<APIResponse<{ message: string }>> => {
  try {
    const { role } = await requireAuth();
    if (role !== "ADMIN") {
      return {
        success: false,
        error: { category: "FORBIDDEN", message: "관리자 권한이 필요합니다." },
      };
    }

    await deleteProductService(productId);

    revalidatePath(routes.admin.products.root);
    revalidatePath(routes.products.root);

    return {
      success: true,
      data: { message: "상품이 성공적으로 삭제되었습니다." },
    };
  } catch (e) {
    return handleActionError(e);
  }
};
