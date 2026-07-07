"use client";

/**
 * `useIntersectionObserver` — 무한스크롤 sentinel 감지 훅 (FR-2 / 03_DESIGN §3.2).
 *
 * 반환한 ref 를 리스트 하단의 sentinel 요소에 부착하면, 그 요소가 뷰포트
 * (rootMargin 만큼 확장한 영역)에 진입할 때 `onIntersect` 를 호출한다.
 *
 * 무한스크롤 정지(§4): `enabled` 가 false 이면 옵저버를 아예 부착하지 않는다.
 * 호출부는 `hasNextPage && !isFetchingNextPage` 를 `enabled` 로 넘겨,
 * (1) 마지막 페이지 도달 시 추가 로딩 없이 조용히 멈추고
 * (2) 이미 로딩 중일 때 중복 요청을 막는다.
 *
 * `onIntersect` 는 매 렌더마다 새 함수여도 옵저버를 재생성하지 않도록 ref 로
 * 최신값만 참조한다(effect 의존성에서 제외).
 */
import { useEffect, useRef } from "react";

interface UseIntersectionObserverOptions {
  /** sentinel 진입 시 호출할 콜백(예: fetchNextPage). */
  onIntersect: () => void;
  /** 감지 활성화 여부. false 면 옵저버 미부착(무한스크롤 정지). */
  enabled: boolean;
  /** 뷰포트 확장 마진. 기본 400px(도달 전 선행 로드). */
  rootMargin?: string;
}

export function useIntersectionObserver({
  onIntersect,
  enabled,
  rootMargin = "400px",
}: UseIntersectionObserverOptions): React.RefObject<HTMLDivElement | null> {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef<() => void>(onIntersect);

  // 최신 콜백만 갱신(옵저버 재생성 없이). ref 갱신은 render 중이 아닌 effect 에서.
  useEffect(() => {
    callbackRef.current = onIntersect;
  }, [onIntersect]);

  useEffect(() => {
    const node = targetRef.current;
    if (!node || !enabled) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          callbackRef.current();
        }
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [enabled, rootMargin]);

  return targetRef;
}
