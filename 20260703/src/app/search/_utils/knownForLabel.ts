import type { PersonSearchResult } from "@/src/lib/tmdb/types";

/** 인물 대표작(최대 2편)을 부제로. 없으면 null(줄 자체 생략). */
export function knownForLabel(person: PersonSearchResult): string | null {
  const known = person.known_for;
  if (!known || known.length === 0) {
    return null;
  }
  const titles = known
    .map((item) => (item.media_type === "movie" ? item.title : item.name))
    .filter((title) => title.length > 0)
    .slice(0, 2);
  return titles.length > 0 ? titles.join(", ") : null;
}
