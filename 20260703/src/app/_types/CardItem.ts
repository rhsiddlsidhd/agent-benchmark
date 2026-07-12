/** 캐러셀 카드로 정규화한 뷰 모델(영화/TV 공통). */
export interface CardItem {
  href: string;
  title: string;
  posterPath: string | null;
  year: string | null;
  rating: number;
  adult: boolean;
}
