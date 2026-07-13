/** `/api/movie/[id]/reviews` 실패 응답(400/429/5xx 패스스루 및 서버 오류 시). */
export interface ReviewsErrorResponse {
  error: string;
}
