"use client";

/**
 * SeasonSelector — TV 시즌 선택 + 백드롭 크로스페이드 + 회차 선택 조립
 * (03_DESIGN §3.4, FR-4, grilling 결과: 시즌/에피소드 UI 개편 + 2열 레이아웃 §Q1~Q17).
 *
 * 시즌 전환은 인터랙티브하므로 Client Component 로 분리하고, 선택된 시즌만
 * `useTvSeason`(→ `/api/tv/[id]/season/[n]`)으로 온디맨드 조회한다(ADR-0003 —
 * 인터랙티브 페치는 Route Handler 경유). 시즌 목록(`TVDetail.seasons`)은 서버에서
 * 이미 받은 값을 props 로 받아 칩을 그리고, 에피소드 상세는 선택 시점에만 가져온다.
 *
 * 레이아웃(§Q2/Q6/Q9): 시즌 필 탭은 항상 섹션 맨 위 고정 위치. 그 아래 회차
 * 선택+백드롭은 뷰포트에 따라 컨테이너가 통째로 갈린다 — `md`(768px) 이상에선
 * 좌측 세로 리스트(`EpisodeList`) + 우측 백드롭 2열 그리드, 미만에선 기존처럼
 * 백드롭 위 + 가로 필름스트립(`EpisodeFilmstrip`, ScrollRail 재사용) 아래로 스택.
 * 마운트 전(`useMediaQuery` 가 아직 판별 못한 상태)엔 모바일 스택 + 스켈레톤으로
 * 취급한다(§Q5, 깜빡임 대신 로딩 프레임 하나 추가하는 쪽 선택).
 *
 * a11y(§Q14/Q15/Q16): 시즌탭 선택 → 회차 목록이 바뀌고, 회차탭 선택 → 백드롭이
 * 바뀌는 2단 구조라 `aria-controls`도 체이닝된다(시즌탭→회차 tablist id,
 * 회차탭→백드롭 tabpanel id). 화살표 키 이동은 `useRovingTabIndex`(roving
 * tabindex, WAI-ARIA APG Tabs 패턴)로 시즌탭/필름스트립/리스트 3곳이 공유한다.
 *
 * 에러/엣지케이스(§4):
 * - 로딩 중: 백드롭 영역은 Skeleton(backdrop), 회차 선택 영역은 레이아웃에 맞는
 *   스켈레톤(`EpisodeFilmstripSkeleton`/`EpisodeListSkeleton`, §Q12).
 * - fetch 실패(404/429/5xx/네트워크): 백드롭 영역에 ErrorState(refetch 재시도).
 *   429 는 Route Handler 가 패스스루하고, 훅은 retry: 1 만 수행한다.
 * - 에피소드 개요 null: 대체 문구로 처리.
 * - 에피소드 빈 배열: 백드롭 영역에 EmptyState. 시즌 탭은 계속 클릭 가능(disabled
 *   처리 안 함).
 */
