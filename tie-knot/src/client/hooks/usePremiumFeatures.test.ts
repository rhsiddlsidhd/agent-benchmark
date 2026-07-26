import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const { useSWRMock } = vi.hoisted(() => ({ useSWRMock: vi.fn() }));

vi.mock("swr", () => ({ default: useSWRMock }));
vi.mock("@/client/fetcher", () => ({ fetcher: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import { toast } from "sonner";
import { usePremiumFeature } from "./usePremiumFeatures";

describe("usePremiumFeature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("정상 응답이면 premiumFeatures 목록을 리턴한다", () => {
    useSWRMock.mockReturnValue({
      data: { features: [{ _id: "1" }] },
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => usePremiumFeature());

    expect(result.current.premiumFeatures).toEqual([{ _id: "1" }]);
    expect(result.current.loading).toBe(false);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("데이터가 아직 없으면 빈 배열을 리턴한다", () => {
    useSWRMock.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => usePremiumFeature());

    expect(result.current.premiumFeatures).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it("에러가 있으면 서버가 준 message를 그대로 토스트로 띄운다", () => {
    useSWRMock.mockReturnValue({
      data: undefined,
      error: { category: "INTERNAL", message: "서버에 문제가 발생했습니다." },
      isLoading: false,
    });

    renderHook(() => usePremiumFeature());

    expect(toast.error).toHaveBeenCalledWith("서버에 문제가 발생했습니다.");
  });
});
