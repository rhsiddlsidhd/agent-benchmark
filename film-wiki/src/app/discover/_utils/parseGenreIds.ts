import type { Genre } from "@/src/lib/tmdb/types";
import { firstValue } from "./firstValue";

/** genres 파라미터를 파싱해 주어진 장르 목록에 존재하는 양의 정수 id 만 남긴다. */
export function parseGenreIds(
  value: string | string[] | undefined,
  genres: Genre[],
): number[] {
  const valid = new Set(genres.map((genre) => genre.id));
  return (firstValue(value) ?? "")
    .split(",")
    .map((token) => Number(token.trim()))
    .filter((id) => Number.isInteger(id) && valid.has(id));
}
