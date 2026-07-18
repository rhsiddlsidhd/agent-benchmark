import z from "zod";

export const GuestbookSchema = z.object({
  coupleInfoId: z.string().min(1, "청첩장 ID가 필요합니다"),
  author: z
    .string()
    .min(1, "작성자 이름을 입력해주세요")
    .max(20, "이름은 20자 이내로 입력해주세요"),
  password: z
    .string()
    .min(4, "비밀번호는 최소 4자 이상이어야 합니다")
    .max(20, "비밀번호는 20자 이내로 입력해주세요"),
  message: z
    .string()
    .min(1, "메시지를 입력해주세요")
    .max(500, "메시지는 500자 이내로 입력해주세요"),
  isPrivate: z.boolean(),
});

export type GuestBookType = z.infer<typeof GuestbookSchema>;
