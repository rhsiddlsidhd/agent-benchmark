"use client";

/**
 * DiscoverExplorer — 장르 탐색 화면 `/discover` 본체 (FR-6 / 03_DESIGN §3.6 / 01_ARCHITECTURE §4).
 *
 * Client Component. GenreFilter · useDiscoverInfinite · /api/discover 를 하나의
 * 화면으로 조립한다. 미디어 타입(영화/TV) 선택 + 장르 다중 선택에 따라
 * `useDiscoverInfinite`(TanStack Query useInfiniteQuery)로 `/api/discover` 를 조회하고,
 * 결과를 반응형 ContentCard 그리드로 렌더하며 하단 sentinel 로 무한스크롤한다
 * (search 페이지의 sentinel 조립 패턴 재사용).
 *
 * TMDB 키는 Route Handler 내부에서만 쓰이므로 이 컴포넌트는 키를 알지 않는다(ADR-0003).
 * 장르 목록은 server-only 인 getGenres 로 상위 Server Component(page.tsx)가 미리 받아
 * props 로 내려준다 — 영화/TV 두 목록을 모두 받아 타입 전환 시 재요청 없이 즉시 바꾼다.
 *
 * 상태 URL 동기화(§3.6 권장): 선택한 타입/장르를 `?type=&genres=` 로 반영해 공유·
 * 새로고침 시 유지한다. 서버 라운드트립을 유발하지 않도록 Next 가 지원하는 네이티브
 * `window.history.replaceState` 로 얕게 갱신한다(next docs: single-page-applications
 * "Shallow routing on the client" — usePathname/useSearchParams 와 동기화된다).
 * 초기 상태는 Server Component 가 searchParams 를 파싱해 props(initialType/initialGenreIds)
 * 로 주입하므로 새로고침·링크 진입 시 그대로 복원된다.
 *
 * 에러/엣지케이스(§4):
 * - 초기/추가 로딩: SkeletonCard(그리드에 append).
 * - 최종 실패(retry:1 이후): ErrorState(refetch 재시도).
 * - 무결과: EmptyState.
 * - 마지막 페이지: sentinel 미부착으로 추가 UI 없이 조용히 정지.
 * - 장르 0개: 차단하지 않고 인기순 디스커버(훅/Route Handler 기본 동작).
 *
 * 성인 콘텐츠(FR-7)는 서버가 상시 페칭하고, ContentCard 가 `adult` 플래그로
 * 카드 단위 19+ 블러 게이트를 담당한다(전역 토글 없음).
 */
import { useState } from "react";

import {
  ContentCard,
  EmptyState,
  ErrorState,
  FilterChip,
  SkeletonCard,
} from "@/src/components/ui";
import { useIntersectionObserver } from "@/src/hooks";
import { cn } from "@/src/lib/clsx/merge";
import type { Genre, MediaType } from "@/src/lib/tmdb/types";
import { GenreFilter } from "./GenreFilter";
import { useDiscoverInfinite } from "../_hooks";
import { buildQuery, toCardData } from "../_utils";
import { DISCOVER_GRID } from "../_constants";

interface DiscoverExplorerProps {
  /** 영화 장르 목록(getGenres("movie")). */
  movieGenres: Genre[];
  /** TV 장르 목록(getGenres("tv")). */
  tvGenres: Genre[];
  /** URL 에서 복원한 초기 미디어 타입. */
  initialType: MediaType;
  /** URL 에서 복원한 초기 선택 장르 id(현재 타입에 유효한 값만). */
  initialGenreIds: number[];
}

