"use server";

import { APIResponse, AppError } from "@/shared/types";
import { encrypt } from "@/server/lib/jose";
import { setCookie, deleteCookie } from "@/server/lib/cookies";
import { handleActionError } from "@/server/actions/handleActionError";

export const issueEntryToken = async (
  nextPath: string,
): Promise<APIResponse<{ path: string }>> => {
  try {
    if (!nextPath) {
      throw new AppError("UNAUTHENTICATED", "잘못된 요청입니다.");
    }

    const entryToken = await encrypt({ type: "ENTRY" });
    await deleteCookie("token");
    await setCookie({ name: "entry", value: entryToken, maxAge: 600 });

    return { success: true, data: { path: nextPath } };
  } catch (e) {
    return handleActionError(e);
  }
};
