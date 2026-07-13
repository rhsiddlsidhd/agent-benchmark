"use client";

import { useSyncExternalStore } from "react";

/**
 * CSS 미디어쿼리 매치 여부를 반환한다(grilling §Q5/Q13). 마운트 전(SSR/최초 페인트)엔
 * `null` — 호출부가 이 상태를 "레이아웃 미확정"으로 취급해 스켈레톤을 보여준다.
 * 마운트 후 실제 매치 여부로 한 번 갱신되며, 이후 리사이즈로 매치 상태가 바뀌면
 * 다시 리렌더된다.
 */
export function useMediaQuery(query: string): boolean | null {
  return useSyncExternalStore(
    (onChange) => {
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener("change", onChange);
      return () => mediaQueryList.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => null,
  );
}
