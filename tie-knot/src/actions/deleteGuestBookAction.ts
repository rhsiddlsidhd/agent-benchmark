"use server";

import { handleActionError } from "@/api/error";
import { APIResponse, success } from "@/api/response";
import { HTTPError } from "@/types/error";
import { comparePasswords } from "@/lib/bcrypt";
import { validateAndFlatten } from "@/lib/validation/validateAndFlatten";
import { GuestbookSchema } from "@/schemas/guestbook.schema";
import {
  getPrivateGuestbookService,
  deleteGuestbookService,
} from "@/services/guestbook.service"; // deleteGuestbookService 추가
import z from "zod";
import { revalidatePath } from "next/cache"; // revalidatePath 추가

export const deleteGuestbookAction = async (
  _prev: null,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  try {
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
      throw new HTTPError(
        "비밀번호 또는 게시글 ID 형식이 올바르지 않습니다.",
        400,
        parsed.error,
      );
    }

    const guestbook = await getPrivateGuestbookService(parsed.data.guestbookId);
    if (!guestbook) {
      throw new HTTPError("해당 게시글을 찾을 수 없습니다.", 404);
    }

    const isPasswordValid = await comparePasswords(
      parsed.data.password,
      guestbook.password,
    );
    if (!isPasswordValid) {
      throw new HTTPError("비밀번호가 일치하지 않습니다.", 401);
    }

    const deleteResult = await deleteGuestbookService(parsed.data.guestbookId);

    if (!deleteResult.acknowledged || deleteResult.deletedCount === 0) {
      throw new HTTPError("게시글 삭제에 실패했습니다.", 500);
    }

    revalidatePath(`/preview/${parsed.data.coupleInfoId}`);

    return success<{ message: string }>({
      message: "게시글이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    return handleActionError(error);
  }
};
