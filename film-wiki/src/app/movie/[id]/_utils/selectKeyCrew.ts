import type { CrewMember } from "@/src/lib/tmdb/types";
import { KEY_CREW_JOBS } from "../_constants";
import type { KeyCrewPerson } from "../_types";

/** crew 배열에서 주요 직무만 인물 단위로 병합(감독 우선 정렬). */
export function selectKeyCrew(crew: CrewMember[]): KeyCrewPerson[] {
  const byPerson = new Map<number, KeyCrewPerson>();
  for (const member of crew) {
    if (!KEY_CREW_JOBS.includes(member.job)) {
      continue;
    }
    const existing = byPerson.get(member.id);
    if (existing) {
      if (!existing.jobs.includes(member.job)) {
        existing.jobs.push(member.job);
      }
    } else {
      byPerson.set(member.id, {
        id: member.id,
        name: member.name,
        profilePath: member.profile_path,
        jobs: [member.job],
      });
    }
  }
  // 감독을 먼저 노출(Director 포함 인물 우선).
  return [...byPerson.values()].sort(
    (a, b) =>
      Number(b.jobs.includes("Director")) - Number(a.jobs.includes("Director")),
  );
}
