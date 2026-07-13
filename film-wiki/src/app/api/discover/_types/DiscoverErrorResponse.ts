/** `/api/discover` 실패 응답(400 검증 실패 및 429/5xx 패스스루). */
export interface DiscoverErrorResponse {
  error: string;
}
