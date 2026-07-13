import type { FilmographyYearCluster } from "./FilmographyYearCluster";
import type { FilmographyEntry } from "./FilmographyEntry";

export interface FilmographyProps {
  /** 크레딧이 있는 연도 클러스터(과거→현재 오름차순). */
  clusters: FilmographyYearCluster[];
  /** 개봉/방영일 미정(예정) 작품 버킷. */
  upcoming: FilmographyEntry[];
}
