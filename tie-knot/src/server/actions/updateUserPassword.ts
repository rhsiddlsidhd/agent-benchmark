"use server";

import { validateAndFlatten } from "@/shared/utils";
import { PWConfirmSchema } from "@/shared/schemas";
import { APIResponse } from "@/shared/types";
import { changePassword } from "@/server/services";
import { handleActionError } from "@/server/actions/handleActionError";
import { decrypt } from "@/server/lib/jose";
import { deleteCookie } from "@/server/lib/cookies";

// 유저가 비밀번호를 기억하지 못할 때 로그인하지 않은 상태에서 이메일로 비밀번호 변경
export const updateUserPassword = async (
  prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  const data = {
    token: formData.get("token") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = validateAndFlatten(PWConfirmSchema, data);

  if (!parsed.success) {
    return {
      success: false,
      error: {
        category: "VALIDATION",
        message: "입력한 정보가 올바르지 않습니다. 다시 확인해주세요.",
        fieldErrors: parsed.error,
      },
    };
  }

  const { password, token } = parsed.data;

  try {
    const { payload } = await decrypt({ token, type: "ENTRY" });

    if (!payload.id) {
      return {
        success: false,
        error: {
          category: "UNAUTHENTICATED",
          message:
            "유효하지 않거나 만료된 토큰입니다. 비밀번호 재설정을 다시 시도해주세요.",
        },
      };
    }

    const userFound = await changePassword(payload.id, password);
    if (!userFound) {
      return {
        success: false,
        error: {
          category: "NOT_FOUND",
          message: "해당 계정을 찾을 수 없습니다. 이메일 주소를 확인해주세요.",
        },
      };
    }
    await deleteCookie("userEmail");
    return {
      success: true,
      data: { message: "비밀번호가 성공적으로 변경되었습니다." },
    };
  } catch (e) {
    return handleActionError(e);
  }
};
