/**
 * 장르 탐색 세그먼트 로딩 UI (03_DESIGN §3.6 / §5 shimmer).
 *
 * page.tsx 가 getGenres(영화/TV 장르 목록)를 서버에서 받아오는 동안 표시되는 스켈레톤.
 * 필터 자리(제목/타입/장르)와 결과 그리드 자리를 미리 잡아 레이아웃 이동(CLS)을 줄인다.
 * 실제 결과 조회 중의 로딩은 DiscoverExplorer 내부에서 별도로 처리한다.
 *
 * 필터 플레이스홀더는 SkeletonCard 와 동일하게 globals.css 의 `skeleton` shimmer
 * 유틸을 직접 사용한다(reduced-motion 은 전역 감쇠로 정적 처리 — §5).
 */
import { SkeletonGrid } from "@/src/components/ui";
import { cn } from "@/src/lib/clsx/merge";

const DISCOVER_GRID =
  "grid grid-cols-2 gap-card-gap sm:grid-cols-3 md:grid-cols-4 md:gap-card-gap-lg lg:grid-cols-5 xl:grid-cols-6";

export default function DiscoverLoading() {
  return (
    <div className="flex w-full flex-col gap-section py-section">
      <div className="mx-auto flex w-full max-w-page flex-col gap-4 px-gutter md:px-gutter-lg">
        <div className="skeleton h-8 w-40 rounded-md" aria-hidden="true" />
        <div className="flex gap-2" aria-hidden="true">
          <div className="skeleton h-8 w-16 rounded-pill" />
          <div className="skeleton h-8 w-16 rounded-pill" />
        </div>
        <div className="flex gap-2" aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="skeleton h-8 w-20 rounded-pill" />
          ))}
        </div>
      </div>

      <SkeletonGrid
        count={12}
        className={cn("mx-auto w-full max-w-page px-gutter md:px-gutter-lg", DISCOVER_GRID)}
        label="장르 탐색을 준비하는 중"
      />
    </div>
  );
}
