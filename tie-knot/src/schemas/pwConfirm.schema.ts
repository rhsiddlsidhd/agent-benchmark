import z from "zod";
import { PWSchema } from "./pw.schema";

export const PWConfirmSchema = z
  .object({
    token: z.string().min(1, "토큰이 필요합니다."),
    password: PWSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });
