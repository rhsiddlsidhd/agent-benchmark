"use server";
/**
 * Data - 네임 && 전화번호를 바탕으로
 * DB에서 아이디 가져오기
 */

import { APIResponse } from "@/shared/types";

import { UserEmailSchema } from "@/shared/schemas";

import { getUserEmail } from "@/server/services";
import { actionError } from "@/server/boundary";
import { validateAndFlatten } from "@/shared/utils";

export const findUserEmail = async (
  _prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ email: string }>> => {
  const data = {
    name: formData.get("name"),
    phone: formData.get("phone"),
  };

  const parsed = validateAndFlatten(UserEmailSchema, data);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        category: "VALIDATION",
        message: "입력 값을 확인해주세요.",
        fieldErrors: parsed.error,
      },
    };
  }
  const { name, phone } = parsed.data;

  try {
    const email = await getUserEmail({ name, phone });
    return { success: true, data: { email } };
  } catch (e) {
    return actionError(e);
  }
};
