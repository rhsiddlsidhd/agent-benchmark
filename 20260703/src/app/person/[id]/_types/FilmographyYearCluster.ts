import type { FilmographyEntry } from "./FilmographyEntry";

/** 타임라인 레일의 연도별 클러스터 1개(크레딧이 있는 연도만 존재). */
export interface FilmographyYearCluster {
  /** 마커/헤딩에 노출할 연도. */
  year: string;
  /** 해당 연도 작품(과거→현재 오름차순 정렬 순서를 그대로 따름). */
  entries: FilmographyEntry[];
}
