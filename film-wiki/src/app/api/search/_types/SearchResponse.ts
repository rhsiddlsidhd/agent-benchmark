import type { MultiSearchResult, Paginated } from "@/src/lib/tmdb/types";

/** `/api/search` 성공 응답 = TMDB `searchMulti` 결과를 그대로 전달. */
export type SearchResponse = Paginated<MultiSearchResult>;
