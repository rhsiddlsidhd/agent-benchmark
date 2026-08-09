"use server";

import { deleteCookie } from "@/server/lib/cookies";
import { actionError } from "@/server/boundary";
import { APIResponse } from "@/shared/types";

export const clearUserEmailCookie = async (): Promise<APIResponse<null>> => {
  try {
    await deleteCookie("userEmail");
    return { success: true, data: null };
  } catch (e) {
    return actionError(e);
  }
};
