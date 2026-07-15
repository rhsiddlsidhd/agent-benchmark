/** 목록/검색용 영화 아이템(genre_ids 포함). */
export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  /** 미개봉작은 빈 문자열일 수 있다. */
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  popularity: number;
  original_language: string;
  video: boolean;
}
