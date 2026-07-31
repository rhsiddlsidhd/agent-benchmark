import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const { useSWRMock } = vi.hoisted(() => ({ useSWRMock: vi.fn() }));

vi.mock("swr", () => ({ default: useSWRMock }));
vi.mock("@/client/fetcher", () => ({ fetcher: vi.fn() }));

import { useProductSearch } from "./useProductSearch";

describe("useProductSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("trim 후 빈 문자열이면 SWR key가 null이고 isIdle이 true다", () => {
    useSWRMock.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
    });

    const { result } = renderHook(() => useProductSearch("   "));

    expect(useSWRMock).toHaveBeenCalledWith(
      null,
      expect.any(Function),
      expect.any(Object),
    );
    expect(result.current.isIdle).toBe(true);
  });

  it("검색어가 있으면 SWR key가 encodeURIComponent된 쿼리스트링이다", () => {
    useSWRMock.mockReturnValue({
      data: [],
      error: undefined,
      isLoading: false,
      isValidating: false,
    });

    renderHook(() => useProductSearch("청첩장 & 초대"));

    expect(useSWRMock).toHaveBeenCalledWith(
      `/api/products/search?q=${encodeURIComponent("청첩장 & 초대")}`,
      expect.any(Function),
      expect.any(Object),
    );
  });

  it("SWR 결과를 products/error/isLoading/isValidating/isIdle로 그대로 노출한다", () => {
    const error = { category: "INTERNAL", message: "서버 오류" };
    useSWRMock.mockReturnValue({
      data: [{ _id: "1" }],
      error,
      isLoading: true,
      isValidating: true,
    });

    const { result } = renderHook(() => useProductSearch("청첩장"));

    expect(result.current.products).toEqual([{ _id: "1" }]);
    expect(result.current.error).toEqual(error);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isValidating).toBe(true);
    expect(result.current.isIdle).toBe(false);
  });

  it("keepPreviousData/revalidateOnFocus 옵션이 SWR에 전달된다", () => {
    useSWRMock.mockReturnValue({
      data: [],
      error: undefined,
      isLoading: false,
      isValidating: false,
    });

    renderHook(() => useProductSearch("청첩장"));

    expect(useSWRMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Function),
      expect.objectContaining({
        keepPreviousData: true,
        revalidateOnFocus: false,
      }),
    );
  });
});
