import type { Metadata } from "next";
import Link from "next/link";
import { QueryProvider } from "@/src/components/providers/query-provider";
import { AdultContentProvider } from "@/src/features/adult-content/adult-content-context";
import { AdultToggle } from "@/src/features/adult-content/adult-toggle";
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
          <AdultContentProvider>
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

              {/* 성인 콘텐츠 토글(FR-7) — 검색 페이지의 토글과 동일 Context 를 공유한다. */}
              <AdultToggle />
            </nav>
          </div>
        </header>

          <main className="flex flex-1 flex-col">{children}</main>
          </AdultContentProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
