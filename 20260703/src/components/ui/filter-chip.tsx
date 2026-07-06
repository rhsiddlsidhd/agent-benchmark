"use client";

/**
 * FilterChip — 선택 가능한 필터 칩 (03_DESIGN §2.5, FR-6).
 *
 * pill radius 의 토글 버튼. default(surface + border) / selected(brand 배경) 두 상태를
 * 가지며 다중 선택 스트립(GenreFilter)에서 재사용한다. 시즌 선택 등 다른 다중/단일
 * 선택 UI 에도 쓸 수 있는 범용 프리미티브라 components/ui 에 둔다.
 *
 * 접근성(§2.5, §6):
 * - 네이티브 <button>(암묵적 role="button") + `aria-pressed` 로 토글 상태를 노출한다.
 * - 선택 상태를 색상만으로 구분하지 않고 체크 아이콘을 병행한다(색맹 대응).
 * - 포커스 링은 globals.css :focus-visible 에 위임한다.
 *
 * 모션(§5): whileTap 축소 피드백만 주고, reduced-motion 이면 변형을 제거한다.
 *
 * 색상 주: 03_DESIGN §2.5 는 selected 를 "brand 배경 + text-primary" 로 표기하나,
 * near-white(content-primary)를 brand(cyan) 위에 얹으면 §6/NFR-4 대비 기준을 통과하지
 * 못한다. 이미 QA 를 통과한 Pill 의 brand variant 와 동일하게 text-base(어두운 전경)를
 * 써 대비를 확보한다. 두 값 모두 기존 디자인 토큰이며 새 값을 만들지 않는다.
 */
import { motion, useReducedMotion } from "framer-motion";

import { cardSpring } from "@/src/lib/motion";

interface FilterChipProps {
  /** 칩 라벨(예: 장르명). */
  label: string;
  /** 선택 여부. aria-pressed 및 스타일/체크 아이콘에 반영. */
  selected: boolean;
  /** 토글 콜백. */
  onToggle: () => void;
  className?: string;
}

export function FilterChip({
  label,
  selected,
  onToggle,
  className,
}: FilterChipProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
      transition={cardSpring}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-1.5 text-body-sm font-medium transition-colors ${
        selected
          ? "bg-brand text-base"
          : "border border-border bg-surface text-content-secondary hover:bg-surface-hover hover:text-content-primary"
      }${className ? ` ${className}` : ""}`}
    >
      {selected ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="size-4"
        >
          <path
            fillRule="evenodd"
            d="M16.704 5.29a1 1 0 0 1 0 1.42l-7.5 7.5a1 1 0 0 1-1.42 0l-3.5-3.5a1 1 0 1 1 1.42-1.42l2.79 2.8 6.79-6.8a1 1 0 0 1 1.42 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : null}
      {label}
    </motion.button>
  );
}
