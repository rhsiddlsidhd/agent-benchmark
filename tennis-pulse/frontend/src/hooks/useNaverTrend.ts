import { useCallback, useState } from "react";
import { ApiErrorSchema, NaverTrendResponseSchema } from "../schemas/naver-trend";
import type { NaverTrendResponse, TimeUnit } from "../types/naver-trend";

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
      const parsedError = ApiErrorSchema.safeParse(json);
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

    const parsed = NaverTrendResponseSchema.safeParse(json);
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
