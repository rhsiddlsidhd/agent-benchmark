import type { PropsWithChildren } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { Product } from "@/server/services/product.service";
import { useProductSearch } from "./useProductSearch";

const product: Product = {
  _id: "product-1",
  authorId: "author-1",
  title: "검색된 청첩장",
  description: "검색 통합 테스트 상품 설명입니다.",
  thumbnail: "https://example.com/thumb.jpg",
  price: 10_000,
  category: "invitation",
  subCategory: "wedding",
  isPremium: false,
  isFeatured: false,
  priority: 0,
  views: 0,
  salesCount: 0,
  discount: { discountType: "rate", value: 0 },
  status: "active",
  likes: [],
  featureIds: [],
  isLiked: false,
  discountedPrice: 10_000,
  images: [],
  minQuantity: 1,
  maxQuantity: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  deletedAt: null,
};

const server = setupServer(
  http.get("http://localhost/api/products/search", ({ request }) => {
    const query = new URL(request.url).searchParams.get("q");
    return HttpResponse.json({ success: true, data: query === "청첩장" ? [product] : [] });
  }),
);

const nativeFetch = globalThis.fetch;

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
  const interceptedFetch = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const resolved = typeof input === "string" && input.startsWith("/")
      ? new URL(input, "http://localhost")
      : input;
    return interceptedFetch(resolved, init);
  }) as typeof fetch;
});
afterEach(() => server.resetHandlers());
afterAll(() => { server.close(); globalThis.fetch = nativeFetch; });

const wrapper = ({ children }: PropsWithChildren) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
    {children}
  </SWRConfig>
);

describe("실제 useSWR + MSW HTTP 경계", () => {
  it("검색어를 API에 보내고 실제 SWR cache에 응답을 반영한다", async () => {
    const { result } = renderHook(() => useProductSearch(" 청첩장 "), { wrapper });

    await waitFor(() => expect(result.current.products).toEqual([product]));
    expect(result.current.isIdle).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it("빈 검색어는 HTTP 요청 없이 idle 상태다", () => {
    const { result } = renderHook(() => useProductSearch("   "), { wrapper });

    expect(result.current.isIdle).toBe(true);
    expect(result.current.products).toBeUndefined();
  });
});
