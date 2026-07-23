"use server";

import { APIResponse } from "@/shared/types";
import { HTTPError } from "@/shared/types";
import { requireAuth, deleteProductService } from "@/server/services";

import { revalidatePath } from "next/cache";

export const deleteProduct = async (
  productId: string,
): Promise<APIResponse<{ message: string }>> => {
  try {
    const { role } = await requireAuth();
    if (role !== "ADMIN") {
      return {
        success: false,
        error: { message: "관리자 권한이 필요합니다.", code: 403 },
      };
    }

    await deleteProductService(productId);

    revalidatePath("/admin/products");
    revalidatePath("/products");

    return {
      success: true,
      data: { message: "상품이 성공적으로 삭제되었습니다." },
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
