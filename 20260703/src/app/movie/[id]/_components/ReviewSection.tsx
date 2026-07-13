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
 * 에러/엣지케이스(§4):
 * - 로딩: 스켈레톤 라인 3개(role=status, aria-busy).
 * - fetch 실패(429/5xx/네트워크): ErrorState(refetch 재시도).
 * - 리뷰 0건: EmptyState("아직 리뷰가 없습니다"). 섹션 자체는 유지한다(§2.9와 달리
 *   이 섹션은 존재 자체가 확정 요구사항이라 숨기지 않는다).
 * - 로딩/에러/빈 상태에는 페이지네이션 컨트롤을 숨긴다.
 */
import { useState, type ReactNode } from "react";
import { Button, EmptyState, ErrorState } from "@/src/components/ui";
import { useMovieReviews } from "../_hooks";
import { localPageToTmdbPage, sliceReviewsForLocalPage } from "../_utils";
import { REVIEW_PAGE_SIZE } from "../_constants";
import { ReviewCard } from "./ReviewCard";

export function ReviewSection({ movieId }: { movieId: number }) {
  const [localPage, setLocalPage] = useState(1);
  const tmdbPage = localPageToTmdbPage(localPage);
  const reviewsQuery = useMovieReviews(movieId, tmdbPage);

  let body: ReactNode;

  if (reviewsQuery.isPending) {
    body = (
      <div
        className="flex flex-col gap-3"
        role="status"
        aria-busy="true"
        aria-label="리뷰를 불러오는 중"
      >
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="skeleton h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  } else if (reviewsQuery.isError) {
    body = (
      <ErrorState
        message="리뷰를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
        onRetry={() => {
          void reviewsQuery.refetch();
        }}
      />
    );
  } else if (reviewsQuery.data.total_results === 0) {
    body = (
      <EmptyState
        title="아직 리뷰가 없습니다"
        message="이 작품에 대한 리뷰가 등록되면 여기에 표시됩니다."
      />
    );
  } else {
    const reviews = sliceReviewsForLocalPage(
      reviewsQuery.data.results,
      localPage
    );
    const totalLocalPages = Math.ceil(
      reviewsQuery.data.total_results / REVIEW_PAGE_SIZE
    );

    body = (
      <>
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </ul>
        {totalLocalPages > 1 ? (
          <div className="mt-4 flex items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              disabled={localPage === 1}
              onClick={() => setLocalPage((page) => page - 1)}
            >
              이전
            </Button>
            <span className="text-body-sm text-content-secondary">
              {localPage} / {totalLocalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={localPage >= totalLocalPages}
              onClick={() => setLocalPage((page) => page + 1)}
            >
              다음
            </Button>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <section
      aria-label="리뷰"
      className="mx-auto w-full max-w-page px-gutter md:px-gutter-lg"
    >
      <h2 className="text-h2 text-content-primary">리뷰</h2>
      <div className="mt-4">{body}</div>
    </section>
  );
}
