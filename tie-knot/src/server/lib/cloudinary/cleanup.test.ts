import { describe, expect, it, vi } from "vitest";

const { destroy } = vi.hoisted(() => ({ destroy: vi.fn() }));
vi.mock("cloudinary", () => ({ v2: { uploader: { destroy } } }));

import { deleteProductAsset } from "./cleanup";

describe("deleteProductAsset", () => {
  it("업로드 asset을 invalidate 옵션으로 삭제한다", async () => {
    destroy.mockResolvedValue({ result: "ok" });

    await deleteProductAsset("products/images/a");

    expect(destroy).toHaveBeenCalledWith("products/images/a", {
      resource_type: "image",
      invalidate: true,
    });
  });

  it("Cloudinary 삭제 실패를 EXTERNAL_SERVICE로 전파한다", async () => {
    destroy.mockResolvedValue({ result: "failed" });

    await expect(deleteProductAsset("products/images/a")).rejects.toMatchObject({
      category: "EXTERNAL_SERVICE",
    });
  });
});
