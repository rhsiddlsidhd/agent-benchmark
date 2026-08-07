import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const { useSWRMock } = vi.hoisted(() => ({ useSWRMock: vi.fn() }));

vi.mock("swr", () => ({ default: useSWRMock }));
vi.mock("@/client/fetcher", () => ({ fetcher: vi.fn() }));

import { Product } from "@/server/services";
import { useProducts } from "./useProducts";

const buildProduct = (overrides?: Partial<Product>): Product =>
  ({
    _id: "product-1",
    authorId: "author-1",
    title: "봄맞이 청첩장",
    description: "봄 시즌 한정 모바일 청첩장 템플릿입니다.",
    thumbnail: "https://example.com/thumb.jpg",
    price: 10000,
    category: "invitation",
    subCategory: "wedding",
    isPremium: false,
    isFeatured: false,
    priority: 0,
    discount: { discountType: "rate", value: 0 },
    status: "active",
    likes: [],
    featureIds: [],
    isLiked: false,
    discountedPrice: 10000,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  }) as Product;

describe("useProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("SWR data가 있으면 그 값을 리턴한다", () => {
    const swrProducts = [buildProduct({ _id: "swr-product" })];
    useSWRMock.mockReturnValue({ data: swrProducts });

    const { result } = renderHook(() =>
      useProducts("invitation", [buildProduct({ _id: "fallback-product" })]),
    );

    expect(result.current).toBe(swrProducts);
  });

  it("SWR data가 없으면 fallbackData를 리턴한다", () => {
    useSWRMock.mockReturnValue({ data: undefined });
    const fallback = [buildProduct({ _id: "fallback-product" })];

    const { result } = renderHook(() => useProducts("invitation", fallback));

    expect(result.current).toBe(fallback);
  });

  it("category별로 다른 요청 key로 SWR을 호출한다", () => {
    useSWRMock.mockReturnValue({ data: undefined });

    renderHook(() => useProducts("favor", []));

    expect(useSWRMock).toHaveBeenCalledWith(
      "/api/products?category=favor",
      expect.any(Function),
      expect.objectContaining({
        fallbackData: [],
        revalidateOnMount: false,
        revalidateIfStale: false,
      }),
    );
  });
});
