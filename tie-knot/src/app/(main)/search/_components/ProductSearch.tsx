"use client";

import { useState } from "react";
import { SearchBar } from "./SearchBar";
import { SearchEmptyState } from "./SearchEmptyState";
import { useDebouncedValue, useProductSearch } from "../_hooks";
import { TypographyMuted } from "@/client/components/atoms";
import { Spinner, Alert } from "@/client/components/molecules";
import { ProductGrid } from "@/client/components/organisms";
import { initialFilterState } from "@/client/context/productFilter";

// 값이 끝까지 리터럴 → SCREAMING_SNAKE_CASE (src/CLAUDE.md)
const SEARCH_DEBOUNCE_MS = 300;

export function ProductSearch() {
  const [input, setInput] = useState("");
  const debouncedQuery = useDebouncedValue(input, SEARCH_DEBOUNCE_MS);
  const { products, error, isLoading, isValidating, isIdle } =
    useProductSearch(debouncedQuery);

  // 평가 순서가 중요하다 — 01_ui_flow.md §5-1. keepPreviousData 때문에 검색어가
  // 바뀐 직후에도 이전 products가 남아있을 수 있어, LOADING 판정을 EMPTY보다
  // 먼저 확인해야 "이전 결과가 0건이었을 때 재검증 중 EMPTY가 잘못 뜨는" 걸 막는다.
  const isLoadingState = isLoading || (isValidating && !products?.length);

  return (
    <main className="bg-background min-h-screen">
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="mx-auto max-w-7xl">
          <SearchBar value={input} onChange={setInput} />

          <div className="mt-8">
            {isIdle ? (
              <TypographyMuted>검색어를 입력해주세요</TypographyMuted>
            ) : error ? (
              <Alert type="error">{error.message}</Alert>
            ) : isLoadingState ? (
              <div className="flex justify-center py-20">
                <Spinner />
              </div>
            ) : products && products.length === 0 ? (
              <SearchEmptyState query={debouncedQuery} />
            ) : (
              <div className={isValidating ? "opacity-60" : undefined}>
                <ProductGrid data={products ?? []} state={initialFilterState} />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
