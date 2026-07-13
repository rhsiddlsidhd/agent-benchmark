import type { Review } from "@/src/lib/tmdb/types";
import { REVIEW_PAGE_SIZE } from "../_constants";

/**
 * TMDB 응답(20개)에서 로컬 페이지(10개)에 해당하는 절반을 잘라낸다.
 * 홀수 로컬 페이지는 앞 10개, 짝수 로컬 페이지는 뒤 10개.
 */
export function sliceReviewsForLocalPage(
  tmdbResults: Review[],
  localPage: number
): Review[] {
  const isFirstHalf = localPage % 2 === 1;
  const start = isFirstHalf ? 0 : REVIEW_PAGE_SIZE;
  return tmdbResults.slice(start, start + REVIEW_PAGE_SIZE);
}
