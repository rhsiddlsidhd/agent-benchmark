import { useCallback, useState } from "react";
import { z } from "zod";
import type { ApiError, ApiErrorCode, SummaryResponse } from "../types/posts";

// fetch 경계 런타임 검증 스키마 — 계약 문서(docs/api/posts.md) 3절 기준.
const apiErrorCodeSchema: z.ZodType<ApiErrorCode> = z.enum([
  "bad_request",
  "method_not_allowed",
  "upstream_error",
  "internal_error",
]);

const apiErrorSchema: z.ZodType<ApiError> = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
  }),
});

const summaryResponseSchema: z.ZodType<SummaryResponse> = z.object({
  summary: z.string(),
  period: z.object({
    from: z.string(),
    to: z.string(),
  }),
  postCount: z.number(),
});

export interface SummaryQuery {
  from: string;
  to: string;
}

interface UsePostsSummaryState {
  data: SummaryResponse | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UsePostsSummaryState = {
  data: null,
  isLoading: false,
  error: null,
};

/** /api/summary 훅 — fetch 경계에서 zod로 응답을 검증한 뒤 계약 타입 그대로 반환한다. */
export function usePostsSummary() {
  const [state, setState] = useState<UsePostsSummaryState>(initialState);

  const fetchSummary = useCallback(async (query: SummaryQuery) => {
    setState({ data: null, isLoading: true, error: null });

    let res: Response;
    try {
      const search = new URLSearchParams();
      search.set("from", query.from);
      search.set("to", query.to);
      res = await fetch(`/api/summary?${search.toString()}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "네트워크 요청에 실패했습니다.";
      console.error("[usePostsSummary] fetch failed", err);
      setState({ data: null, isLoading: false, error: message });
      return;
    }

    const json: unknown = await res.json();

    if (!res.ok) {
      const parsedError = apiErrorSchema.safeParse(json);
      if (!parsedError.success) {
        console.error("[usePostsSummary] error response did not match ApiError shape", parsedError.error, json);
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

    const parsed = summaryResponseSchema.safeParse(json);
    if (!parsed.success) {
      console.error("[usePostsSummary] response did not match SummaryResponse contract", parsed.error, json);
      setState({
        data: null,
        isLoading: false,
        error: "서버 응답이 계약과 일치하지 않습니다.",
      });
      return;
    }

    setState({ data: parsed.data, isLoading: false, error: null });
  }, []);

  return { ...state, fetchSummary };
}
