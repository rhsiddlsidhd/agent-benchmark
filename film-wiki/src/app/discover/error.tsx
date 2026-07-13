"use client";

/**
 * 장르 탐색 세그먼트 Error Boundary (03_DESIGN §2.7 / 01_ARCHITECTURE §4).
 *
 * page.tsx 의 getGenres(영화/TV 장르 목록) fetch 실패(타임아웃/5xx/네트워크)를 이
 * 세그먼트 안에서 잡아 ErrorState 로 노출하고 재시도한다. 결과 그리드의 조회 실패는
 * DiscoverExplorer 내부 useDiscoverInfinite(retry:1) + ErrorState 가 담당하므로, 이
 * 경계는 초기 장르 목록 로드 실패만 처리한다.
 *
 * Next.js 16.2 의 error 파일은 실패한 데이터 페치를 재요청하는 `unstable_retry` prop 을
 * 제공한다(node_modules/next/dist/docs 확인). 단순 재렌더만 하는 reset() 대신 재요청까지
 * 수행하는 unstable_retry() 를 연결한다.
 */
import { useEffect } from "react";

import { ErrorState } from "@/src/components/ui";

export default function DiscoverError({
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
