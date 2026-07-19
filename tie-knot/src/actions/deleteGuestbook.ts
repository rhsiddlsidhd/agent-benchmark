"use server";

import { APIResponse } from "@/types";
import { comparePasswords } from "@/lib/bcrypt";
import { validateAndFlatten } from "@/utils";
import { GuestbookSchema } from "@/schemas/guestbook.schema";
import {
  getPrivateGuestbookService,
  deleteGuestbookService,
} from "@/services/guestbook.service";
import z from "zod";
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
        message: "비밀번호 또는 게시글 ID 형식이 올바르지 않습니다.",
        code: 400,
        fieldErrors: parsed.error,
      },
    };
  }

  try {
    const guestbook = await getPrivateGuestbookService(parsed.data.guestbookId);
    if (!guestbook) {
      return {
        success: false,
        error: { message: "해당 게시글을 찾을 수 없습니다.", code: 404 },
      };
    }

    const isPasswordValid = await comparePasswords(
      parsed.data.password,
      guestbook.password,
    );
    if (!isPasswordValid) {
      return {
        success: false,
        error: { message: "비밀번호가 일치하지 않습니다.", code: 401 },
      };
    }

    const deleteResult = await deleteGuestbookService(parsed.data.guestbookId);

    if (!deleteResult.acknowledged || deleteResult.deletedCount === 0) {
      return {
        success: false,
        error: { message: "게시글 삭제에 실패했습니다.", code: 500 },
      };
    }

    revalidatePath(`/preview/${parsed.data.coupleInfoId}`);

    return {
      success: true,
      data: { message: "게시글이 성공적으로 삭제되었습니다." },
    };
  } catch {
    return {
      success: false,
      error: { message: "서버 오류가 발생했습니다.", code: 500 },
    };
  }
};
