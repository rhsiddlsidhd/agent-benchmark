"use client";

/**
 * EpisodeList — 데스크톱 세로 회차 선택 리스트(grilling §Q1/Q9/Q10/Q11).
 * 백드롭과 나란히 2열로 배치되는 좌측 컬럼. 부모(`SeasonSelector`)가 grid row에
 * 확정 높이(`h-[38svh]`)를 주므로 루트 `<ul>`의 `overflow-y-auto`가 그 안에서만
 * 스크롤된다(§Q7 정정 — grid 'auto' row는 내용이 큰 아이템에 맞춰 늘어나 버려서
 * `overflow-y-auto` 만으론 못 가두고, 컨테이너 자체가 확정 높이를 가져야 함).
 * 활성 표시는 필름스트립과 달리 scale 트랜스폼 없이 배경 하이라이트 + 썸네일
 * border 로만 한다(§Q10 — 세로로 촘촘히 쌓인 행이라 scale 시 이웃 행과 겹칠 수 있어서).
 */
import { BackdropImage } from "@/src/components/ui";
import { useRovingTabIndex } from "../_hooks";
import { isUpcomingEpisode } from "../_utils";
import type { EpisodeSelectorProps } from "../_types";

export function EpisodeList({
  id,
  episodes,
  selectedIndex,
  onSelect,
  backdropPanelId,
}: EpisodeSelectorProps) {
  const { getTabProps } = useRovingTabIndex<HTMLButtonElement>({
    count: episodes.length,
    activeIndex: selectedIndex,
    onSelect,
    orientation: "vertical",
  });

  return (
    <ul
      id={id}
      role="tablist"
      aria-label="회차 선택"
      aria-orientation="vertical"
      className="scrollbar-hide flex h-full flex-col gap-1 overflow-y-auto"
    >
      {episodes.map((episode, index) => {
        const isActive = index === selectedIndex;
        return (
          <li key={episode.id}>
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={backdropPanelId}
              onClick={() => onSelect(index)}
              {...getTabProps(index)}
              className={`flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition-colors ${
                isActive ? "bg-surface-hover" : "hover:bg-surface-hover/60"
              }`}
            >
              <div
                className={`relative w-24 shrink-0 overflow-hidden rounded-md border-2 ${
                  isActive ? "border-brand" : "border-transparent"
                }`}
              >
                <BackdropImage
                  path={episode.still_path}
                  alt={`에피소드 ${episode.episode_number}화`}
                  size="w780"
                  sizes="96px"
                />
                {isUpcomingEpisode(episode.air_date) && (
                  <span className="absolute inset-0 flex items-center justify-center bg-base/40">
                    <span className="rounded-full bg-brand px-1.5 py-0.5 text-caption font-semibold text-base">
                      방영예정
                    </span>
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-caption font-semibold text-brand">
                  {episode.episode_number}화
                </span>
                <p className="truncate text-body-sm text-content-primary">
                  {episode.name}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
