/**
 * discover 모듈 공유 타입 (01_ARCHITECTURE §5.3 / FR-6).
 *
 * `/api/discover` Route Handler 의 응답 shape 과 `useDiscoverInfinite` 훅의 기대
 * 타입을 한 곳에서 정의해, 서버 응답과 프론트 소비 타입이 어긋나지 않도록 고정한다.
 *
 * discover 결과는 검색(multi)과 달리 media_type 판별자가 없다 — 대상 미디어 타입은
 * 요청 파라미터(`type`)로 이미 결정되므로, 응답 아이템은 순수 Movie 또는 TVShow 다.
 */
import type { Movie, Paginated, TVShow } from "@/src/lib/tmdb/types";

/** `/api/discover?type=movie` 성공 응답. */
export type DiscoverMovieResponse = Paginated<Movie>;

/** `/api/discover?type=tv` 성공 응답. */
export type DiscoverTvResponse = Paginated<TVShow>;

/** `/api/discover` 성공 응답(미디어 타입에 따른 유니온). */
export type DiscoverResponse = DiscoverMovieResponse | DiscoverTvResponse;

/** `/api/discover` 실패 응답(400 검증 실패 및 429/5xx 패스스루). */
export interface DiscoverErrorResponse {
  error: string;
}
