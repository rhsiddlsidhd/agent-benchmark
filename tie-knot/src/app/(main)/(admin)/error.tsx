"use client";

import { ErrorFallback } from "@/client/components/organisms";
interface ErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function AdminError({ error, unstable_retry }: ErrorProps) {
  return (
    <ErrorFallback
      error={error}
      retry={unstable_retry}
      title="관리자 페이지 오류"
      description="시스템 관리 중 문제가 발생했습니다. 관리자 대시보드로 돌아가거나 다시 시도해 주세요."
      backPath="/admin/dashboard"
      backLabel="관리자 대시보드로"
    />
  );
}
