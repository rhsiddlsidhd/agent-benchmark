// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { AppError } from "@/shared/types";

vi.mock("@/server/services", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("cloudinary", () => ({
  v2: {
    utils: {
      api_sign_request: vi.fn().mockReturnValue("mock-signature"),
    },
  },
}));

import { requireAuth } from "@/server/services";
import { POST } from "./route";

const buildRequest = (body: unknown) =>
  new NextRequest("http://localhost/api/upload/signature", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("POST /api/upload/signature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("인증되지 않으면 401을 리턴한다", async () => {
    vi.mocked(requireAuth).mockRejectedValue(
      new AppError("UNAUTHENTICATED", "로그인이 필요합니다."),
    );

    const res = await POST(buildRequest({ folder: "products" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it("folder가 없으면 400을 리턴한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "USER",
      email: "a@b.com",
      userId: "u1",
    });

    const res = await POST(buildRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("정상 요청이면 서명 정보를 리턴한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "USER",
      email: "a@b.com",
      userId: "u1",
    });

    const res = await POST(buildRequest({ folder: "products" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: expect.objectContaining({
        signature: "mock-signature",
        folder: "products",
      }),
    });
    expect(requireAuth).toHaveBeenCalled();
  });
});
