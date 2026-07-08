/** 러닝타임(분) → "N시간 M분" 표기. 없거나 0 이하이면 null(호출부에서 대체 문구). */
export function formatRuntime(runtime: number | null): string | null {
  if (runtime === null || runtime <= 0) {
    return null;
  }
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  if (hours > 0) {
    return `${hours}시간`;
  }
  return `${minutes}분`;
}
