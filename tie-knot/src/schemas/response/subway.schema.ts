import * as z from "zod";

// GET /api/subway — 드롭다운용 전체 역명 목록. SelectField가 기대하는 {value,label} shape 그대로 유지.
export const subwayStationOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const subwayStationsResponseSchema = z.array(subwayStationOptionSchema);

export type SubwayStationsResponse = z.infer<typeof subwayStationsResponseSchema>;

// GET /api/subway/[station] — 특정 역이 지나는 노선 + 노선 컬러.
export const subwayLineSchema = z.object({
  name: z.string(),
  color: z.string(),
});

export const subwayStationLineInfoResponseSchema = z.object({
  station: z.string(),
  lines: z.array(subwayLineSchema),
});

export type SubwayStationLineInfoResponse = z.infer<
  typeof subwayStationLineInfoResponseSchema
>;
