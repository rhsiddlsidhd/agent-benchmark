"use client";

/**
 * SearchExplorer — 검색 페이지 `/search` 본체 (FR-2 / 03_DESIGN §3.2 / 01_ARCHITECTURE §5.3).
 *
 * Client Component. 상단 고정 검색 입력(자동 포커스)에서 **Enter 제출 시에만**
 * `useSearchInfinite`(TanStack Query useInfiniteQuery)로 `/api/search` 를 조회한다.
 * 실시간 자동완성은 제공하지 않는다(§5.3) — 입력 중에는 요청이 나가지 않고,
 * 제출된 `submittedQuery` 만 쿼리 키가 된다.
 *
 * 결과는 media_type 판별자로 영화/TV/인물 3개 섹션으로 나눠 반응형 그리드로
 * 렌더한다. 영화/TV 는 ContentCard, 인물은 PersonAvatar 를 Link 로 감싼 카드.
 *
 * 무한스크롤(§3.2): 하단 sentinel 이 뷰포트에 진입하면 다음 페이지를 로드하고
 * 로딩 중에는 SkeletonCard 를 append 한다. 마지막 페이지(hasNextPage false)에
 * 도달하면 추가 UI 없이 조용히 멈춘다(안내 문구 없음).
 *
 * 에러/엣지케이스(§4, §3.2):
 * - 초기(입력 전): EmptyState.
 * - 무결과: EmptyState("다른 키워드로 시도해보세요").
 * - 에러: ErrorState(refetch 재시도) — 훅의 retry:1 이후 최종 실패 노출.
 * - 결과 변화(로딩/갱신/무결과/에러)는 sr-only aria-live 영역으로 안내.
 *
 * AdultToggle(§2.4)은 헤더와 동일 AdultContentContext 를 구독하며, 그 값(include_adult)을
 * useSearchInfinite 의 queryKey 로 넘겨 토글 전환 시 결과를 즉시 재조회한다(FR-7).
 */
import { useState, type SubmitEvent } from "react";
import Link from "next/link";

import {
  ContentCard,
  EmptyState,
  ErrorState,
  PersonAvatar,
  SkeletonCard,
} from "@/src/components/ui";
import { useAdultContent } from "@/src/features/adult-content/adult-content-context";
import { AdultToggle } from "@/src/features/adult-content/adult-toggle";
import { useSearchInfinite } from "@/src/features/search/use-search-infinite";
import { useIntersectionObserver } from "@/src/features/search/use-intersection-observer";
import type {
  MovieSearchResult,
  MultiSearchResult,
  PersonSearchResult,
  TVSearchResult,
} from "@/src/lib/tmdb/types";

/** 영화/TV 카드 반응형 그리드(2→3→4→6열). spacing 은 card-gap 토큰만 사용. */
const TITLED_GRID =
  "grid grid-cols-2 gap-card-gap sm:grid-cols-3 md:grid-cols-4 md:gap-card-gap-lg lg:grid-cols-6";

/** 인물 카드 그리드(아바타가 작아 더 조밀하게 3→4→6→8열). */
const PERSON_GRID =
  "grid grid-cols-3 gap-card-gap sm:grid-cols-4 md:grid-cols-6 md:gap-card-gap-lg lg:grid-cols-8";

/** 출시/방영일 문자열에서 연도만 추출. 빈 문자열이면 null(§2.9 결측). */
function yearOf(date: string): string | null {
  return date ? date.slice(0, 4) : null;
}

/** media_type 판별자로 결과를 3개 타입으로 분리(유니온 내로잉, as 단언 없음). */
function partitionResults(results: MultiSearchResult[]): {
  movies: MovieSearchResult[];
  tv: TVSearchResult[];
  people: PersonSearchResult[];
} {
  const movies: MovieSearchResult[] = [];
  const tv: TVSearchResult[] = [];
  const people: PersonSearchResult[] = [];

  for (const item of results) {
    if (item.media_type === "movie") {
      movies.push(item);
    } else if (item.media_type === "tv") {
      tv.push(item);
    } else {
      people.push(item);
    }
  }

  return { movies, tv, people };
}

/** 인물 대표작(최대 2편)을 부제로. 없으면 null(줄 자체 생략). */
function knownForLabel(person: PersonSearchResult): string | null {
  const known = person.known_for;
  if (!known || known.length === 0) {
    return null;
  }
  const titles = known
    .map((item) => (item.media_type === "movie" ? item.title : item.name))
    .filter((title) => title.length > 0)
    .slice(0, 2);
  return titles.length > 0 ? titles.join(", ") : null;
}

/** 인물 검색 결과 카드 — PersonAvatar 를 상세 링크로 감싼다(§3.2). */
function PersonResultCard({ person }: { person: PersonSearchResult }) {
  return (
    <Link
      href={`/person/${person.id}`}
      aria-label={person.name}
      className="block rounded-lg"
    >
      <PersonAvatar
        path={person.profile_path}
        name={person.name}
        role={knownForLabel(person)}
      />
    </Link>
  );
}

