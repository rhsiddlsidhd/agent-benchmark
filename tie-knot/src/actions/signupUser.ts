"use server";

import { APIResponse } from "@/types";

import { hashPassword } from "@/lib/bcrypt";

import { validateAndFlatten } from "@/utils";
import { RegisterSchema } from "@/schemas";
import { checkEmailDuplicate, createUser } from "@/services";
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
        message: "입력값을 확인해주세요",
        code: 400,
        fieldErrors: parsed.error,
      },
    };
  }

  const { email, name, phone, password } = parsed.data;

  const isEmail = await checkEmailDuplicate(email);

  if (isEmail) {
    return {
      success: false,
      error: { message: "이미 존재하는 이메일 입니다.", code: 409 },
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
  } catch {
    return {
      success: false,
      error: { message: "서버 오류가 발생했습니다.", code: 500 },
    };
  }
}
