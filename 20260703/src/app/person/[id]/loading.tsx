/**
 * 인물 상세(`/person/[id]`) 세그먼트 로딩 UI (T14 · NFR-1/NFR-3, 03_DESIGN §2.6/§5).
 *
 * page.tsx 가 getPerson/getPersonCombinedCredits 를 조회하는 동안 표시되는 스켈레톤.
 * 프로필(aspect-profile) + 이름/약력 + 필모그래피 그리드 자리를 미리 잡아 레이아웃
 * 이동(CLS)을 줄인다(§3.5 구조 대응 — 모바일 세로 스택 / md 이상 가로 배치).
 * globals.css 의 `skeleton` shimmer 유틸을 사용하며 reduced-motion 은 전역 감쇠로 정적 처리(§5).
 */
import { SkeletonCard } from "@/src/components/ui";

const FILMOGRAPHY_GRID =
  "grid grid-cols-2 gap-card-gap sm:grid-cols-3 md:grid-cols-4 md:gap-card-gap-lg lg:grid-cols-6";

export default function PersonDetailLoading() {
  return (
    <div
      className="flex w-full flex-col gap-section pb-section"
      role="status"
      aria-busy="true"
      aria-label="인물 정보를 불러오는 중"
    >
      {/* 프로필 + 이름/약력 자리(모바일 세로 / md 가로). */}
      <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-gutter py-section md:flex-row md:gap-8 md:px-gutter-lg">
        <div className="w-40 shrink-0 sm:w-48 md:w-56" aria-hidden="true">
          <div className="skeleton aspect-profile w-full rounded-lg" />
        </div>
        <div className="flex flex-1 flex-col gap-3" aria-hidden="true">
          <div className="skeleton h-9 w-2/3 rounded-md" />
          <div className="flex gap-2">
            <div className="skeleton h-6 w-20 rounded-pill" />
            <div className="skeleton h-6 w-28 rounded-md" />
          </div>
          <div className="mt-1 flex flex-col gap-2">
            <div className="skeleton h-6 w-16 rounded-md" />
            <div className="skeleton h-4 w-full max-w-3xl rounded-md" />
            <div className="skeleton h-4 w-full max-w-3xl rounded-md" />
            <div className="skeleton h-4 w-2/3 rounded-md" />
          </div>
        </div>
      </div>

      {/* 필모그래피 그리드 자리. */}
      <div
        className={`mx-auto w-full max-w-page px-gutter md:px-gutter-lg ${FILMOGRAPHY_GRID}`}
        aria-hidden="true"
      >
        {Array.from({ length: 12 }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </div>
  );
}
