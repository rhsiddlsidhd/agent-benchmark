/**
 * Skeleton — 로딩 상태 (03_DESIGN §2.6, NFR-1/NFR-3).
 *
 * globals.css 의 `skeleton` 유틸(shimmer keyframe + --animate-shimmer 토큰)을
 * 활용한다. 실제 콘텐츠와 동일한 종횡비/크기를 유지해 레이아웃 점프를 막는다.
 * reduced-motion 은 globals.css @layer base 전역 감쇠로 정적 회색이 된다(§5).
 *
 * JS 애니메이션이 없으므로 Server Component 로 동작한다.
 */
import { cn } from "@/src/lib/clsx/merge";

type SkeletonVariant = "card" | "poster" | "backdrop" | "text" | "line";

interface SkeletonProps {
  /** 프리셋. 기본 line. */
  variant?: SkeletonVariant;
  className?: string;
}

const variantClass: Record<SkeletonVariant, string> = {
  // 카드: 포스터(2/3) + 제목/메타 라인 묶음.
  card: "",
  poster: "skeleton aspect-poster w-full rounded-lg",
  backdrop: "skeleton aspect-backdrop w-full rounded-lg",
  text: "skeleton h-4 w-3/4 rounded-md",
  line: "skeleton h-4 w-full rounded-md",
};

export function Skeleton({ variant = "line", className }: SkeletonProps) {
  if (variant === "card") {
    return <SkeletonCard className={className} />;
  }
  return (
    <div className={cn(variantClass[variant], className)} aria-hidden="true" />
  );
}

/** ContentCard 형태 스켈레톤(포스터 + 제목 + 메타). */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-hidden="true">
      <div className="aspect-poster w-full skeleton rounded-lg" />
      <div className="h-4 w-3/4 skeleton rounded-md" />
      <div className="h-3 w-1/2 skeleton rounded-md" />
    </div>
  );
}

/**
 * 로딩 영역 래퍼 — 스크린리더에 진행 상태 안내(§6).
 * 무한스크롤/검색 결과 로딩 시 aria-busy/aria-live 를 부여해 사용한다.
 */
export function SkeletonGrid({
  count = 6,
  className,
  label = "콘텐츠를 불러오는 중",
}: {
  count?: number;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={className}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
