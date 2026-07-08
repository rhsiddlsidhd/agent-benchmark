/** 필모그래피 카드 1건의 표시용 뷰 모델(정렬·중복 제거는 서버에서 완료). */
export interface FilmographyEntry {
  /** 리스트 key 및 중복 제거 키(media_type:id). */
  key: string;
  /** 작품 상세 경로(/movie/[id] | /tv/[id]). */
  href: string;
  /** 작품 제목(영화 title | TV name). */
  title: string;
  /** TMDB poster_path (null 이면 플레이스홀더). */
  posterPath: string | null;
  /** 개봉/방영 연도(없으면 null → 카드가 대체 문구). */
  year: string | null;
  /** vote_average (0 이하이면 카드가 배지 생략). */
  rating: number | null;
}
