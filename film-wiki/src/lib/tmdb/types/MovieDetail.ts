import type { Genre } from "./Genre";
import type { ProductionCompany } from "./ProductionCompany";
import type { SpokenLanguage } from "./SpokenLanguage";

/** 영화 상세(genres 배열 + 상세 필드). 목록의 genre_ids는 없다. */
export interface MovieDetail {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genres: Genre[];
  adult: boolean;
  popularity: number;
  original_language: string;
  video: boolean;
  /** 러닝타임(분). 미확정이면 null. */
  runtime: number | null;
  status: string;
  tagline: string;
  homepage: string | null;
  imdb_id: string | null;
  budget: number;
  revenue: number;
  production_companies: ProductionCompany[];
  spoken_languages: SpokenLanguage[];
}
