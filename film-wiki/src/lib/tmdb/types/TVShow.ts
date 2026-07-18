/** 목록/검색용 TV 아이템(genre_ids 포함). */
export interface TVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  /** 미방영작은 빈 문자열일 수 있다. */
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  popularity: number;
  original_language: string;
  origin_country: string[];
}
