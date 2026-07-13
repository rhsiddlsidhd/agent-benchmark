/**
 * 로컬(10개 단위) 리뷰 페이지 번호를 TMDB 리뷰 API 페이지(20개 단위) 번호로
 * 변환한다. 로컬 1~2 → TMDB 1, 로컬 3~4 → TMDB 2, ...
 */
export function localPageToTmdbPage(localPage: number): number {
  return Math.ceil(localPage / 2);
}
