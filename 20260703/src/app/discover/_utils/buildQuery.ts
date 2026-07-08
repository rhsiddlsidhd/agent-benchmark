import type { MediaType } from "@/src/lib/tmdb/types";

/**
 * 현재 URL 파라미터를 보존한 채 type/genres 만 병합해 `?...` 쿼리 문자열로 직렬화한다.
 * AdultContentContext 가 관리하는 `adult` 등 다른 파라미터를 덮어쓰지 않도록,
 * 프레시하게 만들지 않고 window.location.search 를 기반으로 갱신한다(FR-7 상태 유지).
 */
export function buildQuery(type: MediaType, genreIds: number[]): string {
  const params = new URLSearchParams(window.location.search);
  params.set("type", type);
  if (genreIds.length > 0) {
    params.set("genres", genreIds.join(","));
  } else {
    params.delete("genres");
  }
  return params.toString();
}
