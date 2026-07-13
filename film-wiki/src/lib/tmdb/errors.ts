/**
 * TMDB 호출 실패를 표현하는 전용 에러.
 *
 * - HTTP 응답이 실패(non-2xx)면 해당 상태코드를 `status`에 보존한다.
 *   404 → 상위에서 `notFound()` 분기, 429 → Route Handler 패스스루에 사용.
 * - 네트워크/타임아웃 등 응답을 받기 전 실패는 `status = 0`으로 표기하고
 *   원인은 `cause`에 보존한다(근본 원인을 숨기지 않기 위함).
 *
 * 이 모듈은 `server-only`를 import하지 않는다 — Route Handler 등 서버 코드가
 * 상태코드 기반 분기(예: 429 패스스루)를 위해 에러 타입만 가볍게 재사용할 수 있도록.
 */
export class TmdbError extends Error {
  /** HTTP 상태코드. 네트워크/타임아웃 등 응답 이전 실패는 0. */
  readonly status: number;
  /** 실패한 TMDB 엔드포인트 경로(토큰 등 비밀값은 포함하지 않음). */
  readonly endpoint: string;

  constructor(
    message: string,
    options: { status: number; endpoint: string; cause?: unknown },
  ) {
    super(message, { cause: options.cause });
    this.name = "TmdbError";
    this.status = options.status;
    this.endpoint = options.endpoint;
  }

  /** TMDB가 리소스를 찾지 못함(404). 상위에서 `notFound()`로 분기. */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** TMDB rate limit(429). Route Handler가 상태코드를 그대로 패스스루. */
  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

/** unknown 에러가 `TmdbError`인지 좁혀주는 타입 가드. */
export function isTmdbError(error: unknown): error is TmdbError {
  return error instanceof TmdbError;
}
