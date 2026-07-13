"use client";

/**
 * Button — 버튼 (03_DESIGN §2.3).
 *
 * variant(primary/secondary/ghost/danger) · size(sm/md/lg). active(scale 0.98)
 * 은 framer-motion whileTap 으로 처리하되, reduced-motion 이면 변형을 제거한다(§5).
 * hover/disabled/focus 는 토큰 유틸로 표현하며 포커스 링은 globals.css
 * :focus-visible 에 위임한다(§6). 무한 반복 스피너는 §5 정책상 사용하지 않고,
 * 로딩 시 aria-busy + disabled 로 상태를 표현한다.
 */
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/src/lib/clsx/merge";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 로딩 상태 — 비활성 + aria-busy. */
  isLoading?: boolean;
  children: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-base hover:bg-brand-strong disabled:hover:bg-brand",
  secondary:
    "border border-border bg-surface text-content-primary hover:bg-surface-hover disabled:hover:bg-surface",
  ghost:
    "bg-transparent text-content-primary hover:bg-surface disabled:hover:bg-transparent",
  danger:
    "bg-transparent text-danger hover:bg-danger/10 disabled:hover:bg-transparent",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-body-sm",
  md: "h-10 px-4 text-body-sm",
  lg: "h-12 px-5 text-body",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const shouldReduceMotion = useReducedMotion();
  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      type="button"
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      whileTap={shouldReduceMotion || isDisabled ? undefined : { scale: 0.98 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        sizeClass[size],
        variantClass[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
