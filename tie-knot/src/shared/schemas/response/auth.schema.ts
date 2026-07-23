import * as z from "zod";

export const authSessionSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
  email: z.string(),
  userId: z.string(),
});

export type AuthSession = z.infer<typeof authSessionSchema>;

// /api/auth/me 응답 전용 — 세션 없으면 null
export const authSessionResponseSchema = authSessionSchema.nullable();

export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>;
