"use client";

/**
 * GenreFilter — 장르 다중 선택 스트립 (03_DESIGN §2.5, §3.6, FR-6).
 *
 * getGenres(type) 로 받은 장르 목록을 FilterChip 으로 나열한다. 선택 상태(selectedIds)
 * 와 토글은 상위(탐색 화면, T12)가 소유하고 이 컴포넌트는 제어(controlled)로 렌더만
 * 한다 — URL 동기화/기본 동작 결정은 화면 조립 단계에서 처리하기 위함이다.
 *
 * 레이아웃(§2.5): 데스크톱은 가로 wrap 나열, 모바일은 가로 스크롤 스트립.
 * `md:flex-wrap` 이전에는 overflow-x-auto 로 한 줄 스크롤한다.
 *
 * 접근성: role="group" + aria-label 로 장르 필터 묶음을 스크린리더에 알린다.
 * 각 칩의 선택 상태/체크 아이콘은 FilterChip 이 담당한다(§2.5).
 */
import { FilterChip } from "@/src/components/ui";
import type { Genre } from "@/src/lib/tmdb/types";

interface GenreFilterProps {
  /** 표시할 장르 목록(getGenres 결과). */
  genres: Genre[];
  /** 현재 선택된 장르 id 목록. */
  selectedIds: number[];
  /** 장르 토글 콜백(id 단위). */
  onToggle: (id: number) => void;
  /** 그룹 접근 라벨. 기본 "장르 필터". */
  ariaLabel?: string;
  className?: string;
}

export function GenreFilter({
  genres,
  selectedIds,
  onToggle,
  ariaLabel = "장르 필터",
  className,
}: GenreFilterProps) {
  // 장르 목록이 비면(로드 실패 등 상위 처리 전) 아무것도 렌더하지 않는다.
  if (genres.length === 0) {
    return null;
  }

  const selected = new Set(selectedIds);

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0${
        className ? ` ${className}` : ""
      }`}
    >
      {genres.map((genre) => (
        <FilterChip
          key={genre.id}
          label={genre.name}
          selected={selected.has(genre.id)}
          onToggle={() => onToggle(genre.id)}
        />
      ))}
    </div>
  );
}
