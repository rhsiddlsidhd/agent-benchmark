import z from "zod";

export const UserEmailSchema = z.object({
  name: z.string(),
  phone: z
    .string()
    .regex(/^(01[016789])-\d{3,4}-\d{4}$/, "유효한 전화번호가 아닙니다."),
});
