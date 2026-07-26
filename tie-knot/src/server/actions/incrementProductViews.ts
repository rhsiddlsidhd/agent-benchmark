"use server";

import { incrementProductViewsService } from "@/server/services";

export const incrementProductViews = async (
  productId: string,
): Promise<{ success: boolean }> => {
  const success = await incrementProductViewsService(productId);
  return { success };
};
