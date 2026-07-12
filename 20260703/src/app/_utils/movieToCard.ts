import type { Movie } from "@/src/lib/tmdb/types";
import { yearOf } from "@/src/utils";
import type { CardItem } from "../_types";

/** 인기 영화 → CardItem. */
export function movieToCard(movie: Movie): CardItem {
  return {
    href: `/movie/${movie.id}`,
    title: movie.title,
    posterPath: movie.poster_path,
    year: yearOf(movie.release_date),
    rating: movie.vote_average,
    adult: movie.adult,
  };
}
