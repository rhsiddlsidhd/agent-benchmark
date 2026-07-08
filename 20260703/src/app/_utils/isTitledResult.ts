import type {
  MovieSearchResult,
  MultiSearchResult,
  TVSearchResult,
} from "@/src/lib/tmdb/types";

/** 트렌딩(multi) 결과에서 포스터/제목이 있는 영화·TV 만 취한다(인물 제외). */
export function isTitledResult(
  item: MultiSearchResult
): item is MovieSearchResult | TVSearchResult {
  return item.media_type === "movie" || item.media_type === "tv";
}
