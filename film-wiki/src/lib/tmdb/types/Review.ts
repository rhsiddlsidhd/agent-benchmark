import type { ReviewAuthorDetails } from "./ReviewAuthorDetails";

/** TMDB 사용자 리뷰. */
export interface Review {
  id: string;
  author: string;
  author_details: ReviewAuthorDetails;
  content: string;
  created_at: string;
  updated_at: string;
  url: string;
}