export function SearchExplorer() {
  const [inputValue, setInputValue] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  // 성인 콘텐츠 토글(FR-7) — 헤더의 토글과 동일 Context. 값이 queryKey 에 들어가므로
  // 토글 전환 시 TanStack Query 가 새 키로 즉시 재조회한다(결과 즉시 반영).
  const { includeAdult } = useAdultContent();

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useSearchInfinite({ query: submittedQuery, includeAdult });

  // sentinel: 다음 페이지가 있고 로딩 중이 아닐 때만 감지(마지막 페이지 조용히 정지 · 중복 요청 방지).
  const sentinelRef = useIntersectionObserver({
    enabled: Boolean(hasNextPage) && !isFetchingNextPage,
    onIntersect: () => {
      void fetchNextPage();
    },
  });

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(inputValue.trim());
  }

  const hasSubmitted = submittedQuery.length > 0;
  const results = data?.pages.flatMap((page) => page.results) ?? [];
  const { movies, tv, people } = partitionResults(results);
  const hasResults = results.length > 0;

  // 결과 변화 안내(aria-live). 입력 전에는 침묵.
  let liveMessage = "";
  if (hasSubmitted) {
    if (isError) {
      liveMessage = "검색 중 오류가 발생했습니다.";
    } else if (isLoading) {
      liveMessage = "검색 중입니다.";
    } else if (!hasResults) {
      liveMessage = "검색 결과가 없습니다.";
    } else {
      liveMessage = `${results.length}건의 검색 결과를 찾았습니다.`;
    }
  }

  return (
    <div className="flex w-full flex-col">
      <h1 className="sr-only">검색</h1>

      {/* 상단 고정 검색 바 — 헤더(top-0, h-14) 바로 아래에 sticky. */}
      <form
        role="search"
        onSubmit={handleSubmit}
        className="z-header sticky top-14 border-b border-border bg-base"
      >
        <div className="mx-auto flex w-full max-w-page items-center gap-3 px-gutter py-3 md:px-gutter-lg">
          <div className="relative flex-1">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-content-muted"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0z"
              />
            </svg>
            {/* 검색 페이지 진입 시 즉시 입력 가능하도록 자동 포커스(§3.2). */}
            <input
              autoFocus
              type="search"
              name="query"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="영화, TV 프로그램, 인물 검색"
              aria-label="검색어"
              className="h-11 w-full rounded-md border border-border bg-surface pl-10 pr-3 text-body text-content-primary placeholder:text-content-muted"
            />
          </div>

          {/* 성인 콘텐츠 토글(FR-7) — 헤더 토글과 동일 Context 를 공유(§2.4). */}
          <AdultToggle className="shrink-0" />
        </div>
      </form>

      {/* 결과 변화 안내(스크린리더 전용). */}
      <div className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </div>

      <div className="flex w-full flex-col gap-section py-section">
        {!hasSubmitted ? (
          <EmptyState
            title="무엇을 찾고 있나요?"
            message="영화, TV 프로그램, 인물을 검색할 수 있어요."
          />
        ) : isLoading ? (
          <div
            className={`mx-auto w-full max-w-page px-gutter md:px-gutter-lg ${TITLED_GRID}`}
            role="status"
            aria-busy="true"
            aria-label="검색 결과를 불러오는 중"
          >
            {Array.from({ length: 12 }, (_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            title="검색에 실패했어요"
            message="검색 결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
            onRetry={() => {
              void refetch();
            }}
          />
        ) : !hasResults ? (
          <EmptyState
            title="검색 결과가 없어요"
            message="다른 키워드로 시도해보세요."
          />
        ) : (
          <>
            {movies.length > 0 ? (
              <section
                aria-labelledby="search-section-movie"
                className="mx-auto w-full max-w-page px-gutter md:px-gutter-lg"
              >
                <h2
                  id="search-section-movie"
                  className="mb-4 text-h2 text-content-primary"
                >
                  영화
                </h2>
                <ul className={TITLED_GRID}>
                  {movies.map((movie) => (
                    <li key={`movie-${movie.id}`}>
                      <ContentCard
                        href={`/movie/${movie.id}`}
                        title={movie.title}
                        posterPath={movie.poster_path}
                        year={yearOf(movie.release_date)}
                        rating={movie.vote_average}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {tv.length > 0 ? (
              <section
                aria-labelledby="search-section-tv"
                className="mx-auto w-full max-w-page px-gutter md:px-gutter-lg"
              >
                <h2
                  id="search-section-tv"
                  className="mb-4 text-h2 text-content-primary"
                >
                  TV 프로그램
                </h2>
                <ul className={TITLED_GRID}>
                  {tv.map((show) => (
                    <li key={`tv-${show.id}`}>
                      <ContentCard
                        href={`/tv/${show.id}`}
                        title={show.name}
                        posterPath={show.poster_path}
                        year={yearOf(show.first_air_date)}
                        rating={show.vote_average}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {people.length > 0 ? (
              <section
                aria-labelledby="search-section-person"
                className="mx-auto w-full max-w-page px-gutter md:px-gutter-lg"
              >
                <h2
                  id="search-section-person"
                  className="mb-4 text-h2 text-content-primary"
                >
                  인물
                </h2>
                <ul className={PERSON_GRID}>
                  {people.map((person) => (
                    <li key={`person-${person.id}`}>
                      <PersonResultCard person={person} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* 무한스크롤 sentinel — 진입 시 다음 페이지 로드. 마지막 페이지엔 미부착(정지). */}
            <div ref={sentinelRef} aria-hidden="true" />

            {isFetchingNextPage ? (
              <div
                className={`mx-auto w-full max-w-page px-gutter md:px-gutter-lg ${TITLED_GRID}`}
                role="status"
                aria-busy="true"
                aria-label="다음 페이지를 불러오는 중"
              >
                {Array.from({ length: 6 }, (_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
