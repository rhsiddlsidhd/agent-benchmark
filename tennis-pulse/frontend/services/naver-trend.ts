// 계약 문서: docs/api/naver-trend.md
// 네이버 데이터랩 검색어트렌드 API 프록시 비즈니스 로직

import type { ApiErrorCode, NaverTrendQuery, NaverTrendResponse, TrendPoint } from "../types/naver-trend.ts";

const NAVER_DATALAB_URL = "https://openapi.naver.com/v1/datalab/search";

export class NaverTrendError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, status: number, message: string) {
    super(message);
    this.name = "NaverTrendError";
    this.code = code;
    this.status = status;
  }
}

interface NaverDatalabResponse {
  results: { data: TrendPoint[] }[];
}

interface NaverErrorBody {
  errorCode: string;
  errorMessage: string;
}

function isTrendPoint(value: unknown): value is TrendPoint {
  return (
    typeof value === "object" &&
    value !== null &&
    "period" in value &&
    typeof value.period === "string" &&
    "ratio" in value &&
    typeof value.ratio === "number"
  );
}

function isNaverDatalabResponse(value: unknown): value is NaverDatalabResponse {
  if (typeof value !== "object" || value === null || !("results" in value)) {
    return false;
  }
  const { results } = value;
  if (!Array.isArray(results) || results.length === 0) {
    return false;
  }
  const [first] = results;
  return (
    typeof first === "object" &&
    first !== null &&
    "data" in first &&
    Array.isArray(first.data) &&
    first.data.every(isTrendPoint)
  );
}

function isNaverErrorBody(value: unknown): value is NaverErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "errorCode" in value &&
    typeof value.errorCode === "string" &&
    "errorMessage" in value &&
    typeof value.errorMessage === "string"
  );
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  try {
    const value: unknown = await response.json();
    return value;
  } catch (error) {
    throw new NaverTrendError("INTERNAL", 500, `Failed to parse naver response: ${toMessage(error)}`);
  }
}

/** 네이버 데이터랩 검색어트렌드 API를 호출해 정규화된 응답으로 반환한다. */
export async function fetchNaverTrend(query: NaverTrendQuery): Promise<NaverTrendResponse> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new NaverTrendError("INTERNAL", 500, "NAVER_CLIENT_ID/NAVER_CLIENT_SECRET is not configured");
  }

  let response: Response;
  try {
    response = await fetch(NAVER_DATALAB_URL, {
      method: "POST",
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: query.startDate,
        endDate: query.endDate,
        timeUnit: query.timeUnit,
        keywordGroups: [{ groupName: query.keyword, keywords: [query.keyword] }],
      }),
    });
  } catch (error) {
    throw new NaverTrendError("INTERNAL", 500, `Failed to reach naver datalab: ${toMessage(error)}`);
  }

  const raw = await parseJsonSafely(response);

  if (!response.ok) {
    const message = isNaverErrorBody(raw)
      ? `naver: ${raw.errorMessage} (errorCode ${raw.errorCode})`
      : `naver upstream error (status ${response.status})`;

    if (response.status === 429) {
      throw new NaverTrendError("RATE_LIMITED", 429, message);
    }
    throw new NaverTrendError("UPSTREAM_ERROR", 502, message);
  }

  if (!isNaverDatalabResponse(raw)) {
    throw new NaverTrendError("INTERNAL", 500, "naver datalab response shape mismatch");
  }

  return {
    keyword: query.keyword,
    startDate: query.startDate,
    endDate: query.endDate,
    timeUnit: query.timeUnit,
    data: raw.results[0].data,
  };
}
