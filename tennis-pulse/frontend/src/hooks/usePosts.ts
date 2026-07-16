import { useCallback, useState } from "react";
import { ApiErrorSchema, PostsListResponseSchema } from "../schemas/posts";
import type { PostsListResponse } from "../types/posts";

export interface PostsQuery {
  from?: string;
  to?: string;
}

interface UsePostsState {
  data: PostsListResponse | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UsePostsState = {
  data: null,
  isLoading: false,
  error: null,
};

/** /api/posts 훅 — fetch 경계에서 zod로 응답을 검증한 뒤 계약 타입 그대로 반환한다. */
export function usePosts() {
  const [state, setState] = useState<UsePostsState>(initialState);

  const fetchPosts = useCallback(async (query: PostsQuery = {}) => {
    setState({ data: null, isLoading: true, error: null });

    let res: Response;
    try {
      const search = new URLSearchParams();
      if (query.from) search.set("from", query.from);
      if (query.to) search.set("to", query.to);
      const qs = search.toString();
      res = await fetch(`/api/posts${qs ? `?${qs}` : ""}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "네트워크 요청에 실패했습니다.";
      console.error("[usePosts] fetch failed", err);
      setState({ data: null, isLoading: false, error: message });
      return;
    }

    const json: unknown = await res.json();

    if (!res.ok) {
      const parsedError = ApiErrorSchema.safeParse(json);
      if (!parsedError.success) {
        console.error("[usePosts] error response did not match ApiError shape", parsedError.error, json);
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

    const parsed = PostsListResponseSchema.safeParse(json);
    if (!parsed.success) {
      console.error("[usePosts] response did not match PostsListResponse contract", parsed.error, json);
      setState({
        data: null,
        isLoading: false,
        error: "서버 응답이 계약과 일치하지 않습니다.",
      });
      return;
    }

    setState({ data: parsed.data, isLoading: false, error: null });
  }, []);

  return { ...state, fetchPosts };
}
