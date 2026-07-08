"use client";

/**
 * TanStack Query Provider (01_ARCHITECTURE §4, §10).
 *
 * rate limit 정책상 실패 재시도는 `retry: 1` 로 제한한다(그 이상 재시도하면
 * TMDB rate limit 을 앱이 스스로 악화시킨다 — ADR-0004). QueryClient 는
 * 리렌더마다 재생성되지 않도록 useState 초기화로 1회만 만든다.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 60_000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
