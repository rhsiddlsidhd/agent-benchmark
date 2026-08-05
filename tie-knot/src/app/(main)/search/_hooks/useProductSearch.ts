"use client";

import useSWR from "swr";
import { fetcher } from "@/client/fetcher";
import { Product } from "@/server/services";
import { ErrorPayload } from "@/shared/types";

// 런타임 shape은 응답 계약(ProductResponse[])과 동일하다 — Product 타입을 쓰는 이유는
// 이 데이터의 유일한 소비처가 organisms/ProductGrid이고, 그게 요구하는 프롭 타입이
// Product[]이기 때문이다(useProducts.ts 기존 선례와 동일, "as" 캐스팅 없이 그대로 흘려보내려면
// 소비처 타입에 맞춰야 한다 — src/client/hooks/CLAUDE.md는 아직 이 불일치를 별도로 규정하지
// 않지만 기존 코드가 이미 이 방향으로 통일돼 있다).
export function useProductSearch(query: string) {
  const trimmed = query.trim();
  const key = trimmed
    ? `/api/products/search?q=${encodeURIComponent(trimmed)}`
    : null;

  const { data, error, isLoading, isValidating } = useSWR<
    Product[],
    ErrorPayload
  >(key, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  return {
    products: data,
    error,
    isLoading,
    isValidating,
    isIdle: key === null,
  };
}
