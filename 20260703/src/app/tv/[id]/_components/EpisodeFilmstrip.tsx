"use client";

/**
 * EpisodeFilmstrip — 모바일 가로 회차 선택(ScrollRail 재사용, grilling §Q2/Q11).
 * 데스크톱 세로 리스트(`EpisodeList`)의 모바일 대응 버전 — 동일 데이터/선택 콜백을
 * 받아 가로 드래그스크롤 필름스트립으로 렌더한다.
 *
 * `ScrollRail`이 tablist(이 컴포넌트의 루트 div) 와 실제 tab 버튼 사이에
 * 자체 래퍼(drag-scroll 트랙)를 끼워 넣어 DOM상 인접하지 않으므로, `aria-owns`로
 * 논리적 소유관계를 명시한다(기존 필름스트립 수정 이력, `aria-owns` 복원 커밋과 동일 이유).
 */
import { BackdropImage, ScrollRail } from "@/src/components/ui";
import { cn } from "@/src/lib/clsx/merge";
import { useRovingTabIndex } from "../_hooks";
import { isUpcomingEpisode } from "../_utils";
import type { EpisodeSelectorProps } from "../_types";

export function EpisodeFilmstrip({
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
    orientation: "horizontal",
  });

  return (
    <div
      id={id}
      role="tablist"
      aria-label="회차 선택"
      aria-owns={episodes.map((episode) => `episode-tab-${episode.id}`).join(" ")}
    >
      <ScrollRail>
        {episodes.map((episode, index) => {
          const isActive = index === selectedIndex;
          return (
            <li key={episode.id}>
              <button
                type="button"
                id={`episode-tab-${episode.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={backdropPanelId}
                onClick={() => onSelect(index)}
                draggable={false}
                {...getTabProps(index)}
                className={cn(
                  "relative block w-full overflow-hidden rounded-lg border-2 transition-transform",
                  isActive ? "border-brand scale-105" : "border-transparent",
                )}
              >
                <BackdropImage
                  path={episode.still_path}
                  alt={`에피소드 ${episode.episode_number}화`}
                  size="w780"
                  sizes="(max-width: 640px) 42vw, (max-width: 768px) 29vw, (max-width: 1024px) 22vw, (max-width: 1280px) 15.5vw, 13.2vw"
                />
                {isUpcomingEpisode(episode.air_date) && (
                  <span className="absolute inset-0 flex items-center justify-center bg-base/40">
                    <span className="rounded-full bg-brand px-2 py-0.5 text-caption font-semibold text-base">
                      방영예정
                    </span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ScrollRail>
    </div>
  );
}
