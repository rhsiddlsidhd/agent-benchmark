"use client";

import ErrorFallback from "@/components/organisms/ErrorFallback";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: ErrorProps) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="관리자 페이지 오류"
      description="시스템 관리 중 문제가 발생했습니다. 관리자 대시보드로 돌아가거나 다시 시도해 주세요."
      backPath="/admin/dashboard"
      backLabel="관리자 대시보드로"
    />
  );
}
