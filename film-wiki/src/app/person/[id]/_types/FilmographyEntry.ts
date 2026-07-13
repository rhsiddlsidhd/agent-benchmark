import type { FilmographyRoleDetail } from "./FilmographyRoleDetail";

/** 필모그래피 카드 1건의 표시용 뷰 모델(병합·정렬은 서버에서 완료). */
export interface FilmographyEntry {
  /** 리스트 key 및 병합 키(media_type:id). */
  key: string;
  /** 작품 상세 경로(/movie/[id] | /tv/[id]). */
  href: string;
  /** 작품 제목(영화 title | TV name). */
  title: string;
  /** TMDB poster_path (null 이면 플레이스홀더). */
  posterPath: string | null;
  /** 개봉/방영 연도(없으면 null → "예정" 버킷 대상). */
  year: string | null;
  /** vote_average (0 이하이면 카드가 배지 생략). */
  rating: number | null;
  /** 카드 상시 노출 배지(cast="출연", crew=구체 job명, 중복 없이 누적). */
  badges: string[];
  /** hover/tap 툴팁 전용 상세(캐릭터명/구체 job명). 상시 노출 금지. */
  roleDetail: FilmographyRoleDetail;
}
