"use client";

/**
 * ReviewCard — 개별 리뷰 카드 (FR-3 확정 요구사항).
 *
 * 본문이 200자(`REVIEW_CONTENT_LIMIT`) 초과면 접어서 "더보기"로 펼친다. 작성자
 * 평점(`author_details.rating`)이 null 이면 별점 영역 자체를 숨긴다(텍스트/빈 별
 * 표시하지 않음). 작성일은 타임존 변환에 따른 서버/클라이언트 불일치를 피하려고
 * `Date` 객체 없이 ISO 문자열 앞 10자(YYYY-MM-DD)만 그대로 쓴다.
 */
import { useState } from "react";
import { RatingBadge } from "@/src/components/ui";
import type { Review } from "@/src/lib/tmdb/types";
import { REVIEW_CONTENT_LIMIT } from "../_constants";

export function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);

  const rating = review.author_details.rating;
  const authorName = review.author_details.name || review.author;
  const createdAt = review.created_at.slice(0, 10);

  const isLong = review.content.length > REVIEW_CONTENT_LIMIT;
  const displayedContent =
    isLong && !expanded
      ? `${review.content.slice(0, REVIEW_CONTENT_LIMIT)}…`
      : review.content;

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-body-sm font-semibold text-content-primary">
          {authorName}
        </span>
        {rating !== null ? <RatingBadge value={rating} /> : null}
      </div>
      {createdAt ? (
        <time dateTime={review.created_at} className="text-caption text-content-muted">
          {createdAt}
        </time>
      ) : null}
      <p className="whitespace-pre-line text-body-sm text-content-secondary">
        {displayedContent}
      </p>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="self-start text-body-sm font-medium text-brand hover:underline"
        >
          {expanded ? "접기" : "더보기"}
        </button>
      ) : null}
    </li>
  );
}
