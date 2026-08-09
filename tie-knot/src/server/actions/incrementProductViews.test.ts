import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/services", () => ({
  incrementProductViewsService: vi.fn(),
}));

import { incrementProductViewsService } from "@/server/services";
import { incrementProductViews } from "./incrementProductViews";

describe("incrementProductViews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("서비스가 true를 리턴하면 success: true를 리턴한다", async () => {
    vi.mocked(incrementProductViewsService).mockResolvedValue(true);

    const result = await incrementProductViews("product-1");

    expect(incrementProductViewsService).toHaveBeenCalledWith("product-1");
    expect(result).toEqual({ success: true, data: { success: true } });
  });

  it("서비스가 false를 리턴하면 data.success: false를 리턴한다", async () => {
    vi.mocked(incrementProductViewsService).mockResolvedValue(false);

    const result = await incrementProductViews("not-a-valid-id");

    expect(result).toEqual({ success: true, data: { success: false } });
  });
});
