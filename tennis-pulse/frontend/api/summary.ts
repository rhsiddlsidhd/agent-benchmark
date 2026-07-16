// 계약 문서: docs/api/posts.md
// GET /api/summary — Vercel Serverless Function (파일기반 라우팅: controller=route)

import type { IncomingMessage, ServerResponse } from "node:http";

import type { ApiError, SummaryResponse } from "../src/types/posts.ts";
import { PostsError, queryPostDigests, summarizePosts, validateSummaryQuery } from "../services/posts.ts";

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
  const validation = validateSummaryQuery(url.searchParams);

  if (!validation.ok) {
    sendError(res, 400, "bad_request", validation.message);
    return;
  }

  try {
    const { from, to } = validation.value;
    const digests = await queryPostDigests({ from, to });
    const summary = await summarizePosts(digests);
    const body: SummaryResponse = { summary, period: { from, to }, postCount: digests.length };
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body));
  } catch (error) {
    if (error instanceof PostsError) {
      sendError(res, error.status, error.code, error.message);
      return;
    }
    console.error("[summary] unexpected error", error);
    sendError(res, 500, "internal_error", "Unexpected server error");
  }
}
