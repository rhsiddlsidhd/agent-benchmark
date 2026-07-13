"use client";

/**
 * 세그먼트 Error Boundary (홈 및 자체 error.tsx 가 없는 라우트의 fallback).
 * 03_DESIGN §2.7 / 01_ARCHITECTURE §4 — TMDB fetch 실패(타임아웃/5xx/네트워크)
 * 를 여기서 잡아 ErrorState 로 노출하고 재시도를 제공한다.
 *
 * Next.js 16.2 부터 error 파일은 `unstable_retry` prop 을 제공한다(v16.2.0
 * 추가, node_modules/next/dist/docs 확인). 여기서는 실패한 데이터 페치를 다시
 * 시도해야 하므로, 단순 재렌더만 하는 `reset()` 대신 재요청까지 수행하는
 * `unstable_retry()` 를 재시도 핸들러로 연결한다.
 *
 * 존재하지 않는 id 는 이 경계가 아니라 notFound()/not-found.tsx 로 처리한다.
 */
import { useEffect } from "react";
import { ErrorState } from "@/src/components/ui";

export default function SegmentError({
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
    <div className="mx-auto flex w-full max-w-page flex-1 items-center justify-center">
      <ErrorState onRetry={unstable_retry} />
    </div>
  );
}
