import * as z from "zod";

const isoDateString = z.string().refine((v) => !isNaN(Date.parse(v)), {
  message: "ISO date string이 아님",
});

const personResponseSchema = z.object({
  name: z.string(),
  phone: z.string(),
});
const parentResponseSchema = personResponseSchema.extend({
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
});
const coupleSideResponseSchema = personResponseSchema.extend({
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  father: parentResponseSchema.optional(),
  mother: parentResponseSchema.optional(),
});

export const coupleInfoResponseSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  groom: coupleSideResponseSchema,
  bride: coupleSideResponseSchema,
  weddingDate: isoDateString,
  venue: z.string(),
  address: z.string(),
  addressDetail: z.string(),
  subwayStation: z.string().optional(),
  guestbookEnabled: z.boolean(),
  thumbnailImages: z.array(z.string()),
  galleryImages: z.array(z.string()),
  createdAt: isoDateString,
  updatedAt: isoDateString,
});

export type CoupleInfoResponse = z.infer<typeof coupleInfoResponseSchema>;
