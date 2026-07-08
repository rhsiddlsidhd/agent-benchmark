import type { FilmographyEntry } from "./FilmographyEntry";

export interface FilmographyProps {
  /** 출연작(최신순 정렬·중복 제거 완료). */
  castEntries: FilmographyEntry[];
  /** 제작 참여작(최신순 정렬·중복 제거 완료). */
  crewEntries: FilmographyEntry[];
}
