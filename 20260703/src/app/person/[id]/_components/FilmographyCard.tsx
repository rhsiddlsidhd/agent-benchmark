"use client";

/**
 * FilmographyCard — 필모그래피 타임라인 카드 1건 (03_DESIGN §3.5, §2.1 참고).
 *
 * 포스터+평점 배지는 링크(`<a>`)로 감싸 작품 상세로 이동한다(media_type 에
 * 따라 /movie/[id] · /tv/[id], 인물→작품 탐색 흐름 PRD §2 완결). 역할
 * 배지/툴팁(`RoleTooltip`)은 링크 밖에 둬 배지 hover/tap 이 카드 네비게이션과
 * 충돌하지 않게 한다. hover/tap 은 ContentCard 와 동일한 스프링(§5)을 쓰되,
 * reduced-motion 이면 변형을 제거한다.
 */
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { PosterImage, RatingBadge } from "@/src/components/ui";
import { cardSpring } from "@/src/lib/framer-motion/preset";
import type { FilmographyEntry } from "../_types";
import { RoleTooltip } from "./RoleTooltip";

const MotionLink = motion.create(Link);

interface FilmographyCardProps {
  entry: FilmographyEntry;
}

export function FilmographyCard({ entry }: FilmographyCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="w-full">
      <MotionLink
        href={entry.href}
        aria-label={entry.title}
        draggable={false}
        className="group block rounded-lg"
        whileHover={shouldReduceMotion ? undefined : { scale: 1.04, y: -4 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
        transition={cardSpring}
      >
        <div className="relative overflow-hidden rounded-lg shadow-card group-hover:shadow-hover">
          <PosterImage path={entry.posterPath} alt={entry.title} />
          {entry.rating != null ? (
            <RatingBadge
              value={entry.rating}
              variant="overlay"
              className="absolute top-2 left-2"
            />
          ) : null}
        </div>
        <h4 className="mt-2 truncate text-h3 text-content-primary group-hover:underline">
          {entry.title}
        </h4>
        <p className="text-body-sm text-content-secondary">
          {entry.year ?? "연도 미상"}
        </p>
      </MotionLink>
      <RoleTooltip badges={entry.badges} roleDetail={entry.roleDetail} />
    </div>
  );
}
