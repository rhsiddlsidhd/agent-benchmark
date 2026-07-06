/**
 * TMDB REST API 응답 타입 정의.
 *
 * TMDB는 목록 아이템과 상세 응답의 shape이 다르다(목록은 `genre_ids: number[]`,
 * 상세는 `genres: Genre[]`). 이를 별도 인터페이스로 명시해 느슨한 타입을 피한다.
 * 결측 가능 필드는 TMDB 실제 응답에 맞춰 `| null` 또는 `''`(빈 문자열)을 허용한다.
 */

// ---------------------------------------------------------------------------
// 공통
// ---------------------------------------------------------------------------

/** TMDB 페이지네이션 응답 래퍼. */
export interface Paginated<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

/** 장르(id + 이름). */
export interface Genre {
  id: number;
  name: string;
}

/** 제작사. */
export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

/** 방영 네트워크(TV). */
export interface Network {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

/** 사용된 언어. */
export interface SpokenLanguage {
  iso_639_1: string;
  english_name: string;
  name: string;
}

/** discover/genres 등에서 대상 미디어 타입 구분. */
export type MediaType = "movie" | "tv";

// ---------------------------------------------------------------------------
// Movie
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// TV
// ---------------------------------------------------------------------------

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

/** TV 시리즈 제작자. */
export interface CreatedBy {
  id: number;
  credit_id: string;
  name: string;
  gender: number;
  profile_path: string | null;
}

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

/** 시즌 요약(TVDetail.seasons 아이템). */
export interface Season {
  id: number;
  name: string;
  overview: string;
  air_date: string | null;
  episode_count: number;
  poster_path: string | null;
  season_number: number;
  vote_average: number;
}

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

/** 에피소드. */
export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string | null;
  still_path: string | null;
  vote_average: number;
  vote_count: number;
  runtime: number | null;
}

// ---------------------------------------------------------------------------
// Person
// ---------------------------------------------------------------------------

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

/** 인물 상세(약력 등). */
export interface PersonDetail {
  id: number;
  name: string;
  profile_path: string | null;
  adult: boolean;
  popularity: number;
  gender: number;
  known_for_department: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  also_known_as: string[];
  homepage: string | null;
  imdb_id: string | null;
}

// ---------------------------------------------------------------------------
// Credits (movie/tv 출연진·제작진)
// ---------------------------------------------------------------------------

/** 출연(배우) 크레딧. */
export interface CastMember {
  id: number;
  name: string;
  original_name: string;
  profile_path: string | null;
  gender: number;
  known_for_department: string;
  popularity: number;
  adult: boolean;
  credit_id: string;
  character: string;
  order: number;
}

/** 제작진 크레딧. */
export interface CrewMember {
  id: number;
  name: string;
  original_name: string;
  profile_path: string | null;
  gender: number;
  known_for_department: string;
  popularity: number;
  adult: boolean;
  credit_id: string;
  department: string;
  job: string;
}

/** 출연/제작 크레딧 통합(개별 항목 판별용 유니온). */
export type Credit = CastMember | CrewMember;

/** movie/tv 크레딧 응답. */
export interface Credits {
  id: number;
  cast: CastMember[];
  crew: CrewMember[];
}

// ---------------------------------------------------------------------------
// Search (multi: movie | tv | person 유니온)
// ---------------------------------------------------------------------------

/** multi 검색의 영화 결과(media_type 판별자 부여). */
export type MovieSearchResult = Movie & { media_type: "movie" };
/** multi 검색의 TV 결과. */
export type TVSearchResult = TVShow & { media_type: "tv" };
/** multi 검색의 인물 결과. */
export type PersonSearchResult = Person & { media_type: "person" };

/** multi 검색/트렌딩(all) 결과 유니온. media_type으로 분기. */
export type MultiSearchResult =
  | MovieSearchResult
  | TVSearchResult
  | PersonSearchResult;

// ---------------------------------------------------------------------------
// Person combined credits (필모그래피)
// ---------------------------------------------------------------------------

/** 인물 필모그래피의 출연 크레딧(영화/TV 판별 유니온). */
export type PersonCombinedCastCredit =
  | (Movie & { media_type: "movie"; credit_id: string; character: string; order?: number })
  | (TVShow & {
      media_type: "tv";
      credit_id: string;
      character: string;
      episode_count?: number;
    });

/** 인물 필모그래피의 제작 크레딧(영화/TV 판별 유니온). */
export type PersonCombinedCrewCredit =
  | (Movie & { media_type: "movie"; credit_id: string; department: string; job: string })
  | (TVShow & {
      media_type: "tv";
      credit_id: string;
      department: string;
      job: string;
      episode_count?: number;
    });

/** 인물 combined_credits 응답. */
export interface PersonCombinedCredits {
  id: number;
  cast: PersonCombinedCastCredit[];
  crew: PersonCombinedCrewCredit[];
}

// ---------------------------------------------------------------------------
// Genre list 응답
// ---------------------------------------------------------------------------

/** genre/{type}/list 응답 래퍼. */
export interface GenreListResponse {
  genres: Genre[];
}
