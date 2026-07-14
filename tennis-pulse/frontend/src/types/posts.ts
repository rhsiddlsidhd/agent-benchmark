// 계약 타입 import 전용 — 새로 정의/재선언하지 않는다.
// 원본: frontend/api/types/posts.ts (backend 산출물)
// 계약 문서: docs/api/posts.md
export { PostSchema, PostDigestSchema } from "../../api/types/posts";
export type {
  Post,
  PostDigest,
  ApiErrorCode,
  ApiError,
  PostsListResponse,
  SummaryResponse,
} from "../../api/types/posts";
