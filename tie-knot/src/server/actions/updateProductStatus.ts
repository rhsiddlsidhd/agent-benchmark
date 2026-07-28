"use server";

import { APIResponse } from "@/shared/types";
import { Status } from "@/server/models";
import { requireAuth, updateProductService } from "@/server/services";
import { handleActionError } from "@/server/actions/handleActionError";
import { routes } from "@/shared/constants";

import { revalidatePath } from "next/cache";

export const updateProductStatus = async (
  productId: string,
  status: Status,
): Promise<APIResponse<{ message: string }>> => {
  try {
    const { role } = await requireAuth();
    if (role !== "ADMIN") {
      return {
        success: false,
        error: { category: "FORBIDDEN", message: "관리자 권한이 필요합니다." },
      };
    }

    const updated = await updateProductService(productId, { status });

    revalidatePath(routes.admin.products.root);
    revalidatePath(routes.products.root);
    if (updated) {
      revalidatePath(routes.products.detail(updated.category, productId));
    }

    return {
      success: true,
      data: { message: "상품 상태가 변경되었습니다." },
    };
  } catch (e) {
    return handleActionError(e);
  }
};
