"use client";

/**
 * AdultToggle — 성인 콘텐츠 토글 스위치 (FR-7 / 03_DESIGN §2.4 / 01_ARCHITECTURE §9).
 *
 * pill 스위치. 헤더(RootLayout)와 검색 페이지 두 곳에서 동일 AdultContentContext 를
 * 구독하므로, 어느 쪽을 눌러도 검색·디스커버의 include_adult 상태가 함께 바뀐다.
 *
 * 상태 표기(§2.4):
 * - OFF(기본): `success` 도트 + "성인 콘텐츠 숨김".
 * - ON: `danger` 계열 강조(테두리/배경 틴트 + danger 도트) + "성인 콘텐츠 표시".
 *
 * 접근성(§2.4, §6):
 * - 네이티브 <button> 에 `role="switch"` + `aria-checked` 로 켜짐/꺼짐을 정확히 노출한다.
 * - 상태를 색상만으로 구분하지 않고 도트 위치 + 라벨 텍스트를 병행한다.
 * - 포커스 링은 globals.css :focus-visible 에 위임한다.
 *
 * 모션(§5): 도트 이동은 framer-motion `layout` 으로 부드럽게 전환하되,
 * `prefers-reduced-motion: reduce` 이면 layout 애니메이션을 끄고 즉시 스냅한다(opacity 외
 * 변형 제거 원칙). 새 디자인 토큰을 만들지 않고 success/danger/surface/border 만 사용한다.
 *
 * RootLayout(전역 헤더) + search 라우트가 공유(`src/app/CLAUDE.md` 승격 규칙).
 */
import { motion, useReducedMotion } from "framer-motion";

import { useAdultContent } from "@/src/context/AdultContentContext";
import { cardSpring } from "@/src/lib/framer-motion/preset";

interface AdultToggleProps {
  /** 배치 컨텍스트별 추가 클래스(예: 검색 바에서 shrink-0). */
  className?: string;
}

export function AdultToggle({ className }: AdultToggleProps) {
  const { includeAdult, toggle } = useAdultContent();
  const shouldReduceMotion = useReducedMotion();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={includeAdult}
      onClick={toggle}
      className={`inline-flex items-center gap-2 rounded-pill border px-3 py-2 text-caption transition-colors ${
        includeAdult
          ? "border-danger bg-danger/10 text-danger"
          : "border-border bg-surface text-content-secondary hover:bg-surface-hover hover:text-content-primary"
      }${className ? ` ${className}` : ""}`}
    >
      {/* 도트 트랙: 상태에 따라 좌/우 정렬. 도트 위치가 상태를 색상 외로도 알린다. */}
      <span
        aria-hidden="true"
        className={`flex h-4 w-7 items-center rounded-pill p-0.5 transition-colors ${
          includeAdult ? "justify-end bg-danger/30" : "justify-start bg-success/25"
        }`}
      >
        <motion.span
          layout={!shouldReduceMotion}
          transition={cardSpring}
          className={`size-3 rounded-pill ${
            includeAdult ? "bg-danger" : "bg-success"
          }`}
        />
      </span>
      {includeAdult ? "성인 콘텐츠 표시" : "성인 콘텐츠 숨김"}
    </button>
  );
}
