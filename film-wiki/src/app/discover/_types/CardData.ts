/** ContentCard 에 넘길 정규화된 카드 데이터. */
export interface CardData {
  id: number;
  href: string;
  title: string;
  posterPath: string | null;
  year: string | null;
  rating: number;
  adult: boolean;
}
