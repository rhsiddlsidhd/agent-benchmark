"use client";

/**
 * ScrollReveal — 스크롤 뷰포트 진입 시 섹션 단위 페이드업 래퍼 (03_DESIGN §5,
 * 01_ARCHITECTURE §5.5, FR-3/FR-4, NFR-3).
 *
 * `fadeUp` 프리셋(opacity 0→1, y:20→0, duration 0.3, easeOutExpo)을
 * `whileInView` 로 최초 1회만 재생한다(viewport once, amount 0.15 — 살짝
 * 보이자마자 트리거). 섹션당 1블록(제목+콘텐츠 통째)이 트리거 단위이며, 내부
 * 리스트/레일 아이템별 stagger 는 하지 않는다 — 여러 섹션이 이 컴포넌트로
 * 페이지 전체 단일 모션 토큰을 공유한다.
 *
 * reduced-motion 이면 `fadeOnly`(opacity 만) 로 전환한다(§5, Filmography 와
 * 동일 컨벤션).
 */
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeOnly, fadeUp } from "@/src/lib/framer-motion/preset";

interface ScrollRevealProps {
  children: ReactNode;
}

export function ScrollReveal({ children }: ScrollRevealProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={shouldReduceMotion ? fadeOnly : fadeUp}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, amount: 0.15 }}
    >
      {children}
    </motion.div>
  );
}
