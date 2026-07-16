// 계약 문서: docs/api/naver-trend.md

import { z } from "zod";
import {
  ApiErrorCodeSchema,
  ApiErrorSchema,
  NaverTrendResponseSchema,
  TimeUnitSchema,
  TrendPointSchema,
} from "../schemas/naver-trend";

export type TimeUnit = z.infer<typeof TimeUnitSchema>;
export type TrendPoint = z.infer<typeof TrendPointSchema>;
export type NaverTrendResponse = z.infer<typeof NaverTrendResponseSchema>;
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;

export interface NaverTrendQuery {
  keyword: string;
  startDate: string;
  endDate: string;
  timeUnit: TimeUnit;
}

export type QueryValidationResult =
  | { ok: true; value: NaverTrendQuery }
  | { ok: false; message: string };