export function DiscoverExplorer({
  movieGenres,
  tvGenres,
  initialType,
  initialGenreIds,
}: DiscoverExplorerProps) {
  const [type, setType] = useState<MediaType>(initialType);
  const [selectedIds, setSelectedIds] = useState<number[]>(initialGenreIds);

  const activeGenres = type === "movie" ? movieGenres : tvGenres;

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useDiscoverInfinite<MediaType>({
    type,
    genreIds: selectedIds,
  });

  // sentinel: 다음 페이지가 있고 로딩 중이 아닐 때만 감지(마지막 페이지 정지 · 중복 요청 방지).
  const sentinelRef = useIntersectionObserver({
    enabled: Boolean(hasNextPage) && !isFetchingNextPage,
    onIntersect: () => {
      void fetchNextPage();
    },
  });

  /** 브라우저 히스토리에 얕게 상태를 반영(서버 라운드트립 없음). */
  function syncUrl(nextType: MediaType, nextGenreIds: number[]) {
    window.history.replaceState(
      null,
      "",
      `?${buildQuery(nextType, nextGenreIds)}`,
    );
  }

  function handleToggleGenre(id: number) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((value) => value !== id)
      : [...selectedIds, id];
    setSelectedIds(next);
    syncUrl(type, next);
  }

  function handleSelectType(nextType: MediaType) {
    // 같은 타입 재선택은 무시(타입은 항상 하나 필요 — 토글 오프 없음).
    if (nextType === type) {
      return;
    }
    // 장르 id 는 타입별로 다르므로 타입 전환 시 선택을 비운다.
    setType(nextType);
    setSelectedIds([]);
    syncUrl(nextType, []);
  }

  const results = data?.pages.flatMap((page) => page.results) ?? [];
  // 페이지 경계에서 정렬이 바뀌면 같은 항목이 두 페이지에 걸쳐 중복될 수 있어 id 로 dedupe.
  const dedupedResults = [
    ...new Map(results.map((item) => [item.id, item])).values(),
  ];
  const cards = dedupedResults.map(toCardData);
  const hasResults = cards.length > 0;

  // 결과 변화 안내(aria-live).
  let liveMessage = "";
  if (isError) {
    liveMessage = "콘텐츠를 불러오는 중 오류가 발생했습니다.";
  } else if (isLoading) {
    liveMessage = "콘텐츠를 불러오는 중입니다.";
  } else if (!hasResults) {
    liveMessage = "표시할 콘텐츠가 없습니다.";
  } else {
    liveMessage = `${cards.length}개의 콘텐츠를 찾았습니다.`;
  }

  return (
    <div className="flex w-full flex-col gap-section py-section">
      {/* 필터 영역: 페이지 제목 + 미디어 타입 + 장르 다중 선택. */}
      <div className="mx-auto flex w-full max-w-page flex-col gap-4 px-gutter md:px-gutter-lg">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 text-content-primary">장르 탐색</h1>
          <p className="text-body-sm text-content-secondary">
            미디어 타입과 장르를 골라 원하는 작품을 찾아보세요.
          </p>
        </div>

        {/* 미디어 타입 선택(단일). FilterChip 을 재사용하되 항상 하나만 선택된다. */}
        <div role="group" aria-label="미디어 타입" className="flex gap-2">
          <FilterChip
            label="영화"
            selected={type === "movie"}
            onToggle={() => handleSelectType("movie")}
          />
          <FilterChip
            label="TV"
            selected={type === "tv"}
            onToggle={() => handleSelectType("tv")}
          />
        </div>

        {/* 장르 다중 선택 스트립(데스크톱 wrap / 모바일 가로 스크롤). */}
        <GenreFilter
          genres={activeGenres}
          selectedIds={selectedIds}
          onToggle={handleToggleGenre}
          ariaLabel="장르 필터"
        />
      </div>

      {/* 결과 변화 안내(스크린리더 전용). */}
      <div className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </div>

      {/* 결과 영역. */}
      {isLoading ? (
        <div
          className={cn(
            "mx-auto w-full max-w-page px-gutter md:px-gutter-lg",
            DISCOVER_GRID,
          )}
          role="status"
          aria-busy="true"
          aria-label="콘텐츠를 불러오는 중"
        >
          {Array.from({ length: 12 }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="콘텐츠를 불러오지 못했어요"
          message="잠시 후 다시 시도해 주세요."
          onRetry={() => {
            void refetch();
          }}
        />
      ) : !hasResults ? (
        <EmptyState
          title="표시할 콘텐츠가 없어요"
          message="다른 장르 조합으로 시도해보세요."
        />
      ) : (
        <>
          {/* 헤딩 계층 정합성(T14): h1(장르 탐색) 아래 카드 제목이 h3 이므로 그 사이를
              메우는 h2 를 sr-only 로 둔다. 시각 디자인은 그대로 유지된다. */}
          <h2 className="sr-only">탐색 결과</h2>
          <ul
            className={cn(
              "mx-auto w-full max-w-page px-gutter md:px-gutter-lg",
              DISCOVER_GRID,
            )}
          >
            {cards.map((card) => (
              <li key={card.href}>
                <ContentCard
                  href={card.href}
                  title={card.title}
                  posterPath={card.posterPath}
                  year={card.year}
                  rating={card.rating}
                  adult={card.adult}
                />
              </li>
            ))}
          </ul>

          {/* 무한스크롤 sentinel — 진입 시 다음 페이지 로드. 마지막 페이지엔 미부착(정지). */}
          <div ref={sentinelRef} aria-hidden="true" />

          {isFetchingNextPage ? (
            <div
              className={cn(
                "mx-auto w-full max-w-page px-gutter md:px-gutter-lg",
                DISCOVER_GRID,
              )}
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
  );
}
