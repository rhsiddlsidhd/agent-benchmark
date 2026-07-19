"use server";

import { APIResponse } from "@/types";

import { validateAndFlatten } from "@/utils";
import { LoginSchema } from "@/schemas/login.schema";
import { encrypt } from "@/lib/jose";
import { setCookie } from "@/lib/cookies";
import { getUser } from "@/services/auth.service";

import { UserRole } from "@/models/user.model";
import { comparePasswords } from "@/lib/bcrypt";

export const loginUser = async (
  _prev: null,
  formData: FormData,
): Promise<APIResponse<{ role: UserRole; email: string; userId: string }>> => {
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    remember: formData.get("remember") ? true : false,
  };

  if (!data.email || !data.password) {
    return {
      success: false,
      error: { message: "아이디와 비밀번호를 확인해주세요.", code: 400 },
    };
  }

  const parsed = validateAndFlatten(LoginSchema, data);

  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: "입력하신 정보의 형식이 올바르지 않습니다.",
        code: 400,
        fieldErrors: parsed.error,
      },
    };
  }

  const { email, password, remember } = parsed.data;

  // 이메일를 바탕으로 사용자 조회
  const user = await getUser({ email });

  if (!user) {
    return {
      success: false,
      error: { message: "이메일 또는 비밀번호가 일치하지 않습니다.", code: 401 },
    };
  }

  const isPasswordValid = await comparePasswords(password, user.password);

  if (!isPasswordValid) {
    return {
      success: false,
      error: { message: "이메일 또는 비밀번호가 일치하지 않습니다.", code: 401 },
    };
  }

  try {
    const refreshJWT = await encrypt({
      id: user._id.toString(),
      role: user.role,
      type: "REFRESH",
    });

    await setCookie({ name: "token", value: refreshJWT, remember });

    const accessJWT = await encrypt({
      id: user._id.toString(),
      role: user.role,
      type: "ACCESS",
    });

    await setCookie({ name: "access", value: accessJWT });

    return {
      success: true,
      data: { role: user.role, email: user.email, userId: user._id.toString() },
    };
  } catch {
    return {
      success: false,
      error: { message: "서버 오류가 발생했습니다.", code: 500 },
    };
  }
};
