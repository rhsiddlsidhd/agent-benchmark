"use server";

import { handleActionError } from "@/api/error";
import { APIResponse, success } from "@/api/response";
import { HTTPError } from "@/types/error";

import { hashPassword } from "@/lib/bcrypt";

import { validateAndFlatten } from "@/lib/validation/validateAndFlatten";
import { RegisterSchema } from "@/schemas/register.schema";
import { checkEmailDuplicate, createUser } from "@/services/user.service";

export async function signupUser(
  prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> {
  try {
    const data = {
      email: formData.get("email") as string,
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const parsed = validateAndFlatten(RegisterSchema, data);

    if (!parsed.success) {
      throw new HTTPError("입력값을 확인해주세요", 400, parsed.error);
    }

    const { email, name, phone, password } = parsed.data;

    const isEmail = await checkEmailDuplicate(email);

    if (isEmail) throw new HTTPError("이미 존재하는 이메일 입니다.", 409);

    const hashedPassword = await hashPassword(password);

    await createUser({
      password: hashedPassword,
      email,
      name,
      phone,
    });

    return success({
      message: `${data.email}님 회원가입을 축하드립니다.`,
    });
  } catch (e) {
    return handleActionError(e);
  }
}
