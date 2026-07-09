import "server-only";

import { TmdbError } from "./errors";
import type {
  Credits,
  Genre,
  GenreListResponse,
  MediaType,
  Movie,
  MovieDetail,
  MovieSearchResult,
  MultiSearchResult,
  Paginated,
  PersonCombinedCredits,
  PersonDetail,
  SeasonDetail,
  TVDetail,
  TVShow,
  TVSearchResult,
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
// 홈 인기 세션 공용 헬퍼 (T1~T4)
// ---------------------------------------------------------------------------

/**
 * 오늘 기준 `months`개월 전 날짜를 TMDB date 파라미터 포맷(YYYY-MM-DD)으로 반환한다.
 * 요청 시점마다 새로 계산되며(하드코딩 금지), `months = 0`이면 오늘 날짜.
 */
function dateParamMonthsAgo(months: number): string {
  const date = new Date();
  date.setUTCMonth(date.getUTCMonth() - months);
  return date.toISOString().slice(0, 10);
}

/** `popularity` 내림차순 재정렬(원본 배열 변형 없음). TMDB `sort_by`만 믿지 않기 위함. */
function sortByPopularityDesc<T extends { popularity: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.popularity - a.popularity);
}

/** 트렌딩(all) 결과에서 person을 제외한 영화/TV만 남긴다(히어로 캐러셀용). */
function isTitledTrendingResult(
  item: MultiSearchResult
): item is MovieSearchResult | TVSearchResult {
  return item.media_type === "movie" || item.media_type === "tv";
}

// ---------------------------------------------------------------------------
// 목록류 (revalidate: 3600)
// ---------------------------------------------------------------------------

/**
 * 인기 한국 드라마(홈 "인기 드라마" 세션).
 *
 * `/discover/tv` — `with_type=2|4`(Miniseries+Scripted, 실측상 2만 쓰면 최근작 절반
 * 가까이 누락), `first_air_date.gte/.lte`는 오늘 기준 최근 1년(매 호출 동적 계산).
 * `sort_by`만 믿지 않고 `popularity` 내림차순으로 재정렬한다.
 */
export async function getPopularKrDramas(): Promise<TVShow[]> {
  const data = await tmdbRequest<Paginated<TVShow>>("/discover/tv", {
    searchParams: {
      with_origin_country: "KR",
      with_type: "2|4",
      sort_by: "popularity.desc",
      "vote_count.gte": 3,
      "first_air_date.gte": dateParamMonthsAgo(12),
      "first_air_date.lte": dateParamMonthsAgo(0),
    },
    cache: { revalidate: REVALIDATE.LIST },
  });
  return sortByPopularityDesc(data.results);
}

/**
 * 인기 한국 예능(홈 "인기 예능" 세션).
 *
 * `/discover/tv` — `with_type=3|5`(Reality+Talk Show). 최근성 필터는
 * `first_air_date`가 아닌 `air_date`(에피소드 방영일) 사용 — 런닝맨/아는형님처럼
 * 장수 프랜차이즈는 `first_air_date` 기준으로 거르면 현재 방영작이 누락된다(실측 근거,
 * TODO.md). `.gte/.lte`는 오늘 기준 최근 6개월(매 호출 동적 계산). `popularity`
 * 내림차순 재정렬.
 */
export async function getPopularKrVariety(): Promise<TVShow[]> {
  const data = await tmdbRequest<Paginated<TVShow>>("/discover/tv", {
    searchParams: {
      with_origin_country: "KR",
      with_type: "3|5",
      sort_by: "popularity.desc",
      "vote_count.gte": 5,
      "air_date.gte": dateParamMonthsAgo(6),
      "air_date.lte": dateParamMonthsAgo(0),
    },
    cache: { revalidate: REVALIDATE.LIST },
  });
  return sortByPopularityDesc(data.results);
}

/**
 * 인기 한국 영화(홈 "인기 영화" 세션).
 *
 * `/discover/movie` — movie는 국가 필드가 없어 `with_original_language=ko`로 근사.
 * `primary_release_date.gte/.lte`는 오늘 기준 최근 6개월(매 호출 동적 계산, 미개봉작
 * 유입 방지). `without_genres=99,10402`(다큐+음악)로 콘서트 실황/특별상영 필름 배제
 * (`with_release_type`은 실측상 결과에 영향 없음 확인). `popularity` 내림차순 재정렬.
 */
export async function getPopularKrMovies(): Promise<Movie[]> {
  const data = await tmdbRequest<Paginated<Movie>>("/discover/movie", {
    searchParams: {
      with_original_language: "ko",
      sort_by: "popularity.desc",
      "vote_count.gte": 2,
      "primary_release_date.gte": dateParamMonthsAgo(6),
      "primary_release_date.lte": dateParamMonthsAgo(0),
      without_genres: "99,10402",
    },
    cache: { revalidate: REVALIDATE.LIST },
  });
  return sortByPopularityDesc(data.results);
}

/**
 * 히어로 캐러셀 후보(홈 히어로, 3~5개).
 *
 * `/trending/all/week` 조회 — person 제외 → `backdrop_path` 있는 항목만 후보 →
 * `popularity` 재정렬 후 상위 5개. 최근성 별도 필터는 적용하지 않는다(trending
 * 자체가 half-life 감쇠로 최신성을 반영하므로, 재화제화된 구작을 부당 배제할 위험
 * 방지). 후보가 3개 미만이면(이례적 상황) 있는 만큼만 반환하고 임의로 채우지 않는다.
 */
export async function getHeroCarouselItems(): Promise<
  (MovieSearchResult | TVSearchResult)[]
> {
  const trending = await tmdbRequest<Paginated<MultiSearchResult>>(
    "/trending/all/week",
    { cache: { revalidate: REVALIDATE.LIST } }
  );
  const titled = trending.results.filter(isTitledTrendingResult);
  const withBackdrop = titled.filter((item) => item.backdrop_path !== null);
  return sortByPopularityDesc(withBackdrop).slice(0, 5);
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
