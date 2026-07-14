// 계약 문서: docs/api/posts.md

import { z } from "zod";

/** posts 테이블 논리 계약 — 원본 필드 전체 (`/api/posts` 응답 요소) */
export const PostSchema = z.object({
  idxno: z.number(),
  title: z.string(),
  author: z.string().nullable(),
  posted_at: z.string(), // ISO 8601
  views: z.number(),
  created_at: z.string(), // ISO 8601 datetime
});
export type Post = z.infer<typeof PostSchema>;

/** `Post`의 `Pick<Post, 'posted_at' | 'title'>` 부분집합 — `/api/summary` 내부용 */
export const PostDigestSchema = PostSchema.pick({ posted_at: true, title: true });
export type PostDigest = z.infer<typeof PostDigestSchema>;

export type ApiErrorCode = "bad_request" | "method_not_allowed" | "upstream_error" | "internal_error";

export interface ApiError {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

export interface PostsListResponse {
  posts: Post[];
  count: number;
}

export interface SummaryResponse {
  summary: string;
  period: { from: string; to: string };
  postCount: number;
}

/** `/api/posts` 쿼리 — from/to 둘 다 선택 */
export interface PostsDateRange {
  from?: string;
  to?: string;
}

/** `/api/summary` 쿼리 — from/to 둘 다 필수 */
export interface SummaryDateRange {
  from: string;
  to: string;
}

export type QueryValidationResult<T> = { ok: true; value: T } | { ok: false; message: string };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidCalendarDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** `GET /api/posts` 쿼리 검증 — 계약 문서 2절. from/to 미지정 허용, 지정 시 형식/역전만 검사 */
export function validatePostsQuery(params: URLSearchParams): QueryValidationResult<PostsDateRange> {
  const fromRaw = params.get("from")?.trim();
  const toRaw = params.get("to")?.trim();
  const from = fromRaw ? fromRaw : undefined;
  const to = toRaw ? toRaw : undefined;

  if (from !== undefined && !isValidCalendarDate(from)) {
    return { ok: false, message: "from must be a valid YYYY-MM-DD date" };
  }
  if (to !== undefined && !isValidCalendarDate(to)) {
    return { ok: false, message: "to must be a valid YYYY-MM-DD date" };
  }
  if (from !== undefined && to !== undefined && from > to) {
    return { ok: false, message: "from must not be after to" };
  }

  return { ok: true, value: { from, to } };
}

/** `GET /api/summary` 쿼리 검증 — 계약 문서 3절. from/to 둘 다 필수, 역전 시 400 */
export function validateSummaryQuery(params: URLSearchParams): QueryValidationResult<SummaryDateRange> {
  const from = params.get("from")?.trim() ?? "";
  const to = params.get("to")?.trim() ?? "";

  if (!from) return { ok: false, message: "from is required" };
  if (!to) return { ok: false, message: "to is required" };
  if (!isValidCalendarDate(from)) return { ok: false, message: "from must be a valid YYYY-MM-DD date" };
  if (!isValidCalendarDate(to)) return { ok: false, message: "to must be a valid YYYY-MM-DD date" };
  if (from > to) return { ok: false, message: "from must not be after to" };

  return { ok: true, value: { from, to } };
}
