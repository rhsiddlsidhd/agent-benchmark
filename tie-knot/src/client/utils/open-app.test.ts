import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { openApp } from "./open-app";

describe("openApp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("open", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("openTmap: tmap 스킴으로 이동을 시도한다", () => {
    const hrefSetter = vi.fn();
    Object.defineProperty(window, "location", {
      value: { set href(v: string) { hrefSetter(v); } },
      writable: true,
    });

    openApp.openTmap("서울시청");

    expect(hrefSetter).toHaveBeenCalledWith(
      expect.stringContaining("tmap://search?name="),
    );
  });

  it("openTmap: 3초 뒤에도 안 돌아오면 네이버 지도 웹으로 폴백한다", () => {
    openApp.openTmap("서울시청");

    vi.advanceTimersByTime(3000);

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("map.naver.com"),
      "_blank",
    );
  });

  it("openNaverMap: nmap 스킴으로 이동을 시도하고, 폴백 타이머를 건다", () => {
    openApp.openNaverMap({
      current: { lat: 37.5, lng: 127 },
      target: { lat: 37.6, lng: 127.1 },
      address: "서울시청",
    });

    vi.advanceTimersByTime(3000);

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("map.naver.com"),
      "_blank",
    );
  });

  it("openKakaoMap: kakaomap 스킴으로 이동을 시도하고, 폴백 타이머를 건다", () => {
    openApp.openKakaoMap({
      current: { lat: 37.5, lng: 127 },
      target: { lat: 37.6, lng: 127.1 },
      address: "서울시청",
    });

    vi.advanceTimersByTime(3000);

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("map.kakao.com"),
      "_blank",
    );
  });
});
