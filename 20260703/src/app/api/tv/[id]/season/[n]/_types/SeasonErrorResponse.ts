/** `/api/tv/[id]/season/[n]` 실패 응답(400/404/429/5xx 패스스루 및 서버 오류 시). */
export interface SeasonErrorResponse {
  error: string;
}
