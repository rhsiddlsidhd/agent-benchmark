import type { SeasonDetail } from "@/src/lib/tmdb/types";

/** `/api/tv/[id]/season/[n]` 성공 응답 = TMDB `getTvSeason` 결과를 그대로 전달. */
export type SeasonResponse = SeasonDetail;
