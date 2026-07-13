/**
 * framer-motion 공통 모션 프리셋 (03_DESIGN §5).
 *
 * 전역 원칙: duration 150~300ms, ease easeOutExpo 계열.
 * `prefers-reduced-motion: reduce` 대응은 각 클라이언트 컴포넌트에서
 * `useReducedMotion()` 훅으로 분기해 opacity 외 변형을 제거한다
 * (CSS 레벨 전역 감쇠는 globals.css @layer base 에서 별도 처리).
 */
import type { Transition, Variants } from "framer-motion";

/** easeOutExpo 계열 베지어 (§5). */
export const easeOutExpo: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** 섹션/카드 등장 페이드업 (§5). */
export const fadeUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: easeOutExpo },
  },
};

/** reduced-motion 시 opacity 만 남기는 페이드 (§5). */
export const fadeOnly: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
};

/** 카드 hover/tap 스프링 (§5, ContentCard). */
export const cardSpring: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 24,
};
