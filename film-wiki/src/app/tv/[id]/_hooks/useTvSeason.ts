"use client";

/**
 * `useTvSeason` — TV 시즌 상세 온디맨드 조회 훅 (01_ARCHITECTURE §5.3 / FR-4).
 *
 * TanStack Query `useQuery` 로 `/api/tv/[id]/season/[n]` 을 조회한다. 선택된 시즌
 * 번호(queryKey 에 포함)가 바뀔 때만 fetch 하고, 이미 조회한 시즌은 캐시에서
 * 재사용한다 — 매번 서버 전체를 재조회하지 않는다. TMDB 키는 Route Handler
 * 내부에서만 쓰이므로 이 훅은 키를 알 필요가 없다(ADR-0003).
 *
 * 에러/엣지케이스 정책(§4):
 * - 실패 재시도는 `retry: 1` 로 제한한다(그 이상은 TMDB rate limit 을 악화 — ADR-0004).
 * - 최종 실패 시 소비 컴포넌트가 `ErrorState`(refetch) 를 노출한다(커스텀 재시도 루프 없음).
 * - `seasonNumber` 가 null 이면 `enabled: false` 로 요청 자체를 보내지 않는다.
 */
import { useQuery } from "@tanstack/react-query";

import type { SeasonResponse } from "@/src/app/api/tv/[id]/season/[n]/_types";

/** `/api/tv/[id]/season/[n]` 을 조회한다. 실패 응답은 에러로 던져 `retry: 1` 대상이 된다. */
async function fetchSeason(
  tvId: number,
  seasonNumber: number,
): Promise<SeasonResponse> {
  const response = await fetch(`/api/tv/${tvId}/season/${seasonNumber}`);
  if (!response.ok) {
    throw new Error(`시즌 요청 실패 (HTTP ${response.status})`);
  }

  const data: SeasonResponse = await response.json();
  return data;
}

export function useTvSeason(tvId: number, seasonNumber: number | null) {
  return useQuery({
    queryKey: ["tv-season", tvId, seasonNumber],
    queryFn: () => {
      // enabled 가드로 null 일 때는 실행되지 않지만, 타입 좁힘을 위해 방어한다.
      if (seasonNumber === null) {
        throw new Error("선택된 시즌이 없습니다.");
      }
      return fetchSeason(tvId, seasonNumber);
    },
    enabled: seasonNumber !== null,
    retry: 1,
  });
}
