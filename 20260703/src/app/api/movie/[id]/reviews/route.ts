/**
 * `/api/movie/[id]/reviews` Route Handler (01_ARCHITECTURE §5.4, §4 / ADR-0003 / FR-3).
 *
 * 영화 리뷰(TMDB `/movie/{id}/reviews`)를 프록시한다. 리뷰 페이지 이동은
 * 인터랙티브하므로 Client Component 가 이 핸들러를 경유해 온디맨드로 조회한다
 * (§4 — 인터랙티브 페치는 Route Handler 경유, `/api/tv/[id]/season/[n]` 과 동일
 * 패턴). TMDB 키는 server-only 인 tmdb-client 내부에서만 접근하므로, 키가
 * 클라이언트 번들·네트워크 탭에 노출되지 않는다(ADR-0003).
 *
 * TMDB 는 페이지당 20개를 반환하지만, 요구사항(10개 단위 페이지네이션)에 맞춘
 * 재분할은 이 핸들러가 아니라 소비 훅/컴포넌트 책임이다 — 이 핸들러는 TMDB 응답을
 * (정렬만 적용된 채로) 그대로 전달한다. 정렬/캐싱은 tmdb-client 의 `getMovieReviews`
 * 가 이미 처리한다(§5.1, revalidate: 86400).
 *
 * 에러/엣지케이스 정책(§4):
 * - TMDB 429/5xx 는 상태코드를 그대로 패스스루한다(핸들러 자체 재시도 없음 — ADR-0004).
 * - 네트워크/타임아웃(TmdbError.status === 0)은 유효한 HTTP 상태가 아니므로 502 로 매핑한다.
 * - id 파싱 불가(비정수/음수)는 TMDB 를 호출하지 않고 400 을 반환한다.
 * - page 파싱 불가(비정수/1 미만/누락)는 1 로 정규화한다(`/api/search` 와 동일 정책).
 */
import { NextResponse, type NextRequest } from "next/server";

import { getMovieReviews } from "@/src/lib/tmdb/client";
import { isTmdbError } from "@/src/lib/tmdb/errors";
import type { ReviewsErrorResponse, ReviewsResponse } from "./_types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const movieId = Number(id);

  // 영화 id 는 1 이상 정수만 허용 — 아니면 TMDB 를 호출하지 않고 400 을 반환.
  if (!Number.isInteger(movieId) || movieId <= 0) {
    const body: ReviewsErrorResponse = { error: "잘못된 영화 식별자입니다." };
    return NextResponse.json(body, { status: 400 });
  }

  // page: 1 이상 정수만 허용, 그 외(NaN/0/음수/누락)는 1로 정규화.
  const parsedPage = Number(request.nextUrl.searchParams.get("page"));
  const page =
    Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  try {
    const data: ReviewsResponse = await getMovieReviews(movieId, page);
    return NextResponse.json(data);
  } catch (error) {
    if (isTmdbError(error)) {
      // 429/5xx 등 유효한 HTTP 상태는 그대로, status 0(네트워크/타임아웃)은 502 로.
      const status =
        error.status >= 400 && error.status <= 599 ? error.status : 502;
      const body: ReviewsErrorResponse = { error: error.message };
      return NextResponse.json(body, { status });
    }
    // 예상치 못한 에러는 삼키지 않고 재던져 Next 기본 처리(500)에 위임한다.
    throw error;
  }
}
