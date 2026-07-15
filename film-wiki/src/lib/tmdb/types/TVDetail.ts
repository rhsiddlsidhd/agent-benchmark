import type { CreatedBy } from "./CreatedBy";
import type { Genre } from "./Genre";
import type { Network } from "./Network";
import type { Season } from "./Season";

/** TV 상세(genres 배열 + 시즌 요약 + 상세 필드). */
export interface TVDetail {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date: string | null;
  vote_average: number;
  vote_count: number;
  genres: Genre[];
  adult: boolean;
  popularity: number;
  original_language: string;
  origin_country: string[];
  number_of_seasons: number;
  number_of_episodes: number;
  /** 회차별 러닝타임 후보(분). TMDB가 여러 값을 줄 수 있어 배열. */
  episode_run_time: number[];
  status: string;
  tagline: string;
  homepage: string | null;
  in_production: boolean;
  type: string;
  created_by: CreatedBy[];
  networks: Network[];
  /** 시즌 요약 목록(에피소드 상세는 SeasonDetail에서 별도 로드). */
  seasons: Season[];
}
