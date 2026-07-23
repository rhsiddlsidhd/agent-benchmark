import * as z from "zod";

export const subwayStationOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const subwayStationsResponseSchema = z.array(subwayStationOptionSchema);

export type SubwayStationsResponse = z.infer<typeof subwayStationsResponseSchema>;
