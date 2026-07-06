"use client";

/**
 * 영화 상세 세그먼트 Error Boundary (03_DESIGN §2.7 / 01_ARCHITECTURE §4).
 *
 * getMovieCredits/getMovieRecommendations 등 TMDB fetch 실패(타임아웃/5xx/네트워크)
 * 를 이 세그먼트 안에서 잡아 ErrorState 로 노출하고 재시도한다. 루트 error.tsx 와
 * 동일 패턴이지만, 세그먼트 전용으로 두어 상세 페이지만 재요청·재렌더한다.
 *
 * Next.js 16.2 부터 error 파일은 `unstable_retry` prop 을 제공한다(v16.2.0, node
 * _modules/next/dist/docs 확인). 실패한 데이터 페치를 다시 시도해야 하므로 단순
 * 재렌더만 하는 reset() 대신 재요청까지 수행하는 unstable_retry() 를 연결한다.
 *
 * 존재하지 않는 id 는 이 경계가 아니라 notFound()/not-found.tsx 로 처리한다.
 */
import { useEffect } from "react";
import { ErrorState } from "@/src/components/ui";

export default function MovieDetailError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // 원인 파악용 로깅(에러를 조용히 삼키지 않는다).
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-page flex-1 items-center justify-center px-gutter md:px-gutter-lg">
      <ErrorState onRetry={unstable_retry} />
    </div>
  );
}
