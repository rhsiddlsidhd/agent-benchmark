import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/services", () => ({
  getCoupleInfoById: vi.fn(),
  getActiveOrderInfoByCoupleInfoId: vi.fn(),
  getProductService: vi.fn(),
}));

vi.mock("./_components", () => ({}));
vi.mock("./_utils", () => ({}));
vi.mock("@/client/components/molecules", () => ({}));

import { generateStaticParams } from "./page";

describe("preview 정적 경로 설정", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("서버 전용 MAIN_PREVIEW_INFO_ID로 정적 경로를 만든다", () => {
    vi.stubEnv("MAIN_PREVIEW_INFO_ID", "info-1");

    expect(generateStaticParams()).toEqual([{ id: "info-1" }]);
  });
});
