"use client";

import { ErrorFallback } from "@/client/components/organisms";
interface ErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function MainError({ error, unstable_retry }: ErrorProps) {
  return (
    <ErrorFallback
      error={error}
      retry={unstable_retry}
      title="오류가 발생했습니다"
      description="서비스 이용 중 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
      backPath="/"
      backLabel="홈으로 돌아가기"
    />
  );
}
