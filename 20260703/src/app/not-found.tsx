/**
 * 루트 Not Found (T14 · 03_DESIGN §2.7).
 *
 * 매칭되는 라우트가 없는 URL(오타·삭제된 링크 등) 진입 시 App Router 가 렌더하는
 * 앱 전역 404 화면. 상세 라우트(movie/tv/person)는 각자의 not-found.tsx 로
 * notFound() 를 잡으므로, 이 파일은 그 외 미매칭 경로의 fallback 이다.
 *
 * 색상/타이포/spacing/radius 는 03_DESIGN 토큰만 사용한다. h1 은 페이지당 하나만 둔다.
 */
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-page flex-1 flex-col items-center justify-center gap-4 px-gutter py-section text-center md:px-gutter-lg">
      <p className="text-overline text-brand">404</p>
      <h1 className="text-display text-content-primary">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="max-w-md text-body text-content-secondary">
        요청하신 페이지가 존재하지 않거나 주소가 변경되었습니다. 홈에서 다시
        탐색해 보세요.
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
