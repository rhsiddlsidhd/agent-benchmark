import type { MovieSearchResult, TVSearchResult } from "@/src/lib/tmdb/types";
import { yearOf } from "@/src/utils";
import type { CardItem } from "../_types";

/** 트렌딩 영화/TV 결과 → CardItem. media_type 으로 title/name·경로 분기. */
export function trendingToCard(
  item: MovieSearchResult | TVSearchResult
): CardItem {
  if (item.media_type === "movie") {
    return {
      href: `/movie/${item.id}`,
      title: item.title,
      posterPath: item.poster_path,
      year: yearOf(item.release_date),
      rating: item.vote_average,
    };
  }
  return {
    href: `/tv/${item.id}`,
    title: item.name,
    posterPath: item.poster_path,
    year: yearOf(item.first_air_date),
    rating: item.vote_average,
  };
}
