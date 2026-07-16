// 계약 문서: docs/api/naver-trend.md

import { z } from "zod";

export const TimeUnitSchema = z.enum(["date", "week", "month"]);

export const TrendPointSchema = z.object({
  period: z.string(), // yyyy-MM-dd
  ratio: z.number(),
});

export const NaverTrendResponseSchema = z.object({
  keyword: z.string(),
  startDate: z.string(), // yyyy-MM-dd
  endDate: z.string(), // yyyy-MM-dd
  timeUnit: TimeUnitSchema,
  data: z.array(TrendPointSchema),
});

export const ApiErrorCodeSchema = z.enum([
  "INVALID_PARAM",
  "UPSTREAM_ERROR",
  "RATE_LIMITED",
  "INTERNAL",
]);

export const ApiErrorSchema = z.object({
  error: z.object({
    code: ApiErrorCodeSchema,
    message: z.string(),
  }),
});
