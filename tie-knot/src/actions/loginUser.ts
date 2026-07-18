"use server";

import { APIResponse, success } from "@/api/response";

import { validateAndFlatten } from "@/lib/validation/validateAndFlatten";
import { LoginSchema } from "@/schemas/login.schema";
import { encrypt } from "@/lib/token";
import { setCookie } from "@/lib/cookies/set";
import { getUser } from "@/services/auth.service";

import { handleActionError } from "@/api/error";
import { HTTPError } from "@/types/error";
import { UserRole } from "@/models/user.model";
import { comparePasswords } from "@/lib/bcrypt";

export const loginUser = async (
  _prev: null,
  formData: FormData,
): Promise<APIResponse<{ token: string; role: UserRole; email: string; userId: string }>> => {
  try {
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      remember: formData.get("remember") ? true : false,
    };

    if (!data.email || !data.password) {
      throw new HTTPError("아이디와 비밀번호를 확인해주세요.", 400);
    }

    const parsed = validateAndFlatten(LoginSchema, data);

    if (!parsed.success) {
      throw new HTTPError(
        "입력하신 정보의 형식이 올바르지 않습니다.",
        400,
        parsed.error,
      );
    }

    const { email, password, remember } = parsed.data;

    // 이메일를 바탕으로 사용자 조회
    const user = await getUser({ email });

    if (!user)
      throw new HTTPError("이메일 또는 비밀번호가 일치하지 않습니다.", 401);

    const isPasswordValid = await comparePasswords(password, user.password);

    if (!isPasswordValid) {
      throw new HTTPError("이메일 또는 비밀번호가 일치하지 않습니다.", 401);
    }

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

    return success<{ token: string; role: UserRole; email: string; userId: string }>({
      token: accessJWT,
      role: user.role,
      email: user.email,
      userId: user._id.toString(),
    });
  } catch (e) {
    return handleActionError(e);
  }
};
