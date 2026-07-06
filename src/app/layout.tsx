import type { Metadata } from "next";
import Link from "next/link";
import { QueryProvider } from "@/src/components/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CineLog — 영화·TV 탐색",
    template: "%s · CineLog",
  },
  description: "TMDB 기반 영화·TV·인물 탐색 웹앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="antialiased">
      <body className="flex min-h-screen flex-col bg-base text-content-primary">
        <QueryProvider>
          <header className="z-header sticky top-0 border-b border-border bg-base/80 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-page items-center justify-between px-gutter md:px-gutter-lg">
            <Link
              href="/"
              className="text-h3 font-semibold tracking-tight text-content-primary"
            >
              Cine<span className="text-brand">Log</span>
            </Link>

            <nav
              aria-label="주요 메뉴"
              className="flex items-center gap-3 md:gap-4"
            >
              <Link
                href="/search"
                className="rounded-md px-3 py-2 text-body-sm text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary"
              >
                검색
              </Link>

              {/*
                AdultToggle 자리 placeholder — 실제 기능은 T13(FR-7)에서 연결한다.
                우선순위상 FR-7 이 마지막이라 여기서는 비활성 상태로 자리만 확보.
              */}
              <button
                type="button"
                disabled
                aria-disabled="true"
                aria-label="성인 콘텐츠 필터 (준비 중)"
                className="flex items-center gap-2 rounded-pill border border-border bg-surface px-3 py-2 text-caption text-content-muted opacity-60"
              >
                <span
                  aria-hidden="true"
                  className="size-2 rounded-pill bg-success"
                />
                성인 콘텐츠 숨김
              </button>
            </nav>
          </div>
        </header>

          <main className="flex flex-1 flex-col">{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
