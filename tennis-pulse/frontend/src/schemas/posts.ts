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

/** `Post`의 `Pick<Post, 'posted_at' | 'title'>` 부분집합 — `/api/summary` 내부용 */
export const PostDigestSchema = PostSchema.pick({ posted_at: true, title: true });

export const ApiErrorCodeSchema = z.enum([
  "bad_request",
  "method_not_allowed",
  "upstream_error",
  "internal_error",
]);

export const ApiErrorSchema = z.object({
  error: z.object({
    code: ApiErrorCodeSchema,
    message: z.string(),
  }),
});

export const PostsListResponseSchema = z.object({
  posts: z.array(PostSchema),
  count: z.number(),
});

export const SummaryResponseSchema = z.object({
  summary: z.string(),
  period: z.object({
    from: z.string(),
    to: z.string(),
  }),
  postCount: z.number(),
});
