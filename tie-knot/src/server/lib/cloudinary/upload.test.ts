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

  it("업로드 실패를 삼키지 않고 EXTERNAL_SERVICE 오류를 전파한다", async () => {
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);

    await expect(uploadProductImage(file, "preview")).rejects.toMatchObject({
      category: "EXTERNAL_SERVICE",
    });
  });

  it("type이 'images'면 갤러리 폴더로 업로드하고 secure_url을 리턴한다 (REQ-2)", async () => {
    const file = new File(["x"], "gallery.jpg", { type: "image/jpeg" });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ secure_url: "https://cdn/gallery.jpg" }),
    } as Response);

    const result = await uploadProductImage(file, "images");

    expect(result).toBe("https://cdn/gallery.jpg");
    const [, requestInit] = vi.mocked(fetch).mock.calls[0];
    const sentFormData = requestInit?.body as FormData;
    expect(sentFormData.get("folder")).toBe("products/images");
  });
});
