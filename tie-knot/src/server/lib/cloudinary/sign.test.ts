import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("cloudinary", () => ({
  v2: {
    utils: {
      api_sign_request: vi.fn().mockReturnValue("mock-signature"),
    },
  },
}));

import { v2 as cloudinary } from "cloudinary";
import { signUploadRequest } from "./sign";

describe("signUploadRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("folder로 서명 정보를 생성한다", () => {
    const result = signUploadRequest("products");

    expect(result.signature).toBe("mock-signature");
    expect(result.folder).toBe("products");
    expect(result.allowed_formats).toBe("jpg,png,webp,jpeg");
    expect(cloudinary.utils.api_sign_request).toHaveBeenCalledWith(
      expect.objectContaining({ folder: "products" }),
      process.env.CLOUDINARY_API_SECRET,
    );
  });
});
