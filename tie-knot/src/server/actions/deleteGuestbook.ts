"use server";

import { APIResponse } from "@/shared/types";
import { comparePasswords } from "@/server/lib/bcrypt";
import { validateAndFlatten } from "@/shared/utils";
import { GuestbookSchema } from "@/shared/schemas";
import { getPrivateGuestbookService, deleteGuestbookService } from "@/server/services";
import { handleActionError } from "@/server/actions/handleActionError";
import { routes } from "@/shared/constants";
import * as z from "zod";
import { revalidatePath } from "next/cache";

export const deleteGuestbook = async (
  _prev: null,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  const data = {
    password: formData.get("password") as string,
    guestbookId: formData.get("guestbookId") as string,
    coupleInfoId: formData.get("coupleInfoId") as string,
    productId: formData.get("productId") as string,
  };
  const passwordSchema = GuestbookSchema.pick({ password: true }).extend({
    guestbookId: z.string().min(1, "게시글 ID가 필요합니다."),
    coupleInfoId: z.string().min(1, "부부 상세정보 ID가 필요합니다."),
    productId: z.string().min(1, "상품 ID가 필요합니다."),
  });
  const parsed = validateAndFlatten(passwordSchema, data);

  if (!parsed.success) {
    return {
      success: false,
      error: {
        category: "VALIDATION",
        message: "비밀번호 또는 게시글 ID 형식이 올바르지 않습니다.",
        fieldErrors: parsed.error,
      },
    };
  }

  try {
    const guestbook = await getPrivateGuestbookService(parsed.data.guestbookId);
    if (!guestbook) {
      return {
        success: false,
        error: { category: "NOT_FOUND", message: "해당 게시글을 찾을 수 없습니다." },
      };
    }

    const isPasswordValid = await comparePasswords(
      parsed.data.password,
      guestbook.password,
    );
    if (!isPasswordValid) {
      return {
        success: false,
        error: { category: "UNAUTHENTICATED", message: "비밀번호가 일치하지 않습니다." },
      };
    }

    const deleteResult = await deleteGuestbookService(parsed.data.guestbookId);

    if (!deleteResult.acknowledged || deleteResult.deletedCount === 0) {
      return {
        success: false,
        error: { category: "INTERNAL", message: "게시글 삭제에 실패했습니다." },
      };
    }

    revalidatePath(routes.preview.detail(parsed.data.coupleInfoId));

    return {
      success: true,
      data: { message: "게시글이 성공적으로 삭제되었습니다." },
    };
  } catch (e) {
    return handleActionError(e);
  }
};
