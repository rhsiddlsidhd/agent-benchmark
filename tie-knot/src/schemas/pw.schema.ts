import z from "zod";

export const PWSchema = z
  .string()
  .refine(
    (v) =>
      v.length >= 6 &&
      v.length <= 12 &&
      /[A-Za-z]/.test(v) &&
      /[0-9]/.test(v) &&
      /[^A-Za-z0-9]/.test(v),
    {
      message:
        "비밀번호는 영문자, 숫자, 특수문자를 포함한 최소 6자 이상 최대 12자 이하입니다.",
    },
  );
