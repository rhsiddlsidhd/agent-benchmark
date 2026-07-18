"use server";
/**
 * Data - 네임 && 전화번호를 바탕으로
 * DB에서 아이디 가져오기
 */

import { APIResponse, success } from "@/api/response";

import { UserEmailSchema } from "@/schemas/userEmail.schema";

import { getUserEmail } from "@/services/user.service";
import { handleActionError } from "@/api/error";
import { HTTPError } from "@/types/error";
import { validateAndFlatten } from "@/lib/validation/validateAndFlatten";

export const findUserEmail = async (
  _prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ email: string }>> => {
  try {
    const data = {
      name: formData.get("name"),
      phone: formData.get("phone"),
    };

    const parsed = validateAndFlatten(UserEmailSchema, data);
    if (!parsed.success) {
      throw new HTTPError("입력 값을 확인해주세요.", 400, parsed.error);
    }
    const { name, phone } = parsed.data;

    const email = await getUserEmail({ name, phone });

    return success({ email });
  } catch (e) {
    return handleActionError(e);
  }
};
