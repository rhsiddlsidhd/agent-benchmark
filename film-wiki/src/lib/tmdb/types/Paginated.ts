/** TMDB 페이지네이션 응답 래퍼. */
export interface Paginated<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}
