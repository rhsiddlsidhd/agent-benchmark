/**
 * TV 회차 러닝타임 후보(episode_run_time)에서 대표값을 고른다.
 * TMDB 가 여러 값을 줄 수 있어 첫 양수 값을 사용, 없으면 null(§2.9 결측).
 */
export function pickEpisodeRuntime(runtimes: number[]): number | null {
  for (const value of runtimes) {
    if (value > 0) {
      return value;
    }
  }
  return null;
}
