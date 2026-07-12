import type { Episode } from "@/src/lib/tmdb/types";

/** 회차 선택 UI(모바일 필름스트립/데스크톱 리스트) 공통 props(grilling §Q11). */
export interface EpisodeSelectorProps {
  /** 루트 tablist 요소에 부여할 id — 시즌탭 aria-controls 대상(§Q15). */
  id: string;
  episodes: Episode[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** 각 회차 탭의 aria-controls 대상(백드롭 tabpanel id, §Q15). */
  backdropPanelId: string;
}
