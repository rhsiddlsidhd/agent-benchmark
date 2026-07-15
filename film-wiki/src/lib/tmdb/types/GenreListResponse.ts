import type { Genre } from "./Genre";

/** genre/{type}/list 응답 래퍼. */
export interface GenreListResponse {
  genres: Genre[];
}
