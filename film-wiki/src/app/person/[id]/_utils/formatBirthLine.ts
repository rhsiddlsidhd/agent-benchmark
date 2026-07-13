import type { PersonDetail } from "@/src/lib/tmdb/types";

/** 생년월일·출생지를 한 줄로 결합. 둘 다 없으면 null(§2.9 결측 → 줄 생략). */
export function formatBirthLine(person: PersonDetail): string | null {
  const parts: string[] = [];
  if (person.birthday) {
    parts.push(person.birthday);
  }
  if (person.place_of_birth) {
    parts.push(person.place_of_birth);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}
