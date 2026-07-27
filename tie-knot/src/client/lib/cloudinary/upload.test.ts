import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { uploadMainThumbnail, uploadGalleryImages } from "./upload";

describe("client cloudinary upload", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uploadMainThumbnail: 서명 요청 후 각 파일을 업로드해 URL 목록을 리턴한다", async () => {
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            signature: "sig",
            timestamp: 111,
            cloudName: "cloud",
            apiKey: "key",
            allowed_formats: "jpg,png,webp,jpeg",
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ secure_url: "https://cdn/a.jpg" }),
      } as Response);

    const result = await uploadMainThumbnail([file]);

    expect(result).toEqual(["https://cdn/a.jpg"]);
  });

  it("uploadGalleryImages: 서명 요청이 실패하면 undefined를 리턴한다", async () => {
    const file = new File(["x"], "b.jpg", { type: "image/jpeg" });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: { message: "실패" } }),
    } as Response);

    const result = await uploadGalleryImages([file]);

    expect(result).toBeUndefined();
  });
});
