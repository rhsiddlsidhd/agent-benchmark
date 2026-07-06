/**
 * TV 상세(`/tv/[id]`) 세그먼트 로딩 UI (T14 · NFR-1/NFR-3, 03_DESIGN §2.6/§5).
 *
 * page.tsx 가 getTvShow(+크레딧/추천)를 조회하는 동안 표시되는 스켈레톤. 히어로
 * (backdrop) + 오버랩 포스터 + 제목/메타 + 개요 + 출연진 레일 자리를 미리 잡아
 * 레이아웃 이동(CLS)을 줄인다(§3.4 히어로 구조 대응). 시즌/에피소드 로딩은
 * SeasonSelector 내부에서 별도 처리한다.
 * globals.css 의 `skeleton` shimmer 유틸을 사용하며 reduced-motion 은 전역 감쇠로 정적 처리(§5).
 */
export default function TvDetailLoading() {
  return (
    <div
      className="flex w-full flex-col gap-section pb-section"
      role="status"
      aria-busy="true"
      aria-label="TV 정보를 불러오는 중"
    >
      {/* 히어로 백드롭 자리. */}
      <div className="skeleton aspect-backdrop w-full" aria-hidden="true" />

      {/* 포스터 오버랩 + 제목/메타 자리. */}
      <div className="mx-auto -mt-16 w-full max-w-page px-gutter md:-mt-24 md:px-gutter-lg">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
          <div
            className="skeleton aspect-poster w-28 shrink-0 rounded-lg sm:w-36 md:w-48"
            aria-hidden="true"
          />
          <div className="flex flex-1 flex-col gap-3 sm:pb-2" aria-hidden="true">
            <div className="skeleton h-9 w-3/4 rounded-md" />
            <div className="flex flex-wrap gap-2">
              <div className="skeleton h-6 w-16 rounded-pill" />
              <div className="skeleton h-6 w-20 rounded-pill" />
              <div className="skeleton h-6 w-16 rounded-pill" />
            </div>
            <div className="skeleton h-5 w-24 rounded-md" />
          </div>
        </div>
      </div>

      {/* 개요 자리. */}
      <div
        className="mx-auto flex w-full max-w-page flex-col gap-3 px-gutter md:px-gutter-lg"
        aria-hidden="true"
      >
        <div className="skeleton h-7 w-24 rounded-md" />
        <div className="skeleton h-4 w-full max-w-3xl rounded-md" />
        <div className="skeleton h-4 w-full max-w-2xl rounded-md" />
      </div>

      {/* 출연진 레일 자리. */}
      <div className="mx-auto w-full max-w-page" aria-hidden="true">
        <div className="skeleton mx-gutter h-7 w-28 rounded-md md:mx-gutter-lg" />
        <div className="mt-4 flex gap-4 overflow-hidden px-gutter md:px-gutter-lg">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="flex w-20 shrink-0 flex-col gap-2">
              <div className="skeleton aspect-square w-full rounded-lg" />
              <div className="skeleton h-3 w-3/4 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
