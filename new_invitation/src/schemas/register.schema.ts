import z from "zod";
import { PWSchema } from "./pw.schema";

export const RegisterSchema = z
  .object({
    name: z.string(),
    email: z.email("이메일 형식이 올바르지 않습니다."),
    phone: z
      .string()
      .regex(/^(01[016789])-\d{3,4}-\d{4}$/, "유효한 전화번호가 아닙니다."),
    password: PWSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });
