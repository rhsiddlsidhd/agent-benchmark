"use server";

import { handleActionError } from "@/api/error";
import { APIResponse, success } from "@/api/response";
import { HTTPError } from "@/types/error";
import { hashPassword } from "@/lib/bcrypt";

import { GuestbookSchema } from "@/schemas/guestbook.schema";
import { createGuestbookService } from "@/services/guestbook.service";
import { validateAndFlatten } from "@/lib/validation/validateAndFlatten";
import { revalidatePath } from "next/cache";

export const createGuestbook = async (
  _prev: null,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  try {
    const data = {
      coupleInfoId: formData.get("coupleInfoId") as string,
      author: formData.get("author") as string,
      password: formData.get("password") as string,
      message: formData.get("message") as string,
      isPrivate: formData.get("isPrivate") === "true",
    };

    const parsed = validateAndFlatten(GuestbookSchema, data);
    if (!parsed.success) {
      throw new HTTPError("입력값을 확인해주세요", 400, parsed.error);
    }

    const hashedPassword = await hashPassword(parsed.data.password);
    await createGuestbookService({
      data: { ...parsed.data, password: hashedPassword },
    });

    revalidatePath(`/preview/${parsed.data.coupleInfoId}`);

    return success<{ message: string }>({
      message: "방명록 작성이 완료되었습니다.",
    });
  } catch (error) {
    return handleActionError(error);
  }
};
