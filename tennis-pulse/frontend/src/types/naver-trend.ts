// 계약 문서: docs/api/naver-trend.md

export type TimeUnit = "date" | "week" | "month";

export interface TrendPoint {
  period: string; // yyyy-MM-dd
  ratio: number;
}

export interface NaverTrendResponse {
  keyword: string;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  timeUnit: TimeUnit;
  data: TrendPoint[];
}

export type ApiErrorCode =
  | "INVALID_PARAM"
  | "UPSTREAM_ERROR"
  | "RATE_LIMITED"
  | "INTERNAL";

export interface ApiError {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

export interface NaverTrendQuery {
  keyword: string;
  startDate: string;
  endDate: string;
  timeUnit: TimeUnit;
}

export type QueryValidationResult =
  | { ok: true; value: NaverTrendQuery }
  | { ok: false; message: string };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MIN_START_DATE = "2016-01-01";

function isValidCalendarDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isTimeUnit(value: string): value is TimeUnit {
  return value === "date" || value === "week" || value === "month";
}

/** 쿼리스트링 → NaverTrendQuery. 계약 문서 2절 검증 규칙을 그대로 반영한다. */
export function validateNaverTrendQuery(params: URLSearchParams): QueryValidationResult {
  const keyword = params.get("keyword")?.trim() ?? "";
  const startDate = params.get("startDate")?.trim() ?? "";
  const endDate = params.get("endDate")?.trim() ?? "";
  const timeUnit = params.get("timeUnit")?.trim() ?? "";

  if (!keyword) {
    return { ok: false, message: "keyword is required" };
  }
  if (!isValidCalendarDate(startDate)) {
    return { ok: false, message: "startDate must be a valid yyyy-MM-dd date" };
  }
  if (!isValidCalendarDate(endDate)) {
    return { ok: false, message: "endDate must be a valid yyyy-MM-dd date" };
  }
  if (startDate < MIN_START_DATE) {
    return { ok: false, message: `startDate must be on or after ${MIN_START_DATE}` };
  }
  if (startDate > endDate) {
    return { ok: false, message: "startDate must not be after endDate" };
  }
  const today = new Date().toISOString().slice(0, 10);
  if (endDate > today) {
    return { ok: false, message: "endDate must not be in the future" };
  }
  if (!isTimeUnit(timeUnit)) {
    return { ok: false, message: "timeUnit must be one of: date, week, month" };
  }

  return { ok: true, value: { keyword, startDate, endDate, timeUnit } };
}
