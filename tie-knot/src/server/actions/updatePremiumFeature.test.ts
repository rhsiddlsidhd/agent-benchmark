import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/shared/types";

vi.mock("@/server/services", () => ({
  requireAuth: vi.fn(),
  updatePremiumFeatureService: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { requireAuth, updatePremiumFeatureService } from "@/server/services";
import { updatePremiumFeature } from "./updatePremiumFeature";

const buildFormData = (overrides?: Record<string, string>) => {
  const formData = new FormData();
  const fields: Record<string, string> = {
    featureId: "feature-1",
    code: "EXTRA_PAGE",
    label: "추가 페이지",
    description: "청첩장에 원하는 만큼 추가 페이지를 자유롭게 넣을 수 있는 옵션입니다.",
    additionalPrice: "1000",
    ...overrides,
  };
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return formData;
};

describe("updatePremiumFeature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("featureId가 없으면 VALIDATION을 리턴한다", async () => {
    const result = await updatePremiumFeature(undefined, buildFormData({ featureId: "" }));

    expect(result).toEqual({
      success: false,
      error: { category: "VALIDATION", message: "기능 ID가 필요합니다." },
    });
    expect(requireAuth).not.toHaveBeenCalled();
  });

  it("입력값 검증에 실패하면 VALIDATION을 리턴한다", async () => {
    const result = await updatePremiumFeature(undefined, buildFormData({ description: "짧음" }));

    expect(result.success).toBe(false);
    expect(requireAuth).not.toHaveBeenCalled();
  });

  it("관리자가 아니면 FORBIDDEN을 리턴한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ role: "USER", email: "a@b.com", userId: "u1" });

    const result = await updatePremiumFeature(undefined, buildFormData());

    expect(result).toEqual({
      success: false,
      error: { category: "FORBIDDEN", message: "관리자 권한이 필요합니다." },
    });
    expect(updatePremiumFeatureService).not.toHaveBeenCalled();
  });

  it("인증되지 않으면 services를 호출하지 않고 에러를 리턴한다", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AppError("UNAUTHENTICATED", "인증이 필요합니다."));

    const result = await updatePremiumFeature(undefined, buildFormData());

    expect(result.success).toBe(false);
    expect(updatePremiumFeatureService).not.toHaveBeenCalled();
  });

  it("관리자면 정상적으로 수정한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ role: "ADMIN", email: "a@b.com", userId: "admin-1" });
    vi.mocked(updatePremiumFeatureService).mockResolvedValue({} as never);

    const result = await updatePremiumFeature(undefined, buildFormData());

    expect(updatePremiumFeatureService).toHaveBeenCalledWith(
      "feature-1",
      expect.objectContaining({ code: "EXTRA_PAGE" }),
    );
    expect(result).toEqual({
      success: true,
      data: { message: "프리미엄 기능이 수정되었습니다." },
    });
  });
});