import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  BackdropImage,
  EmptyState,
  ErrorState,
  Skeleton,
} from "@/src/components/ui";
import { cn } from "@/src/lib/clsx/merge";
import type { Episode, Season } from "@/src/lib/tmdb/types";
import { useMediaQuery, useRovingTabIndex, useTvSeason } from "../_hooks";
import type { SeasonSelectorProps } from "../_types";
import { EpisodeFilmstrip } from "./EpisodeFilmstrip";
import { EpisodeFilmstripSkeleton } from "./EpisodeFilmstripSkeleton";
import { EpisodeList } from "./EpisodeList";
import { EpisodeListSkeleton } from "./EpisodeListSkeleton";

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
  const isDesktop = useMediaQuery("(min-width: 768px)") === true;
  const backdropPanelId = useId();
  const episodeTablistId = useId();

  const [selectedSeason, setSelectedSeason] = useState<number>(() =>
    pickDefaultSeason(seasons),
  );
  const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState(0);
  // 시즌 전환 시 항상 1화(첫 에피소드)로 리셋 — 이전 선택 유지 시도 안 함. 렌더 중
  // 비교해 즉시 재설정하는 파생 상태 패턴(effect 로 인한 추가 렌더 회피).
  const [episodeResetSeason, setEpisodeResetSeason] = useState(selectedSeason);
  if (selectedSeason !== episodeResetSeason) {
    setEpisodeResetSeason(selectedSeason);
    setSelectedEpisodeIndex(0);
  }

  const seasonTabRoving = useRovingTabIndex<HTMLButtonElement>({
    count: seasons.length,
    activeIndex: seasons.findIndex(
      (season) => season.season_number === selectedSeason,
    ),
    onSelect: (index) => setSelectedSeason(seasons[index].season_number),
    orientation: "horizontal",
  });

  const seasonQuery = useTvSeason(tvId, selectedSeason);

  let backdropContent: ReactNode;
  let episodeAreaContent: ReactNode;

  if (seasonQuery.isPending) {
    backdropContent = <Skeleton variant="backdrop" className="h-full" />;
    episodeAreaContent = isDesktop ? (
      <EpisodeListSkeleton />
    ) : (
      <EpisodeFilmstripSkeleton />
    );
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
    episodeAreaContent = null;
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
    episodeAreaContent = null;
  } else {
    const episodes = seasonQuery.data.episodes;
    const activeEpisode = episodes[selectedEpisodeIndex] ?? episodes[0];

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

    const EpisodeSelectorView = isDesktop ? EpisodeList : EpisodeFilmstrip;
    episodeAreaContent = (
      <EpisodeSelectorView
        id={episodeTablistId}
        episodes={episodes}
        selectedIndex={selectedEpisodeIndex}
        onSelect={setSelectedEpisodeIndex}
        backdropPanelId={backdropPanelId}
      />
    );
  }

  // 데스크톱 2열에선 backdrop 높이를 aspect-video 대신 grid row 확정 높이(h-full)로
  // 받는다 — grid 'auto' row는 두 아이템 중 큰 쪽(list 의 natural content 높이)에
  // 맞춰 늘어나서 overflow-y-auto 만으론 list 를 backdrop 높이에 못 맞춘다(§Q7 정정,
  // grid는 컨테이너 자체가 확정 높이를 가져야 fr/stretch 가 내용대로 안 늘어남).
  const backdropPanel = (
    <div
      id={backdropPanelId}
      role="tabpanel"
      aria-label="선택 회차"
      className={cn(
        "relative w-full overflow-hidden bg-surface",
        isDesktop ? "h-full" : "mt-4 aspect-video",
      )}
    >
      {backdropContent}
    </div>
  );

  return (
    <section aria-label="시즌" className="mx-auto w-full max-w-page">
      <div
        role="tablist"
        aria-label="시즌 선택"
        className="mx-auto flex w-full max-w-page flex-wrap gap-2 px-gutter md:px-gutter-lg"
      >
        {seasons.map((season, index) => {
          const isActive = season.season_number === selectedSeason;
          return (
            <motion.button
              key={season.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={episodeTablistId}
              onClick={() => setSelectedSeason(season.season_number)}
              {...seasonTabRoving.getTabProps(index)}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              className={cn(
                "rounded-pill border px-4 py-1.5 text-body-sm font-medium transition-colors",
                isActive
                  ? "border-brand bg-brand text-base"
                  : "border-border bg-surface text-content-secondary hover:bg-surface-hover",
              )}
            >
              {season.name}
            </motion.button>
          );
        })}
      </div>

      {isDesktop ? (
        <div className="mt-4 grid h-[38svh] grid-cols-[minmax(260px,2fr)_3fr] gap-4 md:gap-6">
          {episodeAreaContent}
          {backdropPanel}
        </div>
      ) : (
        <>
          {backdropPanel}
          <div className="mt-4">{episodeAreaContent}</div>
        </>
      )}
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
        sizes="(min-width: 768px) 60vw, 100vw"
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
