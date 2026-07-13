import type { FilmographyProps, NormalizedCredits } from "../_types";

/**
 * `normalizeCredits` 결과를 타임라인 레일 렌더용 형태로 변환한다.
 * - `dated`(과거→현재 오름차순 정렬 완료)를 연도별로 그룹핑한다. 크레딧이 있는
 *   연도만 클러스터가 생기므로(공백 연도 건너뜀), 레일 마커는 시간축 비례 없이
 *   클러스터 개수만큼 균등 간격으로 렌더된다(렌더 책임은 컴포넌트).
 * - `undated`는 그대로 "예정" 버킷(`upcoming`)으로 전달한다.
 */
export function groupFilmographyEntries({
  dated,
  undated,
}: NormalizedCredits): FilmographyProps {
  const clusters: FilmographyProps["clusters"] = [];
  const clusterByYear = new Map<string, (typeof clusters)[number]>();

  for (const entry of dated) {
    // dated 엔트리는 항상 year 가 존재한다(normalizeCredits 가 undated 로 분리).
    // 방어적 가드로 타입을 좁힌다(as 단언 대신 제어 흐름 narrowing).
    if (entry.year === null) {
      continue;
    }
    const year = entry.year;
    let cluster = clusterByYear.get(year);
    if (!cluster) {
      cluster = { year, entries: [] };
      clusterByYear.set(year, cluster);
      clusters.push(cluster);
    }
    cluster.entries.push(entry);
  }

  return { clusters, upcoming: undated };
}
