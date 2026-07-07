"use client";

/**
 * `useDiscoverInfinite` — 장르 디스커버 무한스크롤 훅 (01_ARCHITECTURE §5.3 / FR-6 / NFR-1).
 *
 * TanStack Query `useInfiniteQuery` 로 `/api/discover` 를 페이지 단위로 조회한다
 * (T5 `useSearchInfinite` 의 무한스크롤 패턴 재사용). TMDB 키는 Route Handler
 * 내부에서만 쓰이므로 이 훅은 키를 알 필요가 없다(ADR-0003).
 *
 * 대상 미디어 타입(`type`)은 호출부가 리터럴로 넘기며, 그에 따라 결과 아이템 타입이
 * Movie 또는 TVShow 로 정확히 좁혀진다(DiscoverItem<T> 조건부 타입). 검색(multi)과
 * 달리 media_type 판별자가 없으므로 소비 컴포넌트에서 별도 내로잉이 필요 없다.
 *
 * 에러/엣지케이스 정책(§4):
 * - 실패 재시도는 `retry: 1` 로 제한한다(그 이상은 TMDB rate limit 을 악화 — ADR-0004).
 * - 마지막 페이지(page >= total_pages)에서 `getNextPageParam` 이 `undefined` 를 반환해
 *   무한스크롤이 추가 로딩 UI 없이 조용히 정지한다.
 * - 장르 0개 선택은 차단이 아니라 인기순 디스커버로 이어진다(Route Handler 기본 동작).
 *   따라서 `enabled` 는 기본 true 이며, 호출부가 화면 조건에 따라 끌 수 있다.
 * - queryKey 의 genreIds 는 정렬해 담아, 선택 순서만 다른 동일 조합이 별도 캐시
 *   엔트리를 만들지 않도록 한다.
 */
import { useInfiniteQuery } from "@tanstack/react-query";

import type {
  MediaType,
  Movie,
  Paginated,
  TVShow,
} from "@/src/lib/tmdb/types";

/** 대상 미디어 타입에 따른 discover 결과 아이템 타입 매핑. */
type DiscoverItem<T extends MediaType> = T extends "movie" ? Movie : TVShow;

interface UseDiscoverInfiniteParams<T extends MediaType> {
  /** 대상 미디어 타입(리터럴로 전달 — 결과 아이템 타입이 이에 좌우된다). */
  type: T;
  /** 선택된 장르 id 목록. 비면 인기순 디스커버(기본 동작). */
  genreIds: number[];
  /** 성인 콘텐츠 포함 여부(AdultToggle, T13). 기본 false. */
  includeAdult?: boolean;
  /** 조회 활성화 여부. 기본 true(0개 선택도 인기작으로 유효). */
  enabled?: boolean;
}

/**
 * `/api/discover` 한 페이지를 조회한다. 실패 응답은 에러로 던져 `retry: 1` 대상이 된다.
 * JSON 파싱 결과는 요청한 `type` 에 대응하는 `Paginated<DiscoverItem<T>>` 로 소비한다
 * (기존 search/season 훅과 동일한 응답-타입 고정 방식).
 */
async function fetchDiscoverPage<T extends MediaType>(
  type: T,
  genreIds: number[],
  page: number,
  includeAdult: boolean
): Promise<Paginated<DiscoverItem<T>>> {
  const params = new URLSearchParams({
    type,
    page: String(page),
    includeAdult: String(includeAdult),
  });
  if (genreIds.length > 0) {
    params.set("genreIds", genreIds.join(","));
  }

  const response = await fetch(`/api/discover?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`디스커버 요청 실패 (HTTP ${response.status})`);
  }

  const data: Paginated<DiscoverItem<T>> = await response.json();
  return data;
}

export function useDiscoverInfinite<T extends MediaType>({
  type,
  genreIds,
  includeAdult = false,
  enabled = true,
}: UseDiscoverInfiniteParams<T>) {
  // 선택 순서 무관하게 동일 조합이 같은 캐시 키를 갖도록 정렬(원본 배열은 불변 유지).
  const sortedGenreIds = [...genreIds].sort((a, b) => a - b);

  return useInfiniteQuery({
    queryKey: ["discover", type, sortedGenreIds, includeAdult],
    queryFn: ({ pageParam }) =>
      fetchDiscoverPage(type, genreIds, pageParam, includeAdult),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    enabled,
    retry: 1,
  });
}
