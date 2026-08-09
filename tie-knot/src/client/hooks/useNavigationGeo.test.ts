import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("./useKakaomapGeocode", () => ({
  useKakaomapGeocode: vi.fn(),
}));

import { useKakaomapGeocode } from "./useKakaomapGeocode";
import { useNavigationGeo } from "./useNavigationGeo";

describe("useNavigationGeo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useKakaomapGeocode).mockReturnValue({ lat: 37.5, lng: 127.0 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("navigator.geolocation으로 현재 위치를 가져와 current에 반영한다", async () => {
    const getCurrentPosition = vi.fn((success) => {
      success({ coords: { latitude: 37.5, longitude: 127.0 } });
    });
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });

    const { result } = renderHook(() => useNavigationGeo("서울"));

    await waitFor(() => {
      expect(result.current.current).toEqual({ lat: 37.5, lng: 127.0 });
    });
  });

  it("geolocation 실패 시 current를 null로 유지한다", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const getCurrentPosition = vi.fn((_success, error) => {
      error(new Error("denied"));
    });
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });

    const { result } = renderHook(() => useNavigationGeo("서울"));

    await waitFor(() => {
      expect(getCurrentPosition).toHaveBeenCalled();
    });
    expect(result.current.current).toEqual({ lat: null, lng: null });

    errorSpy.mockRestore();
  });

  it("target은 useKakaomapGeocode 결과를 그대로 전달한다", () => {
    vi.stubGlobal("navigator", {
      geolocation: { getCurrentPosition: vi.fn() },
    });

    const { result } = renderHook(() => useNavigationGeo("서울"));

    expect(useKakaomapGeocode).toHaveBeenCalledWith("서울");
    expect(result.current.target).toEqual({ lat: 37.5, lng: 127.0 });
  });
});
