"use client";

/**
 * ContentCard — 콘텐츠 링크 카드 (03_DESIGN §2.1).
 *
 * 포스터(2/3) + 좌상단 RatingBadge + 하단 제목(h3 truncate) + 메타(연도).
 * 전체가 <a>(Link) — 콘텐츠→상세 탐색의 기본 진입점. hover(scale/상승/제목 밑줄)
 * · tap 은 framer-motion 으로 처리하고 reduced-motion 이면 변형 제거(§5).
 * 접근명은 제목이며(§6, 카드 링크는 작품 제목을 접근명으로) 포커스 링은
 * globals.css :focus-visible 위임.
 *
 * loading 상태는 SkeletonCard 로 대체하고(호출부에서 교체), no-image 는
 * PosterImage 플레이스홀더가 처리한다(§2.9).
 */
import Link from "next/link";
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
}

export function ContentCard({
  href,
  title,
  posterPath,
  year,
  rating,
}: ContentCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <MotionLink
      href={href}
      aria-label={title}
      className="group block rounded-lg"
      whileHover={shouldReduceMotion ? undefined : { scale: 1.04, y: -4 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
      transition={cardSpring}
    >
      <div className="relative overflow-hidden rounded-lg shadow-card group-hover:shadow-hover">
        <PosterImage path={posterPath} alt={title} className="rounded-lg" />
        {rating != null ? (
          <RatingBadge
            value={rating}
            variant="overlay"
            className="absolute left-2 top-2"
          />
        ) : null}
      </div>

      <h3 className="mt-2 truncate text-h3 text-content-primary group-hover:underline">
        {title}
      </h3>
      <p className="text-body-sm text-content-secondary">
        {year ?? "연도 미상"}
      </p>
    </MotionLink>
  );
}
