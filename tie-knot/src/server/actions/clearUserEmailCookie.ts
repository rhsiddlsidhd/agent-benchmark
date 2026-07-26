"use server";

import { deleteCookie } from "@/server/lib/cookies";

export const clearUserEmailCookie = async (): Promise<void> => {
  await deleteCookie("userEmail");
};
