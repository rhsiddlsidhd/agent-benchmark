/**
 * Pill / Tag — 장르·상태 라벨 (03_DESIGN §2.8).
 *
 * caption 타이포 + pill radius. 장르 표기 등 비인터랙티브 라벨용
 * (선택 가능한 필터 칩은 FR-6 의 GenreFilter/FilterChip 에서 별도 구현).
 * 토큰만 사용하며 Server Component 로 동작한다.
 */
import type { ReactNode } from "react";
import { cn } from "@/src/lib/clsx/merge";

type PillVariant = "default" | "brand" | "outline";

interface PillProps {
  children: ReactNode;
  /** default: surface · brand: 강조 · outline: 테두리만. 기본 default. */
  variant?: PillVariant;
  className?: string;
}

const variantClass: Record<PillVariant, string> = {
  default: "bg-surface text-content-secondary",
  brand: "bg-brand text-base",
  outline: "border border-border text-content-secondary",
};

export function Pill({ children, variant = "default", className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-1 text-caption font-medium",
        variantClass[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
