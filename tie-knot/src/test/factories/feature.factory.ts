import { PremiumFeatureDto } from "@/shared/schemas";

export const buildFeatureInput = (
  overrides?: Partial<PremiumFeatureDto>,
): PremiumFeatureDto => ({
  code: "GUESTBOOK",
  label: "방명록",
  description: "하객들이 남기는 방명록 기능을 추가합니다.",
  additionalPrice: 3000,
  ...overrides,
});
