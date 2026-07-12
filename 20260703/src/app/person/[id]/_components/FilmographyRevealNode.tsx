"use client";

/**
 * FilmographyRevealNode — 필모그래피 타임라인 노드 1건의 진입/퇴장 애니메이션
 * (03_DESIGN §5).
 *
 * 진행선(스크롤 진행률 연동 드로잉, `Filmography.tsx`)이 이 노드의 실제 화면
 * 위치를 "지나가는" 순간과 카드가 나타나는/사라지는 시점을 일치시킨다 —
 * 뷰포트 교차 비율 기반 `whileInView`(고정 임계값)는 진행선의 실제 진행률과
 * 어긋날 수 있어(노드가 타임라인 전체에서 차지하는 위치에 따라 필요한 뷰포트
 * 교차 비율이 달라짐) 쓰지 않는다. 위/아래 스크롤 모두 대응하는 가역 토글 —
 * 스크롤을 올려 진행선이 이 노드를 다시 지나가면 카드도 다시 사라진다.
 *
 * React state/re-render 를 쓰지 않고 `useTransform`+`useSpring` 으로 opacity/y
 * 를 `scrollYProgress` 에서 직접 파생한다 — 타임라인 노드가 수십 개(인물별
 * 필모그래피 길이만큼) 있을 수 있어, 매 스크롤 프레임마다 노드 수만큼 React
 * 재렌더를 강제하면(예: `useMotionValueEvent` 콜백에서 `setState`) 부하가 크다.
 * 진행선(`style={{ scaleY: scrollYProgress }}`)과 동일하게 motion value 구독만
 * 으로 DOM 스타일을 직접 갱신해 React 렌더 트리를 타지 않는다.
 *
 * 이 노드의 진행률 임계값(0~1, 컨테이너 기준 `offsetTop` 비율)은 `threshold`
 * prop으로 부모(`Filmography`)에서 받는다 — 부모가 자기 자신의 레이아웃
 * 이펙트(자식보다 나중에 커밋되어 이 시점엔 컨테이너 DOM이 완성돼 있음)에서
 * 측정해 내려준다. 자식이 직접 컨테이너를 측정하지 않는 이유는, 자식 레이아웃
 * 이펙트는 부모보다 먼저 커밋되어 그 시점엔 부모의 컨테이너 ref 가 아직
 * 붙어있지 않기 때문이다.
 *
 * reduced-motion 이면 y 트랜스폼을 제거하고 opacity만 스프링으로 전환한다
 * (§5, `fadeOnly`/`fadeUp` 컨벤션과 동일 원칙 — 여기선 `variants` 대신 motion
 * value 파생이라 별도 `reduceMotion` prop으로 분기).
 */
import type { ReactNode } from "react";
import { motion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { cardSpring } from "@/src/lib/framer-motion/preset";

const REVEAL_SPRING = { stiffness: cardSpring.stiffness, damping: cardSpring.damping };

interface FilmographyRevealNodeProps {
  scrollYProgress: MotionValue<number>;
  threshold: number;
  reduceMotion: boolean;
  className: string;
  children: ReactNode;
}

export function FilmographyRevealNode({
  scrollYProgress,
  threshold,
  reduceMotion,
  className,
  children,
}: FilmographyRevealNodeProps) {
  const rawOpacity = useTransform(scrollYProgress, (progress): number =>
    progress >= threshold ? 1 : 0
  );
  const opacity = useSpring(rawOpacity, REVEAL_SPRING);
  const y = useTransform(opacity, (value) => (reduceMotion ? 0 : (1 - value) * 20));

  return (
    <motion.li style={{ opacity, y }} className={className}>
      {children}
    </motion.li>
  );
}
