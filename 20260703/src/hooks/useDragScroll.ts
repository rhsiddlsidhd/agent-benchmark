"use client";

/**
 * useDragScroll — 카드 레일 드래그 스크롤 순수 로직 훅 (03_DESIGN §3.1/§4, TODO.md
 * "캐러셀 드래그(그랩) 스크롤 지원").
 *
 * 마크업을 모른다 — ref/props만 반환하고 실제 DOM 구조(ScrollRail/HeroCarousel)는
 * 호출부가 그린다. 네이티브 `overflow-x: auto` 스크롤 대신 framer-motion `drag="x"`로
 * 트랙(카드들의 직계 부모)을 transform 이동시킨다. 네이티브 스크롤 스냅은 transform
 * 방식과 호환되지 않으므로 `onDragEnd`에서 속도/위치를 계산해 가장 가까운 카드로
 * `animate()`로 이동한다(네이티브 스크롤 스냅 미사용).
 *
 * - 마우스/터치/펜: framer-motion `drag`가 포인터 타입을 통합 처리한다. 내장
 *   `dragMomentum`은 끄고(스냅과 상충), `onDragEnd`의 velocity로 플릭(빠른 드래그)
 *   판정 후 한 칸 더 이동시켜 모멘텀 느낌을 낸다.
 * - 키보드: 포커스된 카드에서 버블링된 `←`/`→` 로 카드 단위 스냅 이동.
 * - 포커스: 트랙이 `overflow: hidden`이라 네이티브 Tab 포커스 자동 scrollIntoView가
 *   동작하지 않는다 — focus 캡처로 대체 구현.
 * - 클릭 무력화: 카드가 전부 `Link`이므로 5px 이상 드래그된 사이클의 클릭은
 *   캡처 단계에서 무력화한다(`wasDraggedRef`로 노출).
 * - `useReducedMotion()`이면 스냅 이동은 애니메이션 없이 즉시 점프(§5).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  animate,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
  type PanInfo,
} from "framer-motion";

/** 클릭으로 인식할 최대 드래그 거리(px). 초과 시 해당 드래그 사이클의 클릭을 무력화. */
const CLICK_SUPPRESS_THRESHOLD_PX = 5;
/** 플릭(빠른 드래그) 판정 속도 임계값(px/s). 초과 시 다음/이전 카드로 한 칸 더 이동. */
const FLICK_VELOCITY_THRESHOLD = 500;
/** 스냅 스프링 트랜지션(카드 hover 스프링과 동일 계열, 03_DESIGN §5). */
const snapSpring = { type: "spring" as const, stiffness: 300, damping: 30 };

type DragEventLike = MouseEvent | TouchEvent | PointerEvent;

export interface UseDragScrollOptions {
  /** 스냅 이동이 끝난 뒤(드래그/키보드/scrollToIndex) 현재 카드 인덱스를 알려준다. */
  onIndexChange?: (index: number) => void;
}

export interface UseDragScrollTrackProps {
  drag: "x";
  dragConstraints: { left: number; right: number };
  dragElastic: number;
  dragMomentum: false;
  style: { x: MotionValue<number> };
  onDragStart: () => void;
  onDrag: (event: DragEventLike, info: PanInfo) => void;
  onDragEnd: (event: DragEventLike, info: PanInfo) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onFocusCapture: (event: React.FocusEvent) => void;
  onClickCapture: (event: React.MouseEvent) => void;
}

export interface UseDragScrollResult<T extends HTMLElement = HTMLElement> {
  /** 뷰포트(overflow-hidden) 래퍼에 부착. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** 드래그 대상 트랙(카드들의 직계 부모)에 부착. */
  trackRef: React.RefObject<T | null>;
  /** 트랙 엘리먼트(motion.ul/motion.div)에 그대로 스프레드. */
  trackProps: UseDragScrollTrackProps;
  /** 직전 드래그 사이클이 클릭 무력화 임계값을 넘었는지. */
  wasDraggedRef: React.RefObject<boolean>;
  /** 특정 카드 인덱스로 즉시/애니메이션 이동(예: 히어로 캐러셀 dot 클릭). */
  scrollToIndex: (index: number) => void;
}

