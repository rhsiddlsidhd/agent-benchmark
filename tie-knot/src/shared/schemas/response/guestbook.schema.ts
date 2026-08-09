import * as z from "zod";

const isoDateString = z.string().refine((v) => !isNaN(Date.parse(v)), {
  message: "ISO date string이 아님",
});

// password는 응답에 포함되지 않는다(getGuestbookService의 select 제외) — z.strictObject로 막아서
// 나중에 password 같은 필드가 실수로 다시 새면 파싱 단계에서 걸리게 한다.
// (.strict()는 Zod 4에서 deprecated, z.strictObject()가 공식 대체)
export const guestbookEntryResponseSchema = z.strictObject({
  _id: z.string(),
  coupleInfoId: z.string(),
  author: z.string(),
  message: z.string(),
  isPrivate: z.boolean(),
  createdAt: isoDateString,
});

export const guestbookListResponseSchema = z.array(guestbookEntryResponseSchema);

export type GuestbookListResponse = z.infer<typeof guestbookListResponseSchema>;
