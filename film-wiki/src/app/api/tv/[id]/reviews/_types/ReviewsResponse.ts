import type { Paginated, Review } from "@/src/lib/tmdb/types";

/** `/api/tv/[id]/reviews` 성공 응답 = TMDB `getTvReviews` 결과를 그대로 전달. */
export type ReviewsResponse = Paginated<Review>;
