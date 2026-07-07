/**
 * 홈(`/`) 세그먼트 로딩 UI (T14 · NFR-1/NFR-3, 03_DESIGN §2.6/§5).
 *
 * page.tsx 가 getTrending/getPopularMovies/getPopularTv 를 병렬 조회하는 동안 표시되는
 * 스켈레톤. 히어로(backdrop) + 3개 캐러셀 레일 자리를 미리 잡아 레이아웃 이동(CLS)을 줄인다.
 * globals.css 의 `skeleton` shimmer 유틸을 사용하며 reduced-motion 은 전역 감쇠로 정적 처리(§5).
 *
 * loading.js 는 기본 Server Component 다(node_modules/next/dist/docs — file-conventions/loading).
 */
import { SkeletonCard } from "@/src/components/ui";

/** 가로 스크롤 캐러셀 자리(제목 바 + 카드 6장). */
function RailSkeleton() {
  return (
    <section className="mx-auto w-full max-w-page">
      <div
        className="skeleton mx-gutter h-7 w-32 rounded-md md:mx-gutter-lg"
        aria-hidden="true"
      />
      <div className="mt-4 flex gap-card-gap overflow-hidden px-gutter md:px-gutter-lg">
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonCard
            key={index}
            className="w-32 shrink-0 sm:w-40 md:w-44"
          />
        ))}
      </div>
    </section>
  );
}

export default function HomeLoading() {
  return (
    <div
      className="flex w-full flex-col gap-section pb-section"
      role="status"
      aria-busy="true"
      aria-label="홈 콘텐츠를 불러오는 중"
    >
      {/* 히어로 백드롭 자리. */}
      <div className="skeleton aspect-backdrop w-full" aria-hidden="true" />
      <RailSkeleton />
      <RailSkeleton />
      <RailSkeleton />
    </div>
  );
}
