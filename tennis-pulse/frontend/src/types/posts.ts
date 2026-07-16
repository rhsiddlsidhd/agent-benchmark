// 계약 문서: docs/api/posts.md

import { z } from "zod";
import {
  ApiErrorCodeSchema,
  ApiErrorSchema,
  PostDigestSchema,
  PostSchema,
  PostsListResponseSchema,
  SummaryResponseSchema,
} from "../schemas/posts";

export type Post = z.infer<typeof PostSchema>;
export type PostDigest = z.infer<typeof PostDigestSchema>;
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type PostsListResponse = z.infer<typeof PostsListResponseSchema>;
export type SummaryResponse = z.infer<typeof SummaryResponseSchema>;

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
