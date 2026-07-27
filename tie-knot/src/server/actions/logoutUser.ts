"use server";

import { logoutService } from "@/server/services";

export const logoutUser = async (): Promise<void> => {
  await logoutService();
};
