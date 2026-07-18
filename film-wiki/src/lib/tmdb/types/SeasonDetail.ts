import type { Episode } from "./Episode";

/** 시즌 상세(에피소드 목록 포함). */
export interface SeasonDetail {
  id: number;
  name: string;
  overview: string;
  air_date: string | null;
  poster_path: string | null;
  season_number: number;
  vote_average: number;
  episodes: Episode[];
}
