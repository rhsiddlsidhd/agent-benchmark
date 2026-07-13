/**
 * 회차가 아직 방영되지 않았는지 판단한다(air_date 가 오늘 이후).
 * air_date 결측(null)은 미방영 확정이 아니라 데이터 결측이므로 방영예정으로 간주하지 않는다(§2.9).
 */
export function isUpcomingEpisode(airDate: string | null): boolean {
  if (!airDate) return false;
  return new Date(airDate) > new Date();
}
