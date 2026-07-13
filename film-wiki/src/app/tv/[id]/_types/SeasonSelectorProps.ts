import type { Season } from "@/src/lib/tmdb/types";

export interface SeasonSelectorProps {
  tvId: number;
  /** TVDetail.seasons — 시즌 요약 목록(에피소드 상세는 온디맨드 로드). */
  seasons: Season[];
}
