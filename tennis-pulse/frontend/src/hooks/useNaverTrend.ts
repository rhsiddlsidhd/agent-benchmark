import { useCallback, useState } from "react";
import { z } from "zod";
import type {
  ApiError,
  ApiErrorCode,
  NaverTrendResponse,
  TimeUnit,
  TrendPoint,
} from "../types/naver-trend";

// fetch 경계 런타임 검증 스키마 — 계약 문서(docs/api/naver-trend.md) 기준.
// 계약 타입(NaverTrendResponse 등)은 재정의하지 않고, 구조 일치만 z.ZodType<T>로 강제한다.
const timeUnitSchema: z.ZodType<TimeUnit> = z.enum(["date", "week", "month"]);

const trendPointSchema: z.ZodType<TrendPoint> = z.object({
  period: z.string(),
  ratio: z.number(),
});

const naverTrendResponseSchema: z.ZodType<NaverTrendResponse> = z.object({
  keyword: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  timeUnit: timeUnitSchema,
  data: z.array(trendPointSchema),
});

const apiErrorCodeSchema: z.ZodType<ApiErrorCode> = z.enum([
  "INVALID_PARAM",
  "UPSTREAM_ERROR",
  "RATE_LIMITED",
  "INTERNAL",
]);

const apiErrorSchema: z.ZodType<ApiError> = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
  }),
});

export interface NaverTrendQuery {
  keyword: string;
  startDate: string;
  endDate: string;
  timeUnit: TimeUnit;
}

interface UseNaverTrendState {
  data: NaverTrendResponse | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UseNaverTrendState = {
  data: null,
  isLoading: false,
  error: null,
};

/** /api/naver-trend 훅 — fetch 경계에서 zod로 응답을 검증한 뒤 계약 타입 그대로 반환한다. */
export function useNaverTrend() {
  const [state, setState] = useState<UseNaverTrendState>(initialState);

  const fetchTrend = useCallback(async (query: NaverTrendQuery) => {
    setState({ data: null, isLoading: true, error: null });

    let res: Response;
    try {
      const search = new URLSearchParams();
      search.set("keyword", query.keyword);
      search.set("startDate", query.startDate);
      search.set("endDate", query.endDate);
      search.set("timeUnit", query.timeUnit);
      res = await fetch(`/api/naver-trend?${search.toString()}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "네트워크 요청에 실패했습니다.";
      console.error("[useNaverTrend] fetch failed", err);
      setState({ data: null, isLoading: false, error: message });
      return;
    }

    const json: unknown = await res.json();

    if (!res.ok) {
      const parsedError = apiErrorSchema.safeParse(json);
      if (!parsedError.success) {
        console.error("[useNaverTrend] error response did not match ApiError shape", parsedError.error, json);
        setState({
          data: null,
          isLoading: false,
          error: `요청이 실패했습니다 (status ${res.status})`,
        });
        return;
      }
      setState({ data: null, isLoading: false, error: parsedError.data.error.message });
      return;
    }

    const parsed = naverTrendResponseSchema.safeParse(json);
    if (!parsed.success) {
      console.error("[useNaverTrend] response did not match NaverTrendResponse contract", parsed.error, json);
      setState({
        data: null,
        isLoading: false,
        error: "서버 응답이 계약과 일치하지 않습니다.",
      });
      return;
    }

    setState({ data: parsed.data, isLoading: false, error: null });
  }, []);

  return { ...state, fetchTrend };
}
