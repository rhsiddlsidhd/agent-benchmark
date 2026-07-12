"use client";

/**
 * Filmography — 인물 필모그래피 타임라인 (03_DESIGN §3.5).
 *
 * 좌측 고정 수직 레일(모바일은 폭만 축소) + 우측 연도별 카드 클러스터.
 * 크레딧이 있는 연도만 마커가 생기므로(공백 연도 건너뜀) 마커는 시간축
 * 비례 없이 균등 간격으로 늘어선다. 정렬(과거→현재)·연도별 그룹핑·경로
 * 산출은 Server Component(page.tsx, normalizeCredits+groupFilmographyEntries)
 * 에서 끝내고, 여기서는 스크롤 진행률·개별 노드 진입 애니메이션·툴팁 상태만
 * 다룬다(Client 경계 최소화).
 *
 * 한 연도의 카드가 가로 폭을 넘으면 줄바꿈 대신 `ScrollRail`(가로 드래그)을
 * 재사용한다(§2.10, 카드 폭 override 없음 — poster 스펙 그대로).
 *
 * 애니메이션(§5): 레일 진행선은 스크롤 진행률에 1:1 연동해 그려지므로
 * reduced-motion 이어도 유지한다(스크롤 입력 자체가 모션의 원인이라 끄지
 * 않음). 반면 연도/현재 노드는 `ScrollReveal`의 "섹션당 1블록·아이템
 * stagger 금지" 원칙의 이 컴포넌트 한정 예외로 노드별 개별 페이드인을
 * 적용하며, reduced-motion 이면 `fadeOnly`로 전환해 y 이동 등 추가
 * 트랜스폼을 제거한다(`ScrollReveal` 자체는 변경하지 않음).
 *
 * 엣지케이스(§2.9): 연도 클러스터·예정작이 모두 비면 렌더하지 않는다
 * (page.tsx 상위 가드와 이중 보호).
 */
import { useRef } from "react";
import { motion, useReducedMotion, useScroll } from "framer-motion";
import { ScrollRail } from "@/src/components/ui";
import { fadeOnly, fadeUp } from "@/src/lib/framer-motion/preset";
import type { FilmographyProps } from "../_types";
import { FilmographyCard } from "./FilmographyCard";

export function Filmography({ clusters, upcoming }: FilmographyProps) {
  const shouldReduceMotion = useReducedMotion();
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start end", "end start"],
  });

  // 방어적 가드: 클러스터·예정작 모두 비면 렌더하지 않는다(page.tsx 상위 가드와 이중 보호).
  if (clusters.length === 0 && upcoming.length === 0) {
    return null;
  }

  const nodeVariants = shouldReduceMotion ? fadeOnly : fadeUp;

  return (
    <section
      aria-label="필모그래피"
      className="mx-auto w-full max-w-page px-gutter md:px-gutter-lg"
    >
      <h2 className="text-h2 text-content-primary">필모그래피</h2>

      <div ref={timelineRef} className="relative mt-4">
        {/* 레일 베이스 라인(항상 노출) — ol 콘텐츠 높이만큼 top-0/bottom-0 로 늘어난다. */}
        <div
          aria-hidden="true"
          className="absolute left-3 top-0 bottom-0 w-px bg-border md:left-4"
        />
        {/* 스크롤 진행률 연동 드로잉 라인. reduced-motion 이어도 유지(스크롤 입력 1:1 연동). */}
        <motion.div
          aria-hidden="true"
          style={{ scaleY: scrollYProgress }}
          className="absolute left-3 top-0 bottom-0 w-px origin-top bg-brand md:left-4"
        />

        <ol className="flex flex-col">
          {clusters.map((cluster) => (
            <motion.li
              key={cluster.year}
              variants={nodeVariants}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, amount: 0.3 }}
              className="relative pb-8 pl-7 md:pb-10 md:pl-10"
            >
              <span
                aria-hidden="true"
                className="absolute left-3 top-1 size-2.5 -translate-x-1/2 rounded-full bg-brand md:left-4 md:size-3"
              />
              <h3 className="text-h3 tabular-nums text-content-primary">
                {cluster.year}
              </h3>
              <div className="mt-3">
                <ScrollRail>
                  {cluster.entries.map((entry) => (
                    <li key={entry.key}>
                      <FilmographyCard entry={entry} />
                    </li>
                  ))}
                </ScrollRail>
              </div>
            </motion.li>
          ))}

          {/* 진행선 끝 "현재" 노드 — 예정 구역 진입 전 시간 기준점. */}
          <motion.li
            variants={nodeVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            className="relative pl-7 md:pl-10"
          >
            <span
              aria-hidden="true"
              className="absolute left-3 top-1 size-2.5 -translate-x-1/2 rounded-full border-2 border-base bg-content-muted md:left-4 md:size-3"
            />
            <p className="text-body-sm font-medium text-content-secondary">
              현재
            </p>
          </motion.li>
        </ol>
      </div>

      {/* 예정(미공개) 구역 — 날짜 없는 작품, 레일과 별도 렌더(§2.9). */}
      {upcoming.length > 0 ? (
        <div className="mt-8 border-t border-border pt-6 md:mt-10">
          <h3 className="text-h3 text-content-primary">공개 예정</h3>
          <div className="mt-3">
            <ScrollRail>
              {upcoming.map((entry) => (
                <li key={entry.key}>
                  <FilmographyCard entry={entry} />
                </li>
              ))}
            </ScrollRail>
          </div>
        </div>
      ) : null}
    </section>
  );
}
