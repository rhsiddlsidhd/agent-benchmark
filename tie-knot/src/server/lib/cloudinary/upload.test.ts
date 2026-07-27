import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { uploadProductImage } from "./upload";

describe("uploadProductImage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("업로드 성공 시 secure_url을 리턴한다", async () => {
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ secure_url: "https://cdn/a.jpg" }),
    } as Response);

    const result = await uploadProductImage(file, "thumbnail");

    expect(result).toBe("https://cdn/a.jpg");
  });

  it("업로드 실패 시 undefined를 리턴한다", async () => {
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);

    const result = await uploadProductImage(file, "preview");

    expect(result).toBeUndefined();
  });
});
