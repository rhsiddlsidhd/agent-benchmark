import type { TVShow } from "@/src/lib/tmdb/types";
import { yearOf } from "@/src/utils";
import type { CardItem } from "../_types";

/** 인기 TV → CardItem. */
export function tvToCard(show: TVShow): CardItem {
  return {
    href: `/tv/${show.id}`,
    title: show.name,
    posterPath: show.poster_path,
    year: yearOf(show.first_air_date),
    rating: show.vote_average,
    adult: show.adult,
  };
}
