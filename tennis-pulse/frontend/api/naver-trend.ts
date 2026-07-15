// 계약 문서: docs/api/naver-trend.md
// GET /api/naver-trend — Vercel Serverless Function (파일기반 라우팅: controller=route)

import type { IncomingMessage, ServerResponse } from "node:http";

import { validateNaverTrendQuery } from "../src/types/naver-trend.ts";
import type { ApiError } from "../src/types/naver-trend.ts";
import { NaverTrendError, fetchNaverTrend } from "../src/services/naver-trend.ts";

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
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const validation = validateNaverTrendQuery(url.searchParams);

  if (!validation.ok) {
    sendError(res, 400, "INVALID_PARAM", validation.message);
    return;
  }

  try {
    const data = await fetchNaverTrend(validation.value);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  } catch (error) {
    if (error instanceof NaverTrendError) {
      sendError(res, error.status, error.code, error.message);
      return;
    }
    console.error("[naver-trend] unexpected error", error);
    sendError(res, 500, "INTERNAL", "Unexpected server error");
  }
}
