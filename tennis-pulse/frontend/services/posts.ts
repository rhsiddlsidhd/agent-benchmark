// 계약 문서: docs/api/posts.md
// posts 조회(공유) + summary용 OpenAI 요약 비즈니스 로직

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";

import { PostDigestSchema, PostSchema } from "../src/schemas/posts.ts";
import { isValidCalendarDate } from "../src/utils/date.ts";
import type {
  ApiErrorCode,
  Post,
  PostDigest,
  PostsDateRange,
  QueryValidationResult,
  SummaryDateRange,
} from "../src/types/posts.ts";

const POSTS_TABLE = "posts";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export class PostsError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, status: number, message: string) {
    super(message);
    this.name = "PostsError";
    this.code = code;
    this.status = status;
  }
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

let cachedSupabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (cachedSupabase) return cachedSupabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new PostsError("internal_error", 500, "SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY is not configured");
  }

  cachedSupabase = createClient(url, key);
  return cachedSupabase;
}

/** (내부) WHERE(기간)/ORDER BY 등 조회 조건 — /api/posts, /api/summary 공통 */
function buildPostsQuery(client: SupabaseClient, range: PostsDateRange, columns: string) {
  let query = client.from(POSTS_TABLE).select(columns).order("posted_at", { ascending: true });
  if (range.from) query = query.gte("posted_at", range.from);
  if (range.to) query = query.lte("posted_at", range.to);
  return query;
}

/** /api/posts 소비 — SELECT 원본 필드 전체 */
export async function queryPosts(range: PostsDateRange): Promise<Post[]> {
  const client = getSupabaseClient();
  const { data, error } = await buildPostsQuery(client, range, "idxno,title,author,posted_at,views,created_at");

  if (error) {
    throw new PostsError("upstream_error", 502, `Supabase posts query failed: ${error.message}`);
  }

  const parsed = PostSchema.array().safeParse(data);
  if (!parsed.success) {
    throw new PostsError("internal_error", 500, `Post shape mismatch: ${parsed.error.message}`);
  }

  return parsed.data;
}

/** /api/summary 소비 — SELECT posted_at,title 만 */
export async function queryPostDigests(range: SummaryDateRange): Promise<PostDigest[]> {
  const client = getSupabaseClient();
  const { data, error } = await buildPostsQuery(client, range, "posted_at,title");

  if (error) {
    throw new PostsError("upstream_error", 502, `Supabase posts query failed: ${error.message}`);
  }

  const parsed = PostDigestSchema.array().safeParse(data);
  if (!parsed.success) {
    throw new PostsError("internal_error", 500, `PostDigest shape mismatch: ${parsed.error.message}`);
  }

  return parsed.data;
}

let cachedOpenAI: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (cachedOpenAI) return cachedOpenAI;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new PostsError("internal_error", 500, "OPENAI_API_KEY is not configured");
  }

  cachedOpenAI = new OpenAI({ apiKey });
  return cachedOpenAI;
}

/**
 * PostDigest 목록을 OpenAI로 요약한다.
 * 0건이면 OpenAI 호출을 생략하고 빈 요약을 반환한다(계약 문서 3절 기본안 — 과금 방지).
 */
export async function summarizePosts(digests: PostDigest[]): Promise<string> {
  if (digests.length === 0) {
    return "";
  }

  const client = getOpenAIClient();
  const model = process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL;
  const lines = digests.map((digest) => `- ${digest.posted_at}: ${digest.title}`).join("\n");

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "너는 테니스 동호회 게시판 게시글 목록을 한국어로 간결하게 요약하는 어시스턴트다.",
        },
        {
          role: "user",
          content: `아래 게시글 목록(작성일: 제목)을 요약해줘.\n\n${lines}`,
        },
      ],
    });

    return completion.choices[0]?.message?.content?.trim() ?? "";
  } catch (error) {
    throw new PostsError("upstream_error", 502, `OpenAI summarize failed: ${toMessage(error)}`);
  }
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
