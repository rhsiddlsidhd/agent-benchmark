import type { Paginated, Review } from "@/src/lib/tmdb/types";

/** `/api/movie/[id]/reviews` 성공 응답 = TMDB `getMovieReviews` 결과를 그대로 전달. */
export type ReviewsResponse = Paginated<Review>;
