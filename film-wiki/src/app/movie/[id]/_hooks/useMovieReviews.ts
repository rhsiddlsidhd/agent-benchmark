"use client";

/**
 * `useMovieReviews` — 영화 리뷰 온디맨드 조회 훅 (01_ARCHITECTURE §5.4 / FR-3).
 *
 * TanStack Query `useQuery` 로 `/api/movie/[id]/reviews` 를 TMDB 페이지(20개) 단위로
 * 조회한다. 요구사항의 10개 단위 페이지네이션은 이 훅이 아니라 호출부
 * (`ReviewSection`)가 `localPageToTmdbPage`/`sliceReviewsForLocalPage` 로 재분할한다
 * — 이 훅은 TMDB 페이지 번호만 안다. TMDB 키는 Route Handler 내부에서만 쓰이므로
 * 이 훅은 키를 알 필요가 없다(ADR-0003).
 *
 * 에러/엣지케이스 정책(§4):
 * - 실패 재시도는 `retry: 1` 로 제한한다(그 이상은 TMDB rate limit 을 악화 — ADR-0004).
 * - 최종 실패 시 소비 컴포넌트가 `ErrorState`(refetch) 를 노출한다.
 */
import { useQuery } from "@tanstack/react-query";

import type { ReviewsResponse } from "@/src/app/api/movie/[id]/reviews/_types";

/** `/api/movie/[id]/reviews` 를 조회한다. 실패 응답은 에러로 던져 `retry: 1` 대상이 된다. */
async function fetchMovieReviews(
  movieId: number,
  tmdbPage: number,
): Promise<ReviewsResponse> {
  const response = await fetch(
    `/api/movie/${movieId}/reviews?page=${tmdbPage}`,
  );
  if (!response.ok) {
    throw new Error(`리뷰 요청 실패 (HTTP ${response.status})`);
  }

  const data: ReviewsResponse = await response.json();
  return data;
}

export function useMovieReviews(movieId: number, tmdbPage: number) {
  return useQuery({
    queryKey: ["movie-reviews", movieId, tmdbPage],
    queryFn: () => fetchMovieReviews(movieId, tmdbPage),
    retry: 1,
  });
}
