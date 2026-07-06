import "server-only";

import { TmdbError } from "./errors";
import type {
  Credits,
  Genre,
  GenreListResponse,
  MediaType,
  Movie,
  MovieDetail,
  MultiSearchResult,
  Paginated,
  PersonCombinedCredits,
  PersonDetail,
  SeasonDetail,
  TVDetail,
  TVShow,
} from "./types";

/**
 * TMDB API 클라이언트 — 서버 전용.
 *
 * `server-only` import로 이 모듈이 클라이언트 번들에 포함되면 빌드 에러가 난다.
 * 인증은 v4 Access Token(Bearer 헤더) 방식으로, 키는 이 서버 전용 모듈
 * 내부에서만 `process.env.TMDB_ACCESS_TOKEN`으로 접근한다(ADR-0003 / NFR-2).
 */

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
/** UI 표기 언어 고정값. */
const DEFAULT_LANGUAGE = "ko-KR";
/** 응답 지연 시 무한 대기를 막기 위한 요청 타임아웃(ms). */
const REQUEST_TIMEOUT_MS = 10_000;

/** 캐시 정책: 목록류(홈/트렌딩/장르)와 상세 페이지의 revalidate 초 단위. */
const REVALIDATE = {
  /** 목록류(홈/트렌딩/인기/장르/discover): 1시간. */
  LIST: 3600,
  /** 상세(영화/TV/인물/시즌): 1일. */
  DETAIL: 86400,
} as const;

/** 검색은 쿼리 의존적·인터랙티브라 캐싱하지 않고 매 요청 최신값을 받는다. */
type CachePolicy = { revalidate: number } | "no-store";

type QueryValue = string | number | boolean | undefined;

interface RequestOptions {
  /** 쿼리 파라미터. undefined 값은 직렬화에서 제외된다. */
  searchParams?: Record<string, QueryValue>;
  /** 캐시 정책(호출부에서 명시). */
  cache: CachePolicy;
}

/**
 * TMDB 엔드포인트를 호출하고 JSON을 지정 타입으로 파싱한다.
 *
 * - 인증: `Authorization: Bearer <TMDB_ACCESS_TOKEN>` 헤더(쿼리 api_key 아님).
 * - 실패 시 상태코드를 보존한 `TmdbError`를 throw한다(삼키지 않음).
 *   - 404: 상위에서 `notFound()` 분기 가능
 *   - 429: Route Handler가 상태코드를 그대로 패스스루 가능
 *   - 5xx/네트워크/타임아웃: `error.tsx` 경계로 전파
 * - 자체 재시도 로직은 두지 않는다(rate limit 악화 방지, ADR-0004).
 */
