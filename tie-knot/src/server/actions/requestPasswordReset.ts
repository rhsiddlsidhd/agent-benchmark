"use server";

import { encrypt } from "@/server/lib/jose";
import { validateAndFlatten } from "@/shared/utils";
import { sendEmail } from "@/server/lib/nodemailer";
import { emailSchema } from "@/shared/schemas";
import { APIResponse } from "@/shared/types";
import { checkEmailDuplicate } from "@/server/services";
const createChangePWDomain = (token: string): string => {
  return process.env.NODE_ENV === "development"
    ? `http://localhost:3000/change-pw?t=${encodeURIComponent(token)}`
    : "";
};

export const requestPasswordReset = async (
  prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ message: string; email: string }>> => {
  // 이메일 비밀번호 재설정 링크 전송
  // nodeMailer 라이브러리 사용

  const data = {
    email: formData.get("email") as string,
  };

  const parsed = validateAndFlatten(emailSchema, data);

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
  const { email } = parsed.data;

  const isEmail = await checkEmailDuplicate(email);

  if (!isEmail) {
    return {
      success: false,
      error: { message: "등록되지 않은 이메일입니다.", code: 400 },
    };
  }

  try {
    // entry token 발행 && createDomatin
    const entryToken = await encrypt({ id: email, type: "ENTRY" });

    // 도메인을 생성
    const path = createChangePWDomain(entryToken);

    await sendEmail({ email, path });

    return {
      success: true,
      data: { message: "이메일 발송에 성공하였습니다.", email },
    };
  } catch {
    return {
      success: false,
      error: { message: "서버 오류가 발생했습니다.", code: 500 },
    };
  }
};
