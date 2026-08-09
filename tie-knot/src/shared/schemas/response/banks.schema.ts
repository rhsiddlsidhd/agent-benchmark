import * as z from "zod";

export const banksResponseSchema = z.array(
  z.object({
    bank: z.string(),
    name: z.object({ ko: z.string() }),
  }),
);

export type BanksResponse = z.infer<typeof banksResponseSchema>;
