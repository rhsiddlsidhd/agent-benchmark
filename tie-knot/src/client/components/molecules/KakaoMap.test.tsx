import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("react-kakao-maps-sdk", () => ({
  useKakaoLoader: vi.fn(),
  Map: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="kakao-map">{children}</div>
  ),
  MapMarker: () => <div data-testid="kakao-marker" />,
}));

vi.mock("@/client/hooks", () => ({
  useKakaomapGeocode: vi.fn(),
}));

import { useKakaomapGeocode } from "@/client/hooks";
import { KakaoMap } from "./KakaoMap";

describe("KakaoMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY = "test-key";
  });

  it("좌표가 없으면 스켈레톤을 보여준다", () => {
    vi.mocked(useKakaomapGeocode).mockReturnValue({ lat: null, lng: null });

    render(<KakaoMap address="서울" />);

    expect(screen.queryByTestId("kakao-map")).not.toBeInTheDocument();
  });

  it("좌표가 있으면 지도를 렌더링한다", () => {
    vi.mocked(useKakaomapGeocode).mockReturnValue({ lat: 37.5, lng: 127.0 });

    render(<KakaoMap address="서울" />);

    expect(screen.getByTestId("kakao-map")).toBeInTheDocument();
    expect(screen.getByTestId("kakao-marker")).toBeInTheDocument();
  });
});
