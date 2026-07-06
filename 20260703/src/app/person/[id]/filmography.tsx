"use client";

/**
 * Filmography — 인물 필모그래피 출연/제작 토글 + ContentCard 그리드 (03_DESIGN §3.5).
 *
 * 출연작(cast)/제작 참여(crew) 를 세그먼트 토글로 전환하고, 선택된 배열을
 * 포스터 그리드(§4 grid-cols 규칙)로 렌더한다. 각 카드는 media_type 에 따라
 * /movie/[id] 또는 /tv/[id] 로 이어져 인물→작품 탐색 흐름(PRD §2)을 완결한다.
 * 정렬(최신순)·중복 제거·경로 산출은 Server Component(page.tsx)에서 끝내고,
 * 여기서는 토글 상태만 관리한다(Client 경계 최소화).
 *
 * 토글 인터랙션/카드 등장은 framer-motion 으로 처리하고 reduced-motion 이면
 * opacity 외 변형을 제거한다(§5). 색/타이포/spacing/radius 는 03_DESIGN 토큰만
 * 사용한다.
 *
 * 엣지케이스(§2.9): cast/crew 중 비어 있는 구분은 토글 버튼 자체를 렌더하지
 * 않는다(빈 리스트는 섹션/컨트롤을 숨김). 둘 다 비면 컴포넌트를 렌더하지 않는다
 * (page.tsx 에서도 상위 가드로 숨김).
 */
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ContentCard } from "@/src/components/ui";
import { cardSpring, fadeOnly, fadeUp } from "@/src/lib/motion";

/** 필모그래피 카드 1건의 표시용 뷰 모델(정렬·중복 제거는 서버에서 완료). */
export interface FilmographyEntry {
  /** 리스트 key 및 중복 제거 키(media_type:id). */
  key: string;
  /** 작품 상세 경로(/movie/[id] | /tv/[id]). */
  href: string;
  /** 작품 제목(영화 title | TV name). */
  title: string;
  /** TMDB poster_path (null 이면 플레이스홀더). */
  posterPath: string | null;
  /** 개봉/방영 연도(없으면 null → 카드가 대체 문구). */
  year: string | null;
  /** vote_average (0 이하이면 카드가 배지 생략). */
  rating: number | null;
}

type FilmographyTab = "cast" | "crew";

interface FilmographyProps {
  /** 출연작(최신순 정렬·중복 제거 완료). */
  castEntries: FilmographyEntry[];
  /** 제작 참여작(최신순 정렬·중복 제거 완료). */
  crewEntries: FilmographyEntry[];
}

/** 포스터 그리드 반응형 열 수(§4 — 검색 결과 그리드와 동일 토큰). */
const GRID_CLASS =
  "grid grid-cols-2 gap-card-gap sm:grid-cols-3 md:grid-cols-4 md:gap-card-gap-lg lg:grid-cols-6";

/** 세그먼트 토글 버튼(터치 타깃 44px 이상, §4). aria-pressed 로 선택 상태 노출. */
function TabButton({
  isActive,
  onClick,
  label,
  count,
}: {
  isActive: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
      transition={cardSpring}
      className={`inline-flex h-11 items-center gap-1.5 rounded-pill px-4 text-body-sm font-medium transition-colors ${
        isActive
          ? "bg-brand text-base"
          : "bg-surface text-content-secondary hover:bg-surface-hover"
      }`}
    >
      <span>{label}</span>
      <span className={isActive ? "text-base" : "text-content-muted"}>
        {count}
      </span>
    </motion.button>
  );
}

export function Filmography({ castEntries, crewEntries }: FilmographyProps) {
  const shouldReduceMotion = useReducedMotion();
  const hasCast = castEntries.length > 0;
  const hasCrew = crewEntries.length > 0;

  // 기본 탭: 출연작이 있으면 출연작, 없으면 제작 참여.
  const [activeTab, setActiveTab] = useState<FilmographyTab>(
    hasCast ? "cast" : "crew"
  );

  // 방어적 가드: 둘 다 비면 렌더하지 않는다(page.tsx 상위 가드와 이중 보호).
  if (!hasCast && !hasCrew) {
    return null;
  }

  const entries = activeTab === "cast" ? castEntries : crewEntries;

  return (
    <section
      aria-label="필모그래피"
      className="mx-auto w-full max-w-page px-gutter md:px-gutter-lg"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-h2 text-content-primary">필모그래피</h2>
        <div role="group" aria-label="필모그래피 구분" className="flex gap-2">
          {hasCast ? (
            <TabButton
              isActive={activeTab === "cast"}
              onClick={() => setActiveTab("cast")}
              label="출연작"
              count={castEntries.length}
            />
          ) : null}
          {hasCrew ? (
            <TabButton
              isActive={activeTab === "crew"}
              onClick={() => setActiveTab("crew")}
              label="제작 참여"
              count={crewEntries.length}
            />
          ) : null}
        </div>
      </div>

      {/* key={activeTab} 로 탭 전환 시 그리드를 재마운트해 등장 모션을 재생. */}
      <motion.ul
        key={activeTab}
        variants={shouldReduceMotion ? fadeOnly : fadeUp}
        initial="initial"
        animate="animate"
        className={`mt-4 ${GRID_CLASS}`}
      >
        {entries.map((entry) => (
          <li key={entry.key}>
            <ContentCard
              href={entry.href}
              title={entry.title}
              posterPath={entry.posterPath}
              year={entry.year}
              rating={entry.rating}
            />
          </li>
        ))}
      </motion.ul>
    </section>
  );
}
