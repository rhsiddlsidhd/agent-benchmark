"use client";

import { useRef, type KeyboardEvent } from "react";

interface UseRovingTabIndexOptions {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
  /** 화살표 키 방향. 기본 horizontal(←/→), 세로 리스트는 vertical(↑/↓). */
  orientation?: "horizontal" | "vertical";
}

/**
 * WAI-ARIA APG Tabs 패턴의 roving tabindex(grilling §Q16) — 활성 탭만
 * `tabIndex 0`, 나머지는 `-1`. 화살표 키로 탭 사이 포커스 이동과 동시에 선택도
 * 수행한다(selection-follows-focus, 기존 클릭 즉시선택 동작과 일관된 모델).
 * 시즌 선택/회차 필름스트립/회차 리스트 3곳에서 공유한다.
 */
export function useRovingTabIndex<T extends HTMLElement>({
  count,
  activeIndex,
  onSelect,
  orientation = "horizontal",
}: UseRovingTabIndexOptions) {
  const itemRefs = useRef<(T | null)[]>([]);

  function getTabProps(index: number) {
    return {
      tabIndex: index === activeIndex ? 0 : -1,
      ref: (el: T | null) => {
        itemRefs.current[index] = el;
      },
      onKeyDown: (event: KeyboardEvent) => {
        const nextKey = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
        const prevKey = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";

        let nextIndex: number | null = null;
        if (event.key === nextKey) nextIndex = (index + 1) % count;
        else if (event.key === prevKey) nextIndex = (index - 1 + count) % count;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = count - 1;

        if (nextIndex !== null) {
          event.preventDefault();
          onSelect(nextIndex);
          itemRefs.current[nextIndex]?.focus();
        }
      },
    };
  }

  return { getTabProps };
}
