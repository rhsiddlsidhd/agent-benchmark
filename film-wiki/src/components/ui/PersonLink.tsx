"use client";

/**
 * PersonLink — 출연진/제작진 아바타를 인물 상세로 잇는 링크 (03_DESIGN §3.3, §3.4, §5).
 *
 * PersonAvatar 는 서버 안전한 표시용 컴포넌트이고 링크/모션은 호출부 책임이므로
 * (PersonAvatar.tsx 주석 참조), 여기서 Link + framer-motion hover/tap 을 얹는다.
 * ContentCard 와 동일한 cardSpring · whileHover/whileTap 프리셋을 재사용하고,
 * reduced-motion 이면 변형을 제거한다(§5). 콘텐츠→인물 탐색 흐름(PRD §2)의 진입점.
 * movie/[id]·tv/[id] 상세가 공유(`src/app/CLAUDE.md` 승격 규칙).
 */
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cardSpring } from "@/src/lib/framer-motion/preset";
import { PersonAvatar } from "./PersonAvatar";

const MotionLink = motion.create(Link);

interface PersonLinkProps {
  /** 인물 상세 경로(/person/[id]). */
  href: string;
  /** TMDB profile_path (null 이면 이니셜 플레이스홀더). */
  path: string | null;
  /** 인물 이름(alt/접근명). */
  name: string;
  /** 배역(character) 또는 직무(job). 없으면 줄 생략. */
  role?: string | null;
}

export function PersonLink({ href, path, name, role }: PersonLinkProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <MotionLink
      href={href}
      aria-label={name}
      draggable={false}
      className="block rounded-lg"
      whileHover={shouldReduceMotion ? undefined : { scale: 1.04, y: -4 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
      transition={cardSpring}
    >
      <PersonAvatar path={path} name={name} role={role} />
    </MotionLink>
  );
}
