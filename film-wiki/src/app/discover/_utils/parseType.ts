import type { MediaType } from "@/src/lib/tmdb/types";
import { firstValue } from "./firstValue";

/** type 파라미터를 movie/tv 로 검증(그 외/누락은 movie 기본). */
export function parseType(value: string | string[] | undefined): MediaType {
  return firstValue(value) === "tv" ? "tv" : "movie";
}
