import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const { useSWRMock } = vi.hoisted(() => ({ useSWRMock: vi.fn() }));

vi.mock("swr", () => ({ default: useSWRMock }));
vi.mock("@/client/fetcher", () => ({ fetcher: vi.fn() }));

import { useKakaomapGeocode } from "./useKakaomapGeocode";

describe("useKakaomapGeocode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("address가 없으면 swr key를 null로 전달하고 좌표를 null로 리턴한다", () => {
    useSWRMock.mockReturnValue({ data: undefined, error: undefined });

    const { result } = renderHook(() => useKakaomapGeocode(""));

    expect(useSWRMock).toHaveBeenCalledWith(null, expect.any(Function));
    expect(result.current).toEqual({ lat: null, lng: null });
  });

  it("응답이 있으면 첫 번째 document 좌표를 숫자로 변환해 리턴한다", () => {
    useSWRMock.mockReturnValue({
      data: { documents: [{ x: "127.0", y: "37.5" }] },
      error: undefined,
    });

    const { result } = renderHook(() => useKakaomapGeocode("서울"));

    expect(useSWRMock).toHaveBeenCalledWith(
      "/api/kakaomap?address=서울",
      expect.any(Function),
    );
    expect(result.current).toEqual({ lat: 37.5, lng: 127 });
  });

  it("에러가 있으면 콘솔에 로그를 남기고 좌표는 null을 유지한다", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    useSWRMock.mockReturnValue({
      data: undefined,
      error: {
        category: "EXTERNAL_SERVICE",
        message: "주소 검색에 실패했습니다.",
      },
    });

    const { result } = renderHook(() => useKakaomapGeocode("서울"));

    expect(errorSpy).toHaveBeenCalledWith("주소 검색에 실패했습니다.");
    expect(result.current).toEqual({ lat: null, lng: null });

    errorSpy.mockRestore();
  });
});
