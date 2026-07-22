"use server";
/**
 * Data - 네임 && 전화번호를 바탕으로
 * DB에서 아이디 가져오기
 */

import { APIResponse } from "@/types";

import { UserEmailSchema } from "@/schemas";

import { getUserEmail } from "@/services";
import { HTTPError } from "@/types";
import { validateAndFlatten } from "@/utils";

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
        message: "입력 값을 확인해주세요.",
        code: 400,
        fieldErrors: parsed.error,
      },
    };
  }
  const { name, phone } = parsed.data;

  try {
    const email = await getUserEmail({ name, phone });
    return { success: true, data: { email } };
  } catch (e) {
    if (e instanceof HTTPError) {
      return {
        success: false,
        error: { message: e.message, code: e.code, fieldErrors: e.fieldErrors },
      };
    }
    return {
      success: false,
      error: { message: "서버 오류가 발생했습니다.", code: 500 },
    };
  }
};
