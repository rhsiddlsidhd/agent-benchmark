"use client";

/**
 * HeroCarousel — 홈 히어로 자동전환 캐러셀 (03_DESIGN §3.1/§5/§6, TODO.md 히어로 확장).
 *
 * T4 `getHeroCarouselItems()` 결과(3~5개)를 받아 자동 전환한다. 정적 Server
 * Component였던 히어로가 자동전환 상태를 가져야 해서 Client Component로 전환됐다.
 * 마크업이 `ScrollRail`과 달라(레일이 아닌 풀블리드 슬라이드 1장씩) `ScrollRail`을
 * 쓰지 않고 `useDragScroll`만 직접 사용 — 슬라이드 1장 = 카드 1개로 취급해 드래그/
 * 키보드/스냅 로직을 그대로 재사용한다.
 *
 * 접근성(WCAG 2.2.2 Pause/Stop/Hide, NFR-4): 일시정지 버튼으로 자동전환을 완전히
 * 멈출 수 있다. `prefers-reduced-motion: reduce`이면 자동전환 타이머 자체를
 * 실행하지 않는다(CSS 감쇠만으로는 setInterval 자체가 안 멈춰서 콘텐츠가 계속
 * 자동으로 바뀌는 문제를 방지). 개요(overview) 결측 시 대체 문구로 표시(섹션 숨김
 * 아님, §2.9).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BackdropImage } from "@/src/components/ui";
import { useDragScroll } from "@/src/hooks";
import { cn } from "@/src/lib/clsx/merge";
import type { MovieSearchResult, TVSearchResult } from "@/src/lib/tmdb/types";

/** 자동 전환 간격(ms). */
const AUTOPLAY_INTERVAL_MS = 6000;

type HeroItem = MovieSearchResult | TVSearchResult;

interface HeroCarouselProps {
  items: HeroItem[];
}

function heroTitle(item: HeroItem): string {
  return item.media_type === "movie" ? item.title : item.name;
}

function heroHref(item: HeroItem): string {
  return `/${item.media_type}/${item.id}`;
}

export function HeroCarousel({ items }: HeroCarouselProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const activeIndexRef = useRef(0);

  const handleIndexChange = useCallback((index: number) => {
    activeIndexRef.current = index;
    setActiveIndex(index);
  }, []);

  const { containerRef, trackRef, trackProps, scrollToIndex } =
    useDragScroll<HTMLDivElement>({ onIndexChange: handleIndexChange });

  // 자동전환: reduced-motion 이거나 일시정지 상태면 타이머 자체를 실행하지 않는다.
  useEffect(() => {
    if (shouldReduceMotion || isPaused || items.length <= 1) return;

    const id = setInterval(() => {
      scrollToIndex((activeIndexRef.current + 1) % items.length);
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [shouldReduceMotion, isPaused, items.length, scrollToIndex]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-label="지금 뜨는 콘텐츠" className="relative w-full">
      <div ref={containerRef} className="overflow-hidden">
        <motion.div ref={trackRef} {...trackProps} className="flex">
          {items.map((item, index) => {
            const title = heroTitle(item);
            const isActive = index === activeIndex;
            const TitleTag = isActive ? "h1" : "p";

            return (
              <div
                key={`${item.media_type}-${item.id}`}
                className="relative w-full shrink-0"
                aria-hidden={!isActive}
              >
                <BackdropImage
                  path={item.backdrop_path}
                  alt={title}
                  size="w1280"
                  sizes="100vw"
                  preload={index === 0}
                  className="max-h-[60vh] min-h-[420px] w-full"
                />
                {/* 하단 텍스트 보호 그라데이션(§3.1). */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-base via-base/40 to-transparent"
                />
                <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-page px-gutter pb-8 md:px-gutter-lg md:pb-section">
                  <p className="text-overline text-brand">지금 뜨는 콘텐츠</p>
                  <TitleTag className="mt-2 max-w-2xl text-display text-content-primary">
                    {title}
                  </TitleTag>
                  <p className="mt-3 line-clamp-3 max-w-xl text-body text-content-secondary">
                    {item.overview ? item.overview : "줄거리 정보가 없습니다."}
                  </p>
                  <Link
                    href={heroHref(item)}
                    className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 text-body-sm font-medium text-base transition-colors hover:bg-brand-strong"
                  >
                    상세 정보 보기
                  </Link>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {items.length > 1 ? (
        <div className="absolute right-4 bottom-4 flex items-center gap-3 md:right-6 md:bottom-6">
          <div className="flex gap-2">
            {items.map((item, index) => (
              <button
                key={`${item.media_type}-${item.id}-dot`}
                type="button"
                aria-label={`${index + 1}번째 슬라이드로 이동: ${heroTitle(item)}`}
                aria-current={index === activeIndex}
                onClick={() => scrollToIndex(index)}
                className={cn(
                  "h-2 w-2 rounded-pill transition-colors",
                  index === activeIndex ? "bg-brand" : "bg-content-muted",
                )}
              />
            ))}
          </div>
          {/* WCAG 2.2.2 Pause/Stop/Hide — 자동전환 일시정지 컨트롤(NFR-4). */}
          <button
            type="button"
            aria-pressed={isPaused}
            onClick={() => setIsPaused((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-pill bg-overlay text-content-primary"
          >
            <span aria-hidden="true">{isPaused ? "▶" : "❚❚"}</span>
            <span className="sr-only">
              {isPaused ? "자동 전환 재생" : "자동 전환 일시정지"}
            </span>
          </button>
        </div>
      ) : null}
    </section>
  );
}
