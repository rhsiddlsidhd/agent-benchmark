import type { FilmographyEntry } from "./FilmographyEntry";

/** normalizeCredits 결과 — 개봉/방영일 유무로 분리된 병합 엔트리. */
export interface NormalizedCredits {
  /** 개봉/방영일이 있는 작품(과거→현재 오름차순 정렬 완료). */
  dated: FilmographyEntry[];
  /** 개봉/방영일이 없는 작품(예정/미공개, 정렬 없음). */
  undated: FilmographyEntry[];
}
