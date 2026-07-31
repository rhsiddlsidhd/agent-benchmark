import { SearchX } from "lucide-react";
import Link from "next/link";
import { TypographyP, TypographyMuted } from "@/client/components/atoms";
import { routes } from "@/shared/constants";

export function SearchEmptyState({ query }: { query: string }) {
  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
      <div className="bg-muted mb-6 flex h-20 w-20 items-center justify-center rounded-full">
        <SearchX className="text-muted-foreground h-10 w-10 opacity-40" />
      </div>
      <TypographyP className="mb-2 text-xl font-semibold tracking-tight">
        검색결과가 없습니다
      </TypographyP>
      <TypographyMuted className="max-w-[280px] text-base leading-relaxed">
        {`'${query}'와 일치하는 상품을 찾지 못했어요.`}
        <br />
        다른 검색어로 다시 시도해보세요.
      </TypographyMuted>

      {/*
        U8 리더 판정(01_ui_flow.md §9) — 막다른 페이지 방지 목적의 최소 링크.
        TODO(Phase3): 서브카테고리 진입 카드 섹션은 아직 미구현이라 이번 범위에선
        문구 + 이 링크까지만 노출한다(00_requirements REQ-4).
      */}
      <Link
        href={routes.products.byCategory("invitation")}
        className="text-primary mt-6 text-sm font-medium underline-offset-4 hover:underline"
      >
        전체 상품 보기
      </Link>
    </div>
  );
}
