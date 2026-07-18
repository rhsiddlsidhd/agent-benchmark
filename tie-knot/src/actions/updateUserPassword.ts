"use server";

import { validateAndFlatten } from "@/lib/validation/validateAndFlatten";
import { PWConfirmSchema } from "@/schemas/pwConfirm.schema";
import { APIResponse, success } from "@/api/response";
import { changePassword } from "@/services/user.service";
import { handleActionError } from "@/api/error";
import { HTTPError } from "@/types/error";
import { decrypt } from "@/lib/token";
import { deleteCookie } from "@/lib/cookies/delete";

// 유저가 비밀번호를 기억하지 못할 때 로그인하지 않은 상태에서 이메일로 비밀번호 변경
export const updateUserPassword = async (
  prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  try {
    const data = {
      token: formData.get("token") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const parsed = validateAndFlatten(PWConfirmSchema, data);

    if (!parsed.success) {
      throw new HTTPError(
        "입력한 정보가 올바르지 않습니다. 다시 확인해주세요.",
        400,
        parsed.error,
      );
    }

    const { password, token } = parsed.data;
    const { payload } = await decrypt({ token, type: "ENTRY" });

    if (!payload.id) {
      throw new HTTPError(
        "유효하지 않거나 만료된 토큰입니다. 비밀번호 재설정을 다시 시도해주세요.",
        401,
      );
    }

    const userFound = await changePassword(payload.id, password);
    if (!userFound) {
      throw new HTTPError(
        "해당 계정을 찾을 수 없습니다. 이메일 주소를 확인해주세요.",
        404,
      );
    }
    await deleteCookie("userEmail");
    return success({ message: "비밀번호가 성공적으로 변경되었습니다." });
  } catch (error) {
    return handleActionError(error);
  }
};
