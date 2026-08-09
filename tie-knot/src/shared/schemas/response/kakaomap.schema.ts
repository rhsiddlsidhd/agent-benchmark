import * as z from "zod";

// 카카오 로컬 API 원본 응답을 그대로 프록시한다 — 우리가 소유하지 않는 외부 계약이라
// 필드를 느슨하게만 고정한다(카카오 쪽 스펙 변경에 우리 타입이 종속되지 않도록).
export const kakaomapResponseSchema = z.object({
  meta: z.record(z.string(), z.unknown()).optional(),
  documents: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type KakaomapResponse = z.infer<typeof kakaomapResponseSchema>;