async function tmdbRequest<T>(
  path: string,
  { searchParams, cache }: RequestOptions
): Promise<T> {
  const accessToken = process.env.TMDB_ACCESS_TOKEN;
  if (!accessToken) {
    // 값을 로그로 남기지 않고 부재 사실만 알린다.
    throw new TmdbError("TMDB_ACCESS_TOKEN 환경변수가 설정되지 않았습니다.", {
      status: 0,
      endpoint: path,
    });
  }

  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set("language", DEFAULT_LANGUAGE);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const cacheInit: RequestInit & { next?: { revalidate: number } } =
    cache === "no-store"
      ? { cache: "no-store" }
      : { next: { revalidate: cache.revalidate } };

  let response: Response;
  try {
    response = await fetch(url, {
      ...cacheInit,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accept: "application/json",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (cause) {
    // 네트워크 오류/타임아웃(AbortError 포함). 원인을 보존해 재전파.
    const isTimeout = cause instanceof DOMException && cause.name === "TimeoutError";
    const reason = isTimeout ? "요청 시간 초과" : "네트워크 오류";
    console.error(`[tmdb] ${reason}: ${path}`, cause);
    throw new TmdbError(`TMDB 요청 실패(${reason}): ${path}`, {
      status: 0,
      endpoint: path,
      cause,
    });
  }

  if (!response.ok) {
    // 상태코드(404/429/5xx 등)를 보존해 상위 분기에서 사용.
    console.error(`[tmdb] HTTP ${response.status}: ${path}`);
    throw new TmdbError(`TMDB 요청 실패(HTTP ${response.status}): ${path}`, {
      status: response.status,
      endpoint: path,
    });
  }

  const data: T = await response.json();
  return data;
}

/**
 * 404를 `null`로 변환하는 래퍼. 상세 루트 리소스(영화/TV/인물)에 사용해
 * 호출부가 `if (!x) notFound()`로 분기할 수 있게 한다.
 * 404 이외의 에러(429/5xx/네트워크)는 그대로 재전파한다.
 */
async function tmdbRequestOrNull<T>(
  path: string,
  options: RequestOptions
): Promise<T | null> {
  try {
    return await tmdbRequest<T>(path, options);
  } catch (error) {
    if (error instanceof TmdbError && error.isNotFound) {
      return null;
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// 목록류 (revalidate: 3600)
// ---------------------------------------------------------------------------

/** 이번 주 트렌딩(영화·TV·인물 혼합). media_type으로 분기. */
export function getTrending(): Promise<Paginated<MultiSearchResult>> {
  return tmdbRequest<Paginated<MultiSearchResult>>("/trending/all/week", {
    cache: { revalidate: REVALIDATE.LIST },
  });
}

/** 인기 영화 목록(페이지네이션). */
export function getPopularMovies(page = 1): Promise<Paginated<Movie>> {
  return tmdbRequest<Paginated<Movie>>("/movie/popular", {
    searchParams: { page },
    cache: { revalidate: REVALIDATE.LIST },
  });
}

/** 인기 TV 목록(페이지네이션). */
export function getPopularTv(page = 1): Promise<Paginated<TVShow>> {
  return tmdbRequest<Paginated<TVShow>>("/tv/popular", {
    searchParams: { page },
    cache: { revalidate: REVALIDATE.LIST },
  });
}

/** 장르 목록(영화/TV). 결과 배열만 반환. */
export async function getGenres(type: MediaType): Promise<Genre[]> {
  const data = await tmdbRequest<GenreListResponse>(`/genre/${type}/list`, {
    cache: { revalidate: REVALIDATE.LIST },
  });
  return data.genres;
}

/** 장르 다중 선택 기반 디스커버(영화). */
export function discoverByGenre(
  type: "movie",
  genreIds: number[],
  page?: number,
  includeAdult?: boolean
): Promise<Paginated<Movie>>;
/** 장르 다중 선택 기반 디스커버(TV). */
export function discoverByGenre(
  type: "tv",
  genreIds: number[],
  page?: number,
  includeAdult?: boolean
): Promise<Paginated<TVShow>>;
export function discoverByGenre(
  type: MediaType,
  genreIds: number[],
  page = 1,
  includeAdult = false
): Promise<Paginated<Movie> | Paginated<TVShow>> {
  return tmdbRequest<Paginated<Movie> | Paginated<TVShow>>(`/discover/${type}`, {
    searchParams: {
      page,
      include_adult: includeAdult,
      sort_by: "popularity.desc",
      // 빈 배열이면 파라미터 자체를 생략(전체 디스커버).
      with_genres: genreIds.length > 0 ? genreIds.join(",") : undefined,
    },
    cache: { revalidate: REVALIDATE.LIST },
  });
}

// ---------------------------------------------------------------------------
// 검색 (no-store: 쿼리 의존적·인터랙티브)
// ---------------------------------------------------------------------------

/** 통합 검색(영화/TV/인물). Route Handler에서 호출. */
export function searchMulti(
  query: string,
  page = 1,
  includeAdult = false
): Promise<Paginated<MultiSearchResult>> {
  return tmdbRequest<Paginated<MultiSearchResult>>("/search/multi", {
    searchParams: { query, page, include_adult: includeAdult },
    cache: "no-store",
  });
}

// ---------------------------------------------------------------------------
// 상세 루트 리소스 (revalidate: 86400) — 404 시 null 반환
// ---------------------------------------------------------------------------

/** 영화 상세. 존재하지 않으면 null(상위에서 notFound() 분기). */
export function getMovie(id: number): Promise<MovieDetail | null> {
  return tmdbRequestOrNull<MovieDetail>(`/movie/${id}`, {
    cache: { revalidate: REVALIDATE.DETAIL },
  });
}

/** TV 상세. 존재하지 않으면 null(상위에서 notFound() 분기). */
export function getTvShow(id: number): Promise<TVDetail | null> {
  return tmdbRequestOrNull<TVDetail>(`/tv/${id}`, {
    cache: { revalidate: REVALIDATE.DETAIL },
  });
}

/** 인물 상세. 존재하지 않으면 null(상위에서 notFound() 분기). */
export function getPerson(id: number): Promise<PersonDetail | null> {
  return tmdbRequestOrNull<PersonDetail>(`/person/${id}`, {
    cache: { revalidate: REVALIDATE.DETAIL },
  });
}

// ---------------------------------------------------------------------------
// 상세 하위 리소스 (revalidate: 86400)
// 루트 리소스 존재를 전제로 한다. 호출부는 루트를 먼저 조회해 notFound()로
// 분기한 뒤 이들을 호출하는 것을 권장(그러면 이들은 정상적으로 404를 만나지 않음).
// ---------------------------------------------------------------------------

/** 영화 출연진·제작진. */
export function getMovieCredits(id: number): Promise<Credits> {
  return tmdbRequest<Credits>(`/movie/${id}/credits`, {
    cache: { revalidate: REVALIDATE.DETAIL },
  });
}

/** 영화 추천/유사작. */
export function getMovieRecommendations(id: number): Promise<Paginated<Movie>> {
  return tmdbRequest<Paginated<Movie>>(`/movie/${id}/recommendations`, {
    cache: { revalidate: REVALIDATE.DETAIL },
  });
}

/** TV 출연진·제작진(movie/tv 공용 Credits shape). */
export function getTvCredits(id: number): Promise<Credits> {
  return tmdbRequest<Credits>(`/tv/${id}/credits`, {
    cache: { revalidate: REVALIDATE.DETAIL },
  });
}

/** TV 추천/유사작(결과는 TVShow 목록 아이템). */
export function getTvRecommendations(id: number): Promise<Paginated<TVShow>> {
  return tmdbRequest<Paginated<TVShow>>(`/tv/${id}/recommendations`, {
    cache: { revalidate: REVALIDATE.DETAIL },
  });
}

/** TV 시즌 상세(에피소드 목록 포함). */
export function getTvSeason(
  id: number,
  seasonNumber: number
): Promise<SeasonDetail> {
  return tmdbRequest<SeasonDetail>(`/tv/${id}/season/${seasonNumber}`, {
    cache: { revalidate: REVALIDATE.DETAIL },
  });
}

/** 인물 필모그래피(영화/TV 통합 크레딧). */
export function getPersonCombinedCredits(
  id: number
): Promise<PersonCombinedCredits> {
  return tmdbRequest<PersonCombinedCredits>(`/person/${id}/combined_credits`, {
    cache: { revalidate: REVALIDATE.DETAIL },
  });
}
