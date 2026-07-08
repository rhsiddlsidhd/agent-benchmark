import type { Movie, TVShow } from "@/src/lib/tmdb/types";
import { yearOf } from "@/src/utils";
import type { CardData } from "../_types";

/**
 * discover 아이템(Movie | TVShow)을 카드 데이터로 정규화한다. `"title" in item` 으로
 * Movie/TVShow 를 좁혀(as 단언 없이) 타입별 제목·날짜·상세 경로를 매핑한다.
 */
export function toCardData(item: Movie | TVShow): CardData {
  if ("title" in item) {
    return {
      id: item.id,
      href: `/movie/${item.id}`,
      title: item.title,
      posterPath: item.poster_path,
      year: yearOf(item.release_date),
      rating: item.vote_average,
    };
  }
  return {
    id: item.id,
    href: `/tv/${item.id}`,
    title: item.name,
    posterPath: item.poster_path,
    year: yearOf(item.first_air_date),
    rating: item.vote_average,
  };
}
