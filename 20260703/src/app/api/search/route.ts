/**
 * `/api/search` Route Handler (01_ARCHITECTURE §5.3, §4 / ADR-0003 / FR-2).
 *
 * 통합 검색(영화/TV/인물)을 프록시한다. TMDB 키는 `server-only` 인 tmdb-client
 * 내부에서만 접근하며, Client Component 는 이 핸들러를 경유해서만 검색을 호출한다
 * (키가 클라이언트 번들·네트워크 탭에 노출되지 않음).
 *
 * 에러/엣지케이스 정책(§4):
 * - TMDB 429/5xx 는 상태코드를 그대로 패스스루한다(핸들러 자체 재시도 없음 — ADR-0004).
 * - 네트워크/타임아웃(TmdbError.status === 0)은 유효한 HTTP 상태가 아니므로 502 로 매핑한다.
 * - 빈 query 는 TMDB 를 호출하지 않고 빈 결과(200)를 반환한다(응답 shape 유지).
 *
 * 검색은 쿼리 의존적·인터랙티브라 캐싱하지 않는다(searchMulti 가 no-store 로 호출).
 */
import { NextResponse, type NextRequest } from "next/server";

import { searchMulti } from "@/src/lib/tmdb/client";
import { isTmdbError } from "@/src/lib/tmdb/errors";
import type { SearchErrorResponse, SearchResponse } from "./_types";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;

  const query = searchParams.get("query")?.trim() ?? "";

  // 빈 query 방어: TMDB 호출 없이 빈 결과를 반환(훅이 기대하는 shape 그대로 유지).
  if (query === "") {
    const empty: SearchResponse = {
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    };
    return NextResponse.json(empty);
  }

  // page: 1 이상 정수만 허용, 그 외(NaN/0/음수/누락)는 1로 정규화.
  const parsedPage = Number(searchParams.get("page"));
  const page =
    Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  try {
    const data = await searchMulti(query, page);
    return NextResponse.json(data);
  } catch (error) {
    if (isTmdbError(error)) {
      // 429/5xx 등 유효한 HTTP 상태는 그대로, status 0(네트워크/타임아웃)은 502 로.
      const status =
        error.status >= 400 && error.status <= 599 ? error.status : 502;
      const body: SearchErrorResponse = { error: error.message };
      return NextResponse.json(body, { status });
    }
    // 예상치 못한 에러는 삼키지 않고 재던져 Next 기본 처리(500)에 위임한다.
    throw error;
  }
}
