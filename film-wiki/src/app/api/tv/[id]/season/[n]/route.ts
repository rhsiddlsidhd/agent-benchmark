/**
 * `/api/tv/[id]/season/[n]` Route Handler (01_ARCHITECTURE §5.3, §4 / ADR-0003 / FR-4).
 *
 * TV 시즌 상세(에피소드 목록 포함)를 프록시한다. 시즌 전환은 인터랙티브라 Client
 * Component 가 이 핸들러를 경유해 온디맨드로 조회한다. TMDB 키는 server-only 인
 * tmdb-client 내부에서만 접근하므로, 키가 클라이언트 번들·네트워크 탭에 노출되지
 * 않는다(ADR-0003).
 *
 * 에러/엣지케이스 정책(§4):
 * - TMDB 404(없는 시즌)/429/5xx 는 상태코드를 그대로 패스스루한다(핸들러 자체 재시도
 *   없음 — ADR-0004). 클라이언트 훅은 non-ok 응답을 에러로 던져 ErrorState 로 노출한다.
 * - 네트워크/타임아웃(TmdbError.status === 0)은 유효한 HTTP 상태가 아니므로 502 로 매핑한다.
 * - id/시즌 번호 파싱 불가(비정수/음수)는 TMDB 를 호출하지 않고 400 을 반환한다.
 *   (시즌 번호 0 은 Specials 로 유효하므로 허용한다.)
 */
import { NextResponse, type NextRequest } from "next/server";

import { getTvSeason } from "@/src/lib/tmdb/client";
import { isTmdbError } from "@/src/lib/tmdb/errors";
import type { SeasonErrorResponse, SeasonResponse } from "./_types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; n: string }> },
): Promise<NextResponse> {
  const { id, n } = await params;

  const tvId = Number(id);
  const seasonNumber = Number(n);

  // TV id 는 1 이상 정수, 시즌 번호는 0 이상 정수(0=Specials)만 허용.
  if (
    !Number.isInteger(tvId) ||
    tvId <= 0 ||
    !Number.isInteger(seasonNumber) ||
    seasonNumber < 0
  ) {
    const body: SeasonErrorResponse = {
      error: "잘못된 TV/시즌 식별자입니다.",
    };
    return NextResponse.json(body, { status: 400 });
  }

  try {
    const data: SeasonResponse = await getTvSeason(tvId, seasonNumber);
    return NextResponse.json(data);
  } catch (error) {
    if (isTmdbError(error)) {
      // 404/429/5xx 등 유효한 HTTP 상태는 그대로, status 0(네트워크/타임아웃)은 502 로.
      const status =
        error.status >= 400 && error.status <= 599 ? error.status : 502;
      const body: SeasonErrorResponse = { error: error.message };
      return NextResponse.json(body, { status });
    }
    // 예상치 못한 에러는 삼키지 않고 재던져 Next 기본 처리(500)에 위임한다.
    throw error;
  }
}
