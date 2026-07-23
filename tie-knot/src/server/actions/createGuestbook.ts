"use server";

import { APIResponse } from "@/shared/types";
import { hashPassword } from "@/server/lib/bcrypt";

import { GuestbookSchema } from "@/shared/schemas";
import { createGuestbookService } from "@/server/services";
import { validateAndFlatten } from "@/shared/utils";
import { revalidatePath } from "next/cache";

export const createGuestbook = async (
  _prev: null,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  const data = {
    coupleInfoId: formData.get("coupleInfoId") as string,
    author: formData.get("author") as string,
    password: formData.get("password") as string,
    message: formData.get("message") as string,
    isPrivate: formData.get("isPrivate") === "true",
  };

  const parsed = validateAndFlatten(GuestbookSchema, data);
  if (!parsed.success) {
    return {
      success: false,
      error: { message: "입력값을 확인해주세요", code: 400, fieldErrors: parsed.error },
    };
  }

  try {
    const hashedPassword = await hashPassword(parsed.data.password);
    await createGuestbookService({
      data: { ...parsed.data, password: hashedPassword },
    });

    revalidatePath(`/preview/${parsed.data.coupleInfoId}`);

    return {
      success: true,
      data: { message: "방명록 작성이 완료되었습니다." },
    };
  } catch {
    return {
      success: false,
      error: { message: "서버 오류가 발생했습니다.", code: 500 },
    };
  }
};
