import z from "zod";
import { PWSchema } from "./pw.schema";

export const LoginSchema = z.object({
  email: z.email("이메일 형식이 올바르지 않습니다."),
  password: PWSchema,
  remember: z.boolean(),
});
