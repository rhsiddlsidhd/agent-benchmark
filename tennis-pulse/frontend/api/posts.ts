// 계약 문서: docs/api/posts.md
// GET /api/posts — Vercel Serverless Function (파일기반 라우팅: controller=route)

import type { IncomingMessage, ServerResponse } from "node:http";

import { validatePostsQuery } from "./types/posts.ts";
import type { ApiError, PostsListResponse } from "./types/posts.ts";
import { PostsError, queryPosts } from "./services/posts.ts";

function sendError(
  res: ServerResponse,
  status: number,
  code: ApiError["error"]["code"],
  message: string,
): void {
  const body: ApiError = { error: { code, message } };
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== "GET") {
    sendError(res, 405, "method_not_allowed", "Only GET is allowed");
    return;
  }

  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const validation = validatePostsQuery(url.searchParams);

  if (!validation.ok) {
    sendError(res, 400, "bad_request", validation.message);
    return;
  }

  try {
    const posts = await queryPosts(validation.value);
    const body: PostsListResponse = { posts, count: posts.length };
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body));
  } catch (error) {
    if (error instanceof PostsError) {
      sendError(res, error.status, error.code, error.message);
      return;
    }
    console.error("[posts] unexpected error", error);
    sendError(res, 500, "internal_error", "Unexpected server error");
  }
}
