import * as z from "zod";

const isoDateString = z.string().refine((v) => !isNaN(Date.parse(v)), {
  message: "ISO date string이 아님",
});

export const premiumFeatureResponseSchema = z.object({
  _id: z.string(),
  code: z.string(),
  label: z.string(),
  description: z.string(),
  additionalPrice: z.number(),
  isActive: z.boolean(),
  createdAt: isoDateString,
});

export const premiumFeaturesResponseSchema = z.object({
  features: z.array(premiumFeatureResponseSchema),
});

export type PremiumFeaturesResponse = z.infer<typeof premiumFeaturesResponseSchema>;
