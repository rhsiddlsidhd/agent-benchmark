import type { Movie, Paginated, TVShow } from "@/src/lib/tmdb/types";

/**
 * discover 결과는 검색(multi)과 달리 media_type 판별자가 없다 — 대상 미디어 타입은
 * 요청 파라미터(`type`)로 이미 결정되므로, 응답 아이템은 순수 Movie 또는 TVShow 다.
 * 아래 두 타입은 외부에서 직접 쓰이지 않고 union 구성용 private 빌딩 블록이다.
 */
type DiscoverMovieResponse = Paginated<Movie>;
type DiscoverTvResponse = Paginated<TVShow>;

/** `/api/discover` 성공 응답(미디어 타입에 따른 유니온). */
export type DiscoverResponse = DiscoverMovieResponse | DiscoverTvResponse;
