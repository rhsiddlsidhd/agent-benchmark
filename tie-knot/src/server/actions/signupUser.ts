"use server";

import { APIResponse } from "@/shared/types";

import { hashPassword } from "@/server/lib/bcrypt";

import { validateAndFlatten } from "@/shared/utils";
import { RegisterSchema } from "@/shared/schemas";
import { checkEmailDuplicate, createUser } from "@/server/services";
import { handleActionError } from "@/server/actions/handleActionError";
export async function signupUser(
  prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> {
  const data = {
    email: formData.get("email") as string,
    name: formData.get("name") as string,
    phone: formData.get("phone") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = validateAndFlatten(RegisterSchema, data);

  if (!parsed.success) {
    return {
      success: false,
      error: {
        category: "VALIDATION",
        message: "입력값을 확인해주세요",
        fieldErrors: parsed.error,
      },
    };
  }

  const { email, name, phone, password } = parsed.data;

  const isEmail = await checkEmailDuplicate(email);

  if (isEmail) {
    return {
      success: false,
      // 409 Conflict는 taxonomy(src/CLAUDE.md)에 없음 — 입력값(이메일) 자체의 문제라 VALIDATION으로 분류(400)
      error: { category: "VALIDATION", message: "이미 존재하는 이메일 입니다." },
    };
  }

  try {
    const hashedPassword = await hashPassword(password);

    await createUser({
      password: hashedPassword,
      email,
      name,
      phone,
    });

    return {
      success: true,
      data: { message: `${data.email}님 회원가입을 축하드립니다.` },
    };
  } catch (e) {
    return handleActionError(e);
  }
}
