"use server";

import { APIResponse } from "@/shared/types";
import { HTTPError } from "@/shared/types";
import { Status } from "@/server/models";
import { requireAuth, updateProductService } from "@/server/services";

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
        error: { message: "관리자 권한이 필요합니다.", code: 403 },
      };
    }

    await updateProductService(productId, { status });

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);

    return {
      success: true,
      data: { message: "상품 상태가 변경되었습니다." },
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
