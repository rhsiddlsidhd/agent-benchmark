import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/shared/types";

vi.mock("@/server/services", () => ({
  requireAuth: vi.fn(),
  createPremiumFeatureService: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { requireAuth, createPremiumFeatureService } from "@/server/services";
import { createPremiumFeature } from "./createPremiumFeature";

const buildFormData = (overrides?: Record<string, string>) => {
  const formData = new FormData();
  const fields: Record<string, string> = {
    code: "EXTRA_PAGE",
    label: "추가 페이지",
    description: "청첩장에 원하는 만큼 추가 페이지를 자유롭게 넣을 수 있는 옵션입니다.",
    additionalPrice: "1000",
    ...overrides,
  };
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return formData;
};

describe("createPremiumFeature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("입력값 검증에 실패하면 VALIDATION을 리턴한다", async () => {
    const result = await createPremiumFeature(undefined, buildFormData({ description: "짧음" }));

    expect(result.success).toBe(false);
    expect(requireAuth).not.toHaveBeenCalled();
  });

  it("관리자가 아니면 FORBIDDEN을 리턴한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ role: "USER", email: "a@b.com", userId: "u1" });

    const result = await createPremiumFeature(undefined, buildFormData());

    expect(result).toEqual({
      success: false,
      error: { category: "FORBIDDEN", message: "관리자 권한이 필요합니다." },
    });
    expect(createPremiumFeatureService).not.toHaveBeenCalled();
  });

  it("인증되지 않으면 services를 호출하지 않고 에러를 리턴한다", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AppError("UNAUTHENTICATED", "인증이 필요합니다."));

    const result = await createPremiumFeature(undefined, buildFormData());

    expect(result.success).toBe(false);
    expect(createPremiumFeatureService).not.toHaveBeenCalled();
  });

  it("관리자면 정상적으로 등록한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ role: "ADMIN", email: "a@b.com", userId: "admin-1" });
    vi.mocked(createPremiumFeatureService).mockResolvedValue({} as never);

    const result = await createPremiumFeature(undefined, buildFormData());

    expect(createPremiumFeatureService).toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      data: { message: "프리미엄 기능을 등록하였습니다." },
    });
  });
});
