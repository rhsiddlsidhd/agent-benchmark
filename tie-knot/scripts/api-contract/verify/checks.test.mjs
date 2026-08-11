import { describe, expect, it, vi } from "vitest";
import checksModule from "./checks.js";
import runModule from "./cli.js";

const { buildChecks } = checksModule;
const { warnForMissingPreviewInfo } = runModule;

describe("API verify 환경 설정", () => {
  it("MAIN_PREVIEW_INFO_ID를 couple-info와 guestbook 요청에 사용한다", () => {
    const checks = buildChecks({ MAIN_PREVIEW_INFO_ID: "info-1" });

    expect(checks.find(({ name }) => name === "couple-info")?.path)
      .toBe("/api/couple-info?q=info-1");
    expect(checks.find(({ name }) => name === "guestbook")?.path)
      .toBe("/api/guestbook?id=info-1");
  });

  it("MAIN_PREVIEW_INFO_ID가 없을 때만 경고한다", () => {
    const warn = vi.fn();

    expect(warnForMissingPreviewInfo({}, warn)).toBe(true);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("MAIN_PREVIEW_INFO_ID 없음"));
    expect(warnForMissingPreviewInfo({ MAIN_PREVIEW_INFO_ID: "info-1" }, warn)).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
