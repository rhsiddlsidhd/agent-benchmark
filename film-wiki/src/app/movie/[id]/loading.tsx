/**
 * 영화 상세(`/movie/[id]`) 세그먼트 로딩 UI (T14 · NFR-1/NFR-3, 03_DESIGN §2.6/§5).
 *
 * page.tsx 가 getMovie/getMovieCredits/getMovieRecommendations 를 조회하는 동안
 * 표시되는 스켈레톤. 히어로(backdrop) + 오버랩 포스터 + 제목/메타 + 줄거리 + 출연진
 * 레일 자리를 미리 잡아 레이아웃 이동(CLS)을 줄인다(§3.3 구조 대응).
 * globals.css 의 `skeleton` shimmer 유틸을 사용하며 reduced-motion 은 전역 감쇠로 정적 처리(§5).
 */
export default function MovieDetailLoading() {
  return (
    <div
      className="flex w-full flex-col gap-section pb-section"
      role="status"
      aria-busy="true"
      aria-label="영화 정보를 불러오는 중"
    >
      {/* 히어로 백드롭 자리. */}
      <div className="aspect-backdrop w-full skeleton" aria-hidden="true" />

      {/* 포스터 오버랩 + 제목/메타 자리. */}
      <div className="mx-auto -mt-16 w-full max-w-page px-gutter md:-mt-24 md:px-gutter-lg">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
          <div
            className="aspect-poster w-28 shrink-0 skeleton rounded-lg sm:w-36 md:w-48"
            aria-hidden="true"
          />
          <div
            className="flex flex-1 flex-col gap-3 sm:pb-2"
            aria-hidden="true"
          >
            <div className="h-9 w-3/4 skeleton rounded-md" />
            <div className="flex flex-wrap gap-2">
              <div className="h-6 w-16 skeleton rounded-pill" />
              <div className="h-6 w-20 skeleton rounded-pill" />
              <div className="h-6 w-16 skeleton rounded-pill" />
            </div>
            <div className="h-5 w-24 skeleton rounded-md" />
          </div>
        </div>
      </div>

      {/* 줄거리 자리. */}
      <div
        className="mx-auto flex w-full max-w-page flex-col gap-3 px-gutter md:px-gutter-lg"
        aria-hidden="true"
      >
        <div className="h-7 w-24 skeleton rounded-md" />
        <div className="h-4 w-full max-w-3xl skeleton rounded-md" />
        <div className="h-4 w-full max-w-2xl skeleton rounded-md" />
      </div>

      {/* 출연진 레일 자리. */}
      <div className="mx-auto w-full max-w-page" aria-hidden="true">
        <div className="mx-gutter h-7 w-28 skeleton rounded-md md:mx-gutter-lg" />
        <div className="mt-4 flex gap-4 overflow-hidden px-gutter md:px-gutter-lg">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="flex w-20 shrink-0 flex-col gap-2">
              <div className="aspect-square w-full skeleton rounded-lg" />
              <div className="h-3 w-3/4 skeleton rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
