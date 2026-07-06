/**
 * search 모듈 공유 타입 (01_ARCHITECTURE §5.3).
 *
 * `/api/search` Route Handler 의 응답 shape 과 `useSearchInfinite` 훅의 기대 타입을
 * 한 곳에서 정의해, 서버 응답과 프론트 소비 타입이 어긋나지 않도록 고정한다.
 */
import type { MultiSearchResult, Paginated } from "@/src/lib/tmdb/types";

/** `/api/search` 성공 응답 = TMDB `searchMulti` 결과를 그대로 전달. */
export type SearchResponse = Paginated<MultiSearchResult>;

/** `/api/search` 실패 응답(429/5xx 패스스루 및 서버 오류 시). */
export interface SearchErrorResponse {
  error: string;
}
