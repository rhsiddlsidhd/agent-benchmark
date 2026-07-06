/**
 * 장르 탐색 페이지 `/discover` (FR-6, 03_DESIGN §3.6).
 *
 * 장르 필터는 선택에 따라 즉시 재요청하는 인터랙티브 경로이므로 결과 조회는
 * Client Component + TanStack Query + `/api/discover` Route Handler 로 처리한다
 * (01_ARCHITECTURE §4). 다만 장르 목록 자체는 정적에 가깝고 server-only 인
 * getGenres 로만 얻을 수 있으므로, 이 얇은 Server Component 가 영화/TV 두 목록을
 * 미리 받아(revalidate 3600) DiscoverExplorer 에 내려준다 — 타입 전환 시 재요청이
 * 필요 없다. getGenres 실패(타임아웃/5xx)는 세그먼트 error.tsx 경계가 잡는다.
 *
 * URL 상태 복원(§3.6): `?type=&genres=` searchParams(Next 16 은 Promise)를 파싱해
 * 초기 미디어 타입/선택 장르를 계산한다. 장르 id 는 선택 타입의 실제 목록에 존재하는
 * 값만 남겨(다른 타입/오염된 값 제거) 초기 선택으로 넘긴다 — 새로고침·링크 공유 시
 * 화면 상태가 그대로 복원된다.
 */
import type { Metadata } from "next";

import { DiscoverExplorer } from "@/src/features/discover/discover-explorer";
import { getGenres } from "@/src/lib/tmdb/client";
import type { Genre, MediaType } from "@/src/lib/tmdb/types";

export const metadata: Metadata = {
  title: "장르 탐색",
  description: "미디어 타입과 장르로 영화·TV 프로그램을 탐색하세요.",
};

/** searchParams 값(string | string[] | undefined)에서 첫 문자열만 취한다. */
function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** type 파라미터를 movie/tv 로 검증(그 외/누락은 movie 기본). */
function parseType(value: string | string[] | undefined): MediaType {
  return firstValue(value) === "tv" ? "tv" : "movie";
}

/** genres 파라미터를 파싱해 주어진 장르 목록에 존재하는 양의 정수 id 만 남긴다. */
function parseGenreIds(
  value: string | string[] | undefined,
  genres: Genre[]
): number[] {
  const valid = new Set(genres.map((genre) => genre.id));
  return (firstValue(value) ?? "")
    .split(",")
    .map((token) => Number(token.trim()))
    .filter((id) => Number.isInteger(id) && valid.has(id));
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  // 영화/TV 장르 목록을 병렬로 로드(실패 시 error.tsx 경계로 전파).
  const [movieGenres, tvGenres] = await Promise.all([
    getGenres("movie"),
    getGenres("tv"),
  ]);

  const initialType = parseType(params.type);
  const activeGenres = initialType === "movie" ? movieGenres : tvGenres;
  const initialGenreIds = parseGenreIds(params.genres, activeGenres);

  return (
    <DiscoverExplorer
      movieGenres={movieGenres}
      tvGenres={tvGenres}
      initialType={initialType}
      initialGenreIds={initialGenreIds}
    />
  );
}
