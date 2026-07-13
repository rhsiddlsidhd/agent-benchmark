/**
 * 인물 상세 전용 Not Found (03_DESIGN §2.7 — 존재하지 않는 id 는 ErrorState 가
 * 아니라 별도 전용 레이아웃으로 처리).
 *
 * page.tsx 에서 getPerson 이 null(TMDB 404)이거나 id 파싱이 불가할 때 notFound()
 * 로 진입한다. 색상/타이포/spacing/radius 는 03_DESIGN 토큰만 사용한다.
 */
import Link from "next/link";

export default function PersonNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-page flex-1 flex-col items-center justify-center gap-4 px-gutter py-section text-center md:px-gutter-lg">
      <p className="text-overline text-brand">404</p>
      <h1 className="text-display text-content-primary">
        인물을 찾을 수 없습니다
      </h1>
      <p className="max-w-md text-body text-content-secondary">
        요청하신 인물이 존재하지 않거나 삭제되었습니다. 다른 작품을 탐색해
        보세요.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-body-sm font-medium text-base transition-colors hover:bg-brand-strong"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
