/**
 * RatingBadge — 평점 배지 (03_DESIGN §2.8, §2.1).
 *
 * accent 별 아이콘 + 10점 만점 숫자(tabular-nums). `overlay` variant 는
 * 포스터 위 배치를 위해 bg-overlay 를 두른다(위치는 호출부에서 지정).
 * vote 가 없어(value<=0) 표시할 값이 없으면 렌더하지 않는다(§2.9 — 결측이면
 * 배지 자체 생략, 호출부가 판단하도록 null 반환).
 */
import { cn } from "@/src/lib/clsx/merge";

interface RatingBadgeProps {
  /** vote_average (0~10). */
  value: number;
  /** overlay: 포스터 위(딤 배경) · inline: 텍스트 흐름 내. 기본 inline. */
  variant?: "overlay" | "inline";
  className?: string;
}

export function RatingBadge({
  value,
  variant = "inline",
  className,
}: RatingBadgeProps) {
  // 평점 정보 없음(0점/무투표) → 배지 생략.
  if (!(value > 0)) {
    return null;
  }

  const base =
    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-caption font-semibold";
  const variantClass =
    variant === "overlay"
      ? "bg-overlay text-content-primary backdrop-blur-sm"
      : "text-content-primary";
  const rounded = value.toFixed(1);

  return (
    <span
      className={cn(base, variantClass, className)}
      aria-label={`평점 ${rounded} / 10`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-3 text-accent"
      >
        <path d="M12 2.5l2.9 5.88 6.5.94-4.7 4.58 1.11 6.47L12 17.9l-5.81 3.05 1.11-6.47-4.7-4.58 6.5-.94z" />
      </svg>
      <span className="tabular-nums" aria-hidden="true">
        {rounded}
      </span>
    </span>
  );
}
