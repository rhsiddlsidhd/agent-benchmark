import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { renderHook } from "@testing-library/react";

import { useDebouncedValue } from "./useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("delay가 지나기 전에는 최초 값을 유지한다", () => {
    const { result } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "a", delay: 300 } },
    );

    expect(result.current).toBe("a");
  });

  it("delay만큼 경과하면 최신 값으로 갱신된다", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "a", delay: 300 } },
    );

    rerender({ value: "ab", delay: 300 });
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe("ab");
  });

  it("delay 안에 값이 다시 바뀌면 이전 타이머가 취소된다(디바운스)", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "a", delay: 300 } },
    );

    rerender({ value: "ab", delay: 300 });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: "abc", delay: 300 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // "ab" 타이머는 취소됐어야 하므로 아직 "a" — 200ms + 200ms = 400ms가
    // 지났어도 "abc" 기준 타이머는 300ms를 못 채웠다.
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe("abc");
  });
});
