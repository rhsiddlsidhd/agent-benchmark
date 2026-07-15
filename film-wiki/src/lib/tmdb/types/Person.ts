import type { MovieSearchResult } from "./MovieSearchResult";
import type { TVSearchResult } from "./TVSearchResult";

/** 목록/검색용 인물 아이템. */
export interface Person {
  id: number;
  name: string;
  profile_path: string | null;
  adult: boolean;
  popularity: number;
  gender: number;
  known_for_department: string;
  /** multi 검색 응답에서만 채워지는 대표작(영화/TV). */
  known_for?: Array<MovieSearchResult | TVSearchResult>;
}
