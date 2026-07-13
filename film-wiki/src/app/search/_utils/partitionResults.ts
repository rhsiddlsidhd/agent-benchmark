import type {
  MovieSearchResult,
  MultiSearchResult,
  PersonSearchResult,
  TVSearchResult,
} from "@/src/lib/tmdb/types";

/** media_type 판별자로 결과를 3개 타입으로 분리(유니온 내로잉, as 단언 없음). */
export function partitionResults(results: MultiSearchResult[]): {
  movies: MovieSearchResult[];
  tv: TVSearchResult[];
  people: PersonSearchResult[];
} {
  const movies: MovieSearchResult[] = [];
  const tv: TVSearchResult[] = [];
  const people: PersonSearchResult[] = [];

  for (const item of results) {
    if (item.media_type === "movie") {
      movies.push(item);
    } else if (item.media_type === "tv") {
      tv.push(item);
    } else {
      people.push(item);
    }
  }

  return { movies, tv, people };
}
