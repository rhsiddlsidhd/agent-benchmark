/**
 * `/api/discover` Route Handler (01_ARCHITECTURE §5.3, §4 / ADR-0003 / FR-6).
 *
 * 장르 다중 선택 기반 디스커버(영화/TV)를 프록시한다. 장르 필터는 인터랙티브라
 * Client Component 가 이 핸들러를 경유해 온디맨드로 조회한다. TMDB 키는 server-only
 * 인 tmdb-client 내부에서만 접근하므로, 키가 클라이언트 번들·네트워크 탭에 노출되지
 * 않는다(ADR-0003).
 *
 * 파라미터:
 * - `type`: "movie" | "tv" (필수). 그 외 값은 400.
 * - `genreIds`: 콤마 구분 양의 정수(예: "28,12"). 유효하지 않은 항목은 제거한다.
 *   비었으면 with_genres 없이 인기순 디스커버(장르 0개 선택의 기본 동작 — 아래 참조).
 * - `page`: 1 이상 정수. NaN/0/음수/누락은 1 로 정규화.
 *
 * 장르 0개 선택의 기본 동작(§4 "장르 선택 0개일 때 기본 동작 정의"):
 * - genreIds 가 비면 with_genres 파라미터 자체를 생략하고 popularity.desc 로 정렬된
 *   전체 디스커버(사실상 인기작)를 반환한다. 그리드가 항상 채워져 있어 사용자가
 *   장르를 하나씩 붙여가며 좁혀갈 수 있다(빈 화면/차단 없음).
 *
 * 에러/엣지케이스 정책(§4):
 * - TMDB 429/5xx 는 상태코드를 그대로 패스스루한다(핸들러 자체 재시도 없음 — ADR-0004).
 * - 네트워크/타임아웃(TmdbError.status === 0)은 유효한 HTTP 상태가 아니므로 502 로 매핑한다.
 * - type 누락/오타는 TMDB 를 호출하지 않고 400 을 반환한다.
 *
 * 디스커버는 목록류라 tmdb-client 에서 revalidate 3600 으로 캐싱된다(§8).
 */
import { NextResponse, type NextRequest } from "next/server";

import { discoverByGenre } from "@/src/lib/tmdb/client";
import { isTmdbError } from "@/src/lib/tmdb/errors";
import type { DiscoverErrorResponse, DiscoverResponse } from "./_types";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;

  // type 검증: "movie" | "tv" 만 허용(그 외는 400). 가드 이후 타입 좁힘(as 단언 없음).
  const typeParam = searchParams.get("type");
  if (typeParam !== "movie" && typeParam !== "tv") {
    const body: DiscoverErrorResponse = {
      error: "잘못된 미디어 타입입니다. type 은 movie 또는 tv 여야 합니다.",
    };
    return NextResponse.json(body, { status: 400 });
  }

  // genreIds: 콤마 구분 양의 정수만 취한다. 유효하지 않은 항목은 조용히 제거.
  // 빈 결과([])는 with_genres 없는 인기순 디스커버로 이어진다(장르 0개 기본 동작).
  const genreIds = (searchParams.get("genreIds") ?? "")
    .split(",")
    .map((token) => Number(token.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);

  // page: 1 이상 정수만 허용, 그 외(NaN/0/음수/누락)는 1로 정규화.
  const parsedPage = Number(searchParams.get("page"));
  const page = Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  try {
    // 각 분기에서 typeParam 이 리터럴로 좁혀져 discoverByGenre 오버로드에 정확히 매칭된다.
    const data: DiscoverResponse =
      typeParam === "movie"
        ? await discoverByGenre("movie", genreIds, page)
        : await discoverByGenre("tv", genreIds, page);
    return NextResponse.json(data);
  } catch (error) {
    if (isTmdbError(error)) {
      // 429/5xx 등 유효한 HTTP 상태는 그대로, status 0(네트워크/타임아웃)은 502 로.
      const status =
        error.status >= 400 && error.status <= 599 ? error.status : 502;
      const body: DiscoverErrorResponse = { error: error.message };
      return NextResponse.json(body, { status });
    }
    // 예상치 못한 에러는 삼키지 않고 재던져 Next 기본 처리(500)에 위임한다.
    throw error;
  }
}
