import type { Movie } from "./Movie";

/** multi 검색의 영화 결과(media_type 판별자 부여). */
export type MovieSearchResult = Movie & { media_type: "movie" };
