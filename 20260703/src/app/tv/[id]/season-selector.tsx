"use client";

/**
 * SeasonSelector — TV 시즌 선택 + 에피소드 목록 (03_DESIGN §3.4, FR-4).
 *
 * 시즌 전환은 인터랙티브하므로 Client Component 로 분리하고, 선택된 시즌만
 * `useTvSeason`(→ `/api/tv/[id]/season/[n]`)으로 온디맨드 조회한다(ADR-0003 —
 * 인터랙티브 페치는 Route Handler 경유). 시즌 목록(`TVDetail.seasons`)은 서버에서
 * 이미 받은 값을 props 로 받아 칩을 그리고, 에피소드 상세는 선택 시점에만 가져온다.
 *
 * 에러/엣지케이스(§4):
 * - 로딩 중: 에피소드 카드 형태의 Skeleton.
 * - fetch 실패(404/429/5xx/네트워크): ErrorState(refetch 재시도). 429 는 Route
 *   Handler 가 패스스루하고, 훅은 retry: 1 만 수행한다(자체 재시도 루프 없음).
 * - 에피소드 개요/스틸 null: 대체 문구/플레이스홀더로 처리.
 * - 에피소드 빈 배열: 해당 시즌의 에피소드 목록 영역을 숨긴다(칩은 유지해 시즌 전환 가능).
 */
import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { BackdropImage, ErrorState, Skeleton } from "@/src/components/ui";
import type { Episode, Season } from "@/src/lib/tmdb/types";
import { useTvSeason } from "@/src/features/tv-detail/use-tv-season";

interface SeasonSelectorProps {
  tvId: number;
  /** TVDetail.seasons — 시즌 요약 목록(에피소드 상세는 온디맨드 로드). */
  seasons: Season[];
}

/** TMDB 방영일(YYYY-MM-DD) → "YYYY.MM.DD" 표기. 없으면 null(호출부 대체 문구). */
function formatAirDate(date: string | null): string | null {
  if (!date) {
    return null;
  }
  return date.replaceAll("-", ".");
}

/**
 * 기본 선택 시즌을 고른다: 첫 정규 시즌(season_number >= 1), 없으면 첫 항목.
 * TMDB seasons 는 Specials(0)를 앞에 둘 수 있어 정규 시즌을 우선한다.
 * (호출부가 seasons.length > 0 를 보장한다.)
 */
function pickDefaultSeason(seasons: Season[]): number {
  const regular = seasons.find((season) => season.season_number >= 1);
  return (regular ?? seasons[0]).season_number;
}

export function SeasonSelector({ tvId, seasons }: SeasonSelectorProps) {
  const shouldReduceMotion = useReducedMotion();
  const [selected, setSelected] = useState<number>(() =>
    pickDefaultSeason(seasons)
  );

  const seasonQuery = useTvSeason(tvId, selected);

  let episodeContent: ReactNode;
  if (seasonQuery.isPending) {
    episodeContent = <EpisodeListSkeleton />;
  } else if (seasonQuery.isError) {
    episodeContent = (
      <ErrorState
        message="시즌 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
        onRetry={() => {
          void seasonQuery.refetch();
        }}
      />
    );
  } else if (seasonQuery.data.episodes.length === 0) {
    // 에피소드 빈 배열 → 목록 영역 숨김(§4). 칩은 유지된다.
    episodeContent = null;
  } else {
    episodeContent = (
      <ul className="grid grid-cols-1 gap-card-gap md:grid-cols-2 md:gap-card-gap-lg">
        {seasonQuery.data.episodes.map((episode, index) => (
          <motion.li
            key={episode.id}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.25,
              delay: Math.min(index * 0.03, 0.3),
            }}
          >
            <EpisodeCard episode={episode} />
          </motion.li>
        ))}
      </ul>
    );
  }

  return (
    <section
      aria-label="시즌"
      className="mx-auto w-full max-w-page px-gutter md:px-gutter-lg"
    >
      <h2 className="text-h2 text-content-primary">시즌</h2>

      <div
        role="tablist"
        aria-label="시즌 선택"
        className="mt-4 flex flex-wrap gap-2"
      >
        {seasons.map((season) => {
          const isActive = season.season_number === selected;
          return (
            <motion.button
              key={season.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelected(season.season_number)}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              className={`rounded-pill border px-4 py-1.5 text-body-sm font-medium transition-colors ${
                isActive
                  ? "border-brand bg-brand text-base"
                  : "border-border bg-surface text-content-secondary hover:bg-surface-hover"
              }`}
            >
              {season.name}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-6">{episodeContent}</div>
    </section>
  );
}

/** 에피소드 카드 — 스틸(16/9) + 번호·제목 + 방영일 + 개요 요약(§3.4). */
function EpisodeCard({ episode }: { episode: Episode }) {
  const airDate = formatAirDate(episode.air_date);
  const stillAlt = `${episode.episode_number}화 ${episode.name}`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface">
      {/* 스틸 null 은 BackdropImage 내부 플레이스홀더가 처리(§2.9). */}
      <BackdropImage
        path={episode.still_path}
        alt={stillAlt}
        size="w780"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      <div className="flex flex-col gap-1.5 px-4 py-4">
        <div className="flex items-baseline gap-2">
          <span className="text-caption font-semibold text-brand">
            {episode.episode_number}화
          </span>
          {airDate ? (
            <span className="text-caption text-content-muted">{airDate}</span>
          ) : null}
        </div>
        <h3 className="text-h3 text-content-primary">{episode.name}</h3>
        <p className="line-clamp-3 text-body-sm text-content-secondary">
          {episode.overview ? episode.overview : "에피소드 개요가 없습니다."}
        </p>
      </div>
    </article>
  );
}

/** 에피소드 로딩 스켈레톤 — 카드와 동일 종횡비/그리드로 레이아웃 점프 방지(§2.6). */
function EpisodeListSkeleton() {
  return (
    <ul
      className="grid grid-cols-1 gap-card-gap md:grid-cols-2 md:gap-card-gap-lg"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="에피소드를 불러오는 중"
    >
      {Array.from({ length: 4 }, (_, i) => (
        <li
          key={i}
          className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface"
        >
          <Skeleton variant="backdrop" />
          <div className="flex flex-col gap-2 px-4 py-4">
            <Skeleton variant="text" />
            <Skeleton variant="line" />
          </div>
        </li>
      ))}
    </ul>
  );
}
