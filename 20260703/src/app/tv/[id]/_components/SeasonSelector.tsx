"use client";

/**
 * SeasonSelector — TV 시즌 선택 + 백드롭 크로스페이드 + 회차 필름스트립
 * (03_DESIGN §3.4, FR-4, grilling 결과: 시즌/에피소드 UI 개편).
 *
 * 시즌 전환은 인터랙티브하므로 Client Component 로 분리하고, 선택된 시즌만
 * `useTvSeason`(→ `/api/tv/[id]/season/[n]`)으로 온디맨드 조회한다(ADR-0003 —
 * 인터랙티브 페치는 Route Handler 경유). 시즌 목록(`TVDetail.seasons`)은 서버에서
 * 이미 받은 값을 props 로 받아 칩을 그리고, 에피소드 상세는 선택 시점에만 가져온다.
 *
 * 레이아웃: 선택 회차 스틸을 풀블리드 백드롭(히어로와 동일 그라데이션 스크림)으로
 * 표시하고, 그 아래 시즌 필 탭 + 회차 필름스트립(ScrollRail 재사용)을 둔다. 회차
 * 선택은 필름스트립 클릭으로 이뤄지며 백드롭이 크로스페이드로 전환된다. 시즌을
 * 바꾸면 항상 새 시즌의 1화로 자동 리셋한다(이전 선택 유지 시도 안 함).
 *
 * 에러/엣지케이스(§4):
 * - 로딩 중: 백드롭 영역은 Skeleton(backdrop), 필름스트립은 스켈레톤 썸네일.
 * - fetch 실패(404/429/5xx/네트워크): 백드롭 영역에 ErrorState(refetch 재시도).
 *   429 는 Route Handler 가 패스스루하고, 훅은 retry: 1 만 수행한다.
 * - 에피소드 개요 null: 대체 문구로 처리.
 * - 에피소드 빈 배열: 백드롭 영역에 EmptyState. 시즌 탭은 계속 클릭 가능(disabled
 *   처리 안 함).
 */
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  BackdropImage,
  EmptyState,
  ErrorState,
  ScrollRail,
  Skeleton,
} from "@/src/components/ui";
import type { Episode, Season } from "@/src/lib/tmdb/types";
import { useTvSeason } from "../_hooks";
import type { SeasonSelectorProps } from "../_types";

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
  const [selectedSeason, setSelectedSeason] = useState<number>(() =>
    pickDefaultSeason(seasons)
  );
  const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState(0);
  // 시즌 전환 시 항상 1화(첫 에피소드)로 리셋 — 이전 선택 유지 시도 안 함. 렌더 중
  // 비교해 즉시 재설정하는 파생 상태 패턴(effect 로 인한 추가 렌더 회피).
  const [episodeResetSeason, setEpisodeResetSeason] = useState(selectedSeason);
  if (selectedSeason !== episodeResetSeason) {
    setEpisodeResetSeason(selectedSeason);
    setSelectedEpisodeIndex(0);
  }

  const seasonQuery = useTvSeason(tvId, selectedSeason);

  let backdropContent: ReactNode;
  let filmstripContent: ReactNode;

  if (seasonQuery.isPending) {
    backdropContent = <Skeleton variant="backdrop" className="h-full" />;
    filmstripContent = <FilmstripSkeleton />;
  } else if (seasonQuery.isError) {
    backdropContent = (
      <div className="flex h-full w-full items-center justify-center">
        <ErrorState
          message="시즌 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
          onRetry={() => {
            void seasonQuery.refetch();
          }}
        />
      </div>
    );
    filmstripContent = null;
  } else if (seasonQuery.data.episodes.length === 0) {
    // 에피소드 빈 배열 → 백드롭 영역에 EmptyState(§4). 시즌 탭은 유지된다.
    backdropContent = (
      <div className="flex h-full w-full items-center justify-center">
        <EmptyState
          title="에피소드 정보가 없습니다"
          message="이 시즌에는 표시할 에피소드가 없습니다."
        />
      </div>
    );
    filmstripContent = null;
  } else {
    const episodes = seasonQuery.data.episodes;
    const activeEpisode =
      episodes[selectedEpisodeIndex] ?? episodes[0];

    backdropContent = shouldReduceMotion ? (
      <div className="absolute inset-0">
        <EpisodeBackdropPanel episode={activeEpisode} />
      </div>
    ) : (
      <AnimatePresence mode="sync">
        <motion.div
          key={activeEpisode.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <EpisodeBackdropPanel episode={activeEpisode} />
        </motion.div>
      </AnimatePresence>
    );

    filmstripContent = (
      <div
        role="tablist"
        aria-label="회차 선택"
        aria-owns={episodes
          .map((episode) => `episode-tab-${episode.id}`)
          .join(" ")}
      >
        <ScrollRail>
          {episodes.map((episode, index) => {
            const isActive = index === selectedEpisodeIndex;
            return (
              <li key={episode.id}>
                <button
                  type="button"
                  id={`episode-tab-${episode.id}`}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedEpisodeIndex(index)}
                  className={`block overflow-hidden rounded-lg border-2 transition-transform ${
                    isActive ? "border-brand scale-105" : "border-transparent"
                  }`}
                >
                  <BackdropImage
                    path={episode.still_path}
                    alt={`${episode.episode_number}화 ${episode.name}`}
                    size="w780"
                    sizes="(max-width: 640px) 42vw, (max-width: 768px) 29vw, (max-width: 1024px) 22vw, (max-width: 1280px) 15.5vw, 13.2vw"
                  />
                </button>
              </li>
            );
          })}
        </ScrollRail>
      </div>
    );
  }

  return (
    <section aria-label="시즌" className="w-full">
      <h2 className="mx-auto w-full max-w-page px-gutter text-h2 text-content-primary md:px-gutter-lg">
        시즌
      </h2>

      {/* 풀블리드 백드롭(히어로와 동일 종횡비/스크림). */}
      <div className="relative mt-4 aspect-video w-full overflow-hidden bg-surface">
        {backdropContent}
      </div>

      <div
        role="tablist"
        aria-label="시즌 선택"
        className="mx-auto mt-6 flex w-full max-w-page flex-wrap gap-2 px-gutter md:px-gutter-lg"
      >
        {seasons.map((season) => {
          const isActive = season.season_number === selectedSeason;
          return (
            <motion.button
              key={season.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelectedSeason(season.season_number)}
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

      <div className="mt-4">{filmstripContent}</div>
    </section>
  );
}

/** 백드롭 이미지 + 스크림 + 회차번호·제목·개요 오버레이(선택 회차 탭패널). */
function EpisodeBackdropPanel({ episode }: { episode: Episode }) {
  return (
    <>
      <BackdropImage
        path={episode.still_path}
        alt={`${episode.episode_number}화 ${episode.name}`}
        size="w1280"
        sizes="100vw"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-base via-base/60 to-transparent"
      />
      <div
        aria-live="polite"
        className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-page px-gutter pb-4 md:px-gutter-lg md:pb-6"
      >
        <span className="text-caption font-semibold text-brand">
          {episode.episode_number}화
        </span>
        <h3 className="text-h3 text-content-primary">{episode.name}</h3>
        <p className="line-clamp-3 max-w-2xl text-body-sm text-content-secondary">
          {episode.overview ? episode.overview : "에피소드 개요가 없습니다."}
        </p>
      </div>
    </>
  );
}

/** 필름스트립 로딩 스켈레톤 — ScrollRail 트랙과 동일 폭 클래스로 레이아웃 점프 방지(§2.6). */
function FilmstripSkeleton() {
  return (
    <ul
      className="flex gap-card-gap overflow-hidden px-gutter py-2 md:gap-card-gap-lg md:px-gutter-lg"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="회차를 불러오는 중"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <li
          key={i}
          className="w-[42%] shrink-0 sm:w-[29%] md:w-[22%] lg:w-[15.5%] xl:w-[13.2%]"
        >
          <Skeleton variant="backdrop" />
        </li>
      ))}
    </ul>
  );
}
