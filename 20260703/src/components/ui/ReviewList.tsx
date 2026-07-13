"use client";

/**
 * ReviewList — 리뷰 섹션 렌더링 셸 (FR-3 확정 요구사항 / 01_ARCHITECTURE §5.4, §4).
 *
 * movie/tv 상세가 공유하는 순수 렌더링 컴포넌트. 데이터 페칭(TanStack Query 훅
 * 호출)과 페이지네이션 상태는 도메인 로직이라 호출부(라우트별 `ReviewSection`)
 * 책임으로 남기고(`src/components/CLAUDE.md`), 이 컴포넌트는 상태 값을 props로만
 * 받아 그린다.
 *
 * 에러/엣지케이스(§4):
 * - 로딩: 스켈레톤 라인 3개(role=status, aria-busy).
 * - fetch 실패(429/5xx/네트워크): ErrorState(onRetry).
 * - 리뷰 0건: EmptyState("아직 리뷰가 없습니다"). 섹션 자체는 유지한다.
 * - 로딩/에러/빈 상태에는 페이지네이션 컨트롤을 숨긴다.
 */
import type { ReactNode } from "react";
import type { Review } from "@/src/lib/tmdb/types";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { ReviewCard } from "./ReviewCard";

interface ReviewListProps {
  /** 로딩 중이면 스켈레톤을 그린다. */
  isPending: boolean;
  /** fetch 실패 시 ErrorState 를 그린다. */
  isError: boolean;
  /** ErrorState 의 재시도 핸들러(TanStack Query refetch 등). */
  onRetry: () => void;
  /** 총 리뷰 0건이면 EmptyState 를 그린다(isPending/isError 가 아닐 때만 확인). */
  isEmpty: boolean;
  /** 현재 로컬 페이지에 해당하는 리뷰 목록(이미 슬라이싱된 상태로 전달). */
  reviews: Review[];
  /** 현재 로컬 페이지(1-base). */
  page: number;
  /** 전체 로컬 페이지 수. */
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function ReviewList({
  isPending,
  isError,
  onRetry,
  isEmpty,
  reviews,
  page,
  totalPages,
  onPrevPage,
  onNextPage,
}: ReviewListProps) {
  let body: ReactNode;

  if (isPending) {
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
  } else if (isError) {
    body = (
      <ErrorState
        message="리뷰를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
        onRetry={onRetry}
      />
    );
  } else if (isEmpty) {
    body = (
      <EmptyState
        title="아직 리뷰가 없습니다"
        message="이 작품에 대한 리뷰가 등록되면 여기에 표시됩니다."
      />
    );
  } else {
    body = (
      <>
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </ul>
        {totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={onPrevPage}
            >
              이전
            </Button>
            <span className="text-body-sm text-content-secondary">
              {page} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={onNextPage}
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
