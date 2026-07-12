"use client";

/**
 * `useSearchInfinite` — 통합 검색 무한스크롤 훅 (01_ARCHITECTURE §5.3 / FR-2 / NFR-1).
 *
 * TanStack Query `useInfiniteQuery` 로 `/api/search` 를 페이지 단위로 조회한다.
 * TMDB 키는 Route Handler 내부에서만 쓰이므로 이 훅은 키를 알 필요가 없다(ADR-0003).
 *
 * 에러/엣지케이스 정책(§4):
 * - 실패 재시도는 `retry: 1` 로 제한한다(그 이상은 TMDB rate limit 을 악화 — ADR-0004).
 * - 마지막 페이지(page >= total_pages)에서 `getNextPageParam` 이 `undefined` 를 반환해
 *   무한스크롤이 추가 로딩 UI 없이 조용히 정지한다.
 * - 빈 query 는 `enabled: false` 로 요청 자체를 보내지 않는다.
 *
 * 성인 콘텐츠(FR-7)는 서버가 상시 페칭하고 카드 단위 게이트로 처리하므로, 이 훅은
 * include_adult 를 알지 않는다.
 */
import { useInfiniteQuery } from "@tanstack/react-query";

import type { SearchResponse } from "@/src/app/api/search/_types";

interface UseSearchInfiniteParams {
  /** 검색어(제출된 값). 앞뒤 공백은 훅 내부에서 정규화한다. */
  query: string;
}

/** `/api/search` 한 페이지를 조회한다. 실패 응답은 에러로 던져 `retry: 1` 대상이 된다. */
async function fetchSearchPage(
  query: string,
  page: number
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    query,
    page: String(page),
  });

  const response = await fetch(`/api/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`검색 요청 실패 (HTTP ${response.status})`);
  }

  const data: SearchResponse = await response.json();
  return data;
}

export function useSearchInfinite({ query }: UseSearchInfiniteParams) {
  const trimmedQuery = query.trim();

  return useInfiniteQuery({
    queryKey: ["search", trimmedQuery],
    queryFn: ({ pageParam }) => fetchSearchPage(trimmedQuery, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    enabled: trimmedQuery.length > 0,
    retry: 1,
  });
}
