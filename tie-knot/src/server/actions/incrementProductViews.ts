"use server";

import { incrementProductViewsService } from "@/server/services";
import { actionError } from "@/server/boundary";
import { APIResponse } from "@/shared/types";

export const incrementProductViews = async (
  productId: string,
): Promise<APIResponse<{ success: boolean }>> => {
  try {
    const success = await incrementProductViewsService(productId);
    return { success: true, data: { success } };
  } catch (e) {
    return actionError(e);
  }
};
