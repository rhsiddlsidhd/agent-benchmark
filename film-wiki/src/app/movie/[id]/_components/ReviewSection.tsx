"use client";

/**
 * ReviewSection — 영화 상세 리뷰 섹션(인라인, FR-3 확정 요구사항 / 01_ARCHITECTURE
 * §5.4, §4).
 *
 * TMDB 리뷰 API(`/movie/{id}/reviews`)는 페이지당 20개를 반환하지만, 요구사항은
 * 10개 단위 페이지네이션이다. 로컬 페이지(10개)를 TMDB 페이지(20개)로 매핑해
 * (`localPageToTmdbPage`) 필요한 절반만 잘라 쓴다(`sliceReviewsForLocalPage`) —
 * 로컬 페이지 2개 중 1개는 이미 캐시된 TMDB 페이지를 재사용해 왕복 호출을 줄인다.
 *
 * 페이지 이동은 인터랙티브하므로 온디맨드 Route Handler 경유 조회(§4/ADR-0003,
 * `SeasonSelector` 와 동일 패턴)를 쓴다 — Server Component 인 page.tsx 는 전체
 * 리뷰를 미리 로드하지 않는다(읽기 전용, 작성/평점 부여 UI 없음).
 *
 * 데이터 페칭(훅 호출)과 페이지네이션 상태는 이 컴포넌트(도메인 로직, 호출부
 * 책임)가 소유하고, 렌더링은 movie/tv 공유 셸 `ReviewList`(`src/components/ui`)
 * 에 위임한다(`src/components/CLAUDE.md` — 공용 UI는 도메인 로직을 갖지 않음).
 */
import { useState } from "react";
import { ReviewList } from "@/src/components/ui";
import {
  localPageToTmdbPage,
  sliceReviewsForLocalPage,
  REVIEW_PAGE_SIZE,
} from "@/src/utils";
import { useMovieReviews } from "../_hooks";

export function ReviewSection({ movieId }: { movieId: number }) {
  const [localPage, setLocalPage] = useState(1);
  const tmdbPage = localPageToTmdbPage(localPage);
  const reviewsQuery = useMovieReviews(movieId, tmdbPage);

  const isPending = reviewsQuery.isPending;
  const isError = reviewsQuery.isError;
  const isEmpty =
    !isPending && !isError && reviewsQuery.data.total_results === 0;
  const reviews =
    !isPending && !isError
      ? sliceReviewsForLocalPage(reviewsQuery.data.results, localPage)
      : [];
  const totalPages =
    !isPending && !isError
      ? Math.ceil(reviewsQuery.data.total_results / REVIEW_PAGE_SIZE)
      : 0;

  return (
    <ReviewList
      isPending={isPending}
      isError={isError}
      onRetry={() => {
        void reviewsQuery.refetch();
      }}
      isEmpty={isEmpty}
      reviews={reviews}
      page={localPage}
      totalPages={totalPages}
      onPrevPage={() => setLocalPage((page) => page - 1)}
      onNextPage={() => setLocalPage((page) => page + 1)}
    />
  );
}