export function useDragScroll<T extends HTMLElement = HTMLElement>(
  options: UseDragScrollOptions = {}
): UseDragScrollResult<T> {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<T>(null);
  const x = useMotionValue(0);
  const wasDraggedRef = useRef(false);
  const [minX, setMinX] = useState(0);
  const onIndexChangeRef = useRef(options.onIndexChange);

  useEffect(() => {
    onIndexChangeRef.current = options.onIndexChange;
  }, [options.onIndexChange]);

  // 컨테이너/트랙 폭 변화에 따라 드래그 하한(minX) 재계산.
  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const measure = () => {
      setMinX(Math.min(0, container.clientWidth - track.scrollWidth));
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  function cardPositions(): number[] {
    const track = trackRef.current;
    if (!track) return [];
    return Array.from(track.children).map(
      (card) => -(card as HTMLElement).offsetLeft
    );
  }

  function clamp(value: number): number {
    return Math.max(minX, Math.min(0, value));
  }

  function nearestIndex(positions: number[], value: number): number {
    return positions.reduce(
      (closest, pos, index) =>
        Math.abs(pos - value) < Math.abs(positions[closest] - value)
          ? index
          : closest,
      0
    );
  }

  // scrollToIndex 는 HeroCarousel 자동전환 등 외부 effect 의 의존성으로 쓰이므로
  // minX/shouldReduceMotion 변경 시에만 재생성되도록 memo 한다.
  const snapToIndex = useCallback(
    (index: number, positions: number[]) => {
      if (positions.length === 0) return;
      const clampedIndex = Math.min(Math.max(index, 0), positions.length - 1);
      const target = clamp(positions[clampedIndex]);

      if (shouldReduceMotion) {
        x.set(target);
      } else {
        animate(x, target, snapSpring);
      }
      onIndexChangeRef.current?.(clampedIndex);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [minX, shouldReduceMotion]
  );

  function handleDragStart() {
    wasDraggedRef.current = false;
  }

  function handleDrag(_event: DragEventLike, info: PanInfo) {
    if (Math.abs(info.offset.x) > CLICK_SUPPRESS_THRESHOLD_PX) {
      wasDraggedRef.current = true;
    }
  }

  function handleDragEnd(_event: DragEventLike, info: PanInfo) {
    const positions = cardPositions();
    if (positions.length === 0) return;

    let index = nearestIndex(positions, x.get());
    if (Math.abs(info.velocity.x) > FLICK_VELOCITY_THRESHOLD) {
      const direction = info.velocity.x < 0 ? 1 : -1;
      index += direction;
    }
    snapToIndex(index, positions);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const positions = cardPositions();
    if (positions.length === 0) return;

    event.preventDefault();
    const currentIndex = nearestIndex(positions, x.get());
    const direction = event.key === "ArrowRight" ? 1 : -1;
    snapToIndex(currentIndex + direction, positions);
  }

  function handleFocusCapture(event: React.FocusEvent) {
    const track = trackRef.current;
    const container = containerRef.current;
    if (!track || !container) return;

    const card = Array.from(track.children).find((child) =>
      child.contains(event.target as Node)
    ) as HTMLElement | undefined;
    if (!card) return;

    const containerWidth = container.clientWidth;
    const currentX = x.get();
    const cardLeft = card.offsetLeft;
    const cardRight = cardLeft + card.offsetWidth;
    const visibleLeft = -currentX;
    const visibleRight = visibleLeft + containerWidth;

    let target: number | null = null;
    if (cardLeft < visibleLeft) {
      target = -cardLeft;
    } else if (cardRight > visibleRight) {
      target = -(cardRight - containerWidth);
    }
    if (target === null) return;

    const clamped = clamp(target);
    if (shouldReduceMotion) {
      x.set(clamped);
    } else {
      animate(x, clamped, snapSpring);
    }
  }

  function handleClickCapture(event: React.MouseEvent) {
    if (wasDraggedRef.current) {
      event.preventDefault();
      event.stopPropagation();
    }
    wasDraggedRef.current = false;
  }

  const scrollToIndex = useCallback(
    (index: number) => {
      snapToIndex(index, cardPositions());
    },
    [snapToIndex]
  );

  return {
    containerRef,
    trackRef,
    trackProps: {
      drag: "x",
      dragConstraints: { left: minX, right: 0 },
      dragElastic: 0.05,
      dragMomentum: false,
      style: { x },
      onDragStart: handleDragStart,
      onDrag: handleDrag,
      onDragEnd: handleDragEnd,
      onKeyDown: handleKeyDown,
      onFocusCapture: handleFocusCapture,
      onClickCapture: handleClickCapture,
    },
    wasDraggedRef,
    scrollToIndex,
  };
}
