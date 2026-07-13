/** 날짜 문자열에서 연도만 추출. 빈 문자열이면 null(§2.9 결측). */
export function yearOf(date: string): string | null {
  return date ? date.slice(0, 4) : null;
}
