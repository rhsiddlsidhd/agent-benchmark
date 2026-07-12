"use client";

/**
 * ContentCard — 콘텐츠 링크 카드 (03_DESIGN §2.1).
 *
 * 포스터(2/3) + 좌상단 RatingBadge + 하단 제목(h3 truncate) + 메타(연도).
 * 평상시 전체가 <a>(Link) — 콘텐츠→상세 탐색의 기본 진입점. hover(scale/상승/제목 밑줄)
 * · tap 은 framer-motion 으로 처리하고 reduced-motion 이면 변형 제거(§5).
 * 접근명은 제목이며(§6, 카드 링크는 작품 제목을 접근명으로) 포커스 링은
 * globals.css :focus-visible 위임.
 *
 * loading 상태는 SkeletonCard 로 대체하고(호출부에서 교체), no-image 는
 * PosterImage 플레이스홀더가 처리한다(§2.9).
 *
 * 19+ 블러 게이트(FR-7): `adult` 가 true 이고 아직 리빌하지 않았으면 카드
 * 루트를 <a> 대신 <button>으로 렌더한다 — 앵커 내부에 별도 리빌 버튼을 중첩시키면
 * 유효하지 않은 마크업(인터랙티브 중첩)이 되므로, 게이트 상태에서는 카드 자체를
 * 단일 인터랙티브 요소(버튼)로 바꿔 첫 클릭은 네비게이션 대신 리빌만 수행한다.
 * 리빌은 카드별 로컬 state(1회성, 재마운트/재방문 시 리셋 — 지속 저장 안 함)이며,
 * 리빌 후에는 평소와 동일한 <a> 카드로 되돌아가 재클릭 시 정상 네비게이션한다.
 */
import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cardSpring } from "@/src/lib/framer-motion/preset";
import { PosterImage } from "./PosterImage";
import { RatingBadge } from "./RatingBadge";

const MotionLink = motion.create(Link);

interface ContentCardProps {
  /** 상세 경로(예: /movie/123, /tv/456). */
  href: string;
  /** 작품 제목(제목 + alt + 접근명). */
  title: string;
  /** TMDB poster_path (null 이면 플레이스홀더). */
  posterPath: string | null;
  /** 출시 연도(없으면 대체 문구). */
  year?: string | null;
  /** vote_average (0 이하이면 배지 생략). */
  rating?: number | null;
  /** TMDB adult 플래그. true면 리빌 전까지 19+ 블러 게이트를 씌운다. */
  adult?: boolean;
}

export function ContentCard({
  href,
  title,
  posterPath,
  year,
  rating,
  adult = false,
}: ContentCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const isGated = adult && !revealed;

  const poster = (
    <div className="relative overflow-hidden rounded-lg shadow-card group-hover:shadow-hover">
      <PosterImage
        path={posterPath}
        alt={title}
        className={`rounded-lg${isGated ? " blur-lg scale-110" : ""}`}
      />
      {rating != null && !isGated ? (
        <RatingBadge
          value={rating}
          variant="overlay"
          className="absolute left-2 top-2"
        />
      ) : null}
      {isGated ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-overlay px-3 text-center">
          <span className="rounded-md border border-border bg-surface px-2 py-0.5 text-caption font-semibold text-content-primary">
            19+
          </span>
          <span className="text-caption text-content-secondary">
            탭하여 성인 콘텐츠 표시
          </span>
        </div>
      ) : null}
    </div>
  );

  const meta = (
    <>
      <h3 className="mt-2 truncate text-h3 text-content-primary group-hover:underline">
        {title}
      </h3>
      <p className="text-body-sm text-content-secondary">
        {year ?? "연도 미상"}
      </p>
    </>
  );

  if (isGated) {
    return (
      <motion.button
        type="button"
        onClick={() => setRevealed(true)}
        aria-label={`${title} — 19+ 콘텐츠, 눌러서 표시`}
        className="group block w-full rounded-lg text-left"
        whileHover={shouldReduceMotion ? undefined : { scale: 1.04, y: -4 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
        transition={cardSpring}
      >
        {poster}
        {meta}
      </motion.button>
    );
  }

  return (
    <MotionLink
      href={href}
      aria-label={title}
      draggable={false}
      className="group block rounded-lg"
      whileHover={shouldReduceMotion ? undefined : { scale: 1.04, y: -4 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
      transition={cardSpring}
    >
      {poster}
      {meta}
    </MotionLink>
  );
}
