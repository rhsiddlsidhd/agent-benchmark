import z from "zod";

export const premiumFeatureSchema = z.object({
  code: z.string(),
  label: z.string(),
  description: z.string().min(20, "최소 20자 이상 입력해주세요."),
  additionalPrice: z.number(),
});
