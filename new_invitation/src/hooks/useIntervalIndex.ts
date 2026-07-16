"use client";

import { useState, useEffect, useCallback } from "react";

interface UseIntervalIndexProps {
  /** 순환할 아이템의 총 개수 */
  length: number;
  /** 자동 순환 일시정지 여부 (기본값: false) */
  isPaused?: boolean;
  /** 순환 간격 ms (기본값: 4000) */
  interval?: number;
}

/**
 * 주어진 길이를 바탕으로 일정 시간마다 인덱스를 순환시키는 범용 훅
 * 캐러셀, 공지사항 바, 프로모션 배너 등에 사용됩니다.
 */
export const useIntervalIndex = ({
  length,
  isPaused = false,
  interval = 4000,
}: UseIntervalIndexProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 다음 인덱스로 이동 (수동 조작 시에도 사용 가능)
  const next = useCallback(() => {
    if (length <= 0) return;
    setCurrentIndex((prev) => (prev + 1) % length);
  }, [length]);

  // 특정 인덱스로 직접 이동 (탭 클릭 등)
  const setIndex = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  useEffect(() => {
    // 아이템이 없거나 하나뿐이면 타이머가 필요 없음
    // 혹은 외부에서 일시정지 상태인 경우
    if (length <= 1 || isPaused) return;

    const timer = setInterval(next, interval);

    return () => clearInterval(timer);
  }, [length, interval, isPaused, next]);

  return {
    currentIndex,
    setIndex,
    next,
  };
};
