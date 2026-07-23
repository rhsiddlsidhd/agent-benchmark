import * as z from "zod";

export const emailSchema = z.object({
  email: z.email({
    message: "이메일 형식이 올바르지 않습니다.",
  }),
});
