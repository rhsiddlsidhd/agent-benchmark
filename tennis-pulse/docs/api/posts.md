# API 계약 — posts 도메인 (`/api/posts` · `/api/summary`)

> 상태: Accepted (contract-first)
> 대상(target): `posts`
> 원본 요구사항: `R3`(`/api/posts`), `R4`(`/api/summary`) — `_workspace/00_request.yaml`
> 관련 결정: [ADR-0008](../02_ADR.md) (route 분리 · service 공유), [ADR-0007](../02_ADR.md) (Node/TS 통일), [01_ARCHITECTURE.md §5.2/§5.4/§6](../01_ARCHITECTURE.md)
> 구현 위치: `frontend/api/` (Vercel Serverless, backend 에이전트 소유) — 파일기반 라우팅

이 문서는 backend(서버리스 구현)와 frontend(훅/차트) 병렬 구현의 **공통 기준**이다. 여기서 확정되지 않은 항목은 "미확정"으로 표기했으며, 물리 스키마는 backend 구현 시 최종 확정한다.

---

## 0. 두 엔드포인트 관계 요약 (공유 service 레이어)

`/api/posts`와 `/api/summary`는 **route는 분리, posts 조회 로직은 service 레이어 공유**한다 ([ADR-0008](../02_ADR.md)).

```
frontend/api/
├── posts.ts                  # controller=route → GET /api/posts     (원본 필드 전체 응답)
├── summary.ts                # controller=route → GET /api/summary    (요약 텍스트 응답)
└── services/
    └── posts.ts              # ★ 공유 service 레이어
        ├─ buildPostsQuery(range)      # (내부) WHERE(기간)/ORDER BY 등 조회 조건 — 두 흐름 공통
        ├─ queryPosts(range): Post[]           # /api/posts 소비 — SELECT 원본 필드 전체
        └─ queryPostDigests(range): PostDigest[]  # /api/summary 소비 — SELECT posted_at,title 만
```

- **공유되는 것**: 기간 필터(`posted_at` 범위) + 정렬 등 **조회 조건 로직**(`buildPostsQuery`). 두 엔드포인트가 같은 `posts` 테이블을 같은 조건으로 조회한다.
- **분리되는 것**: SELECT projection과 응답 shape.
  - `/api/posts` → `queryPosts` → 원본 필드 전체(`Post[]`)를 그대로 응답 (프론트가 차트/리스트로 가공).
  - `/api/summary` → `queryPostDigests` → `posted_at + title`만 select(`PostDigest[]`) → OpenAI 요약 → 요약 텍스트 응답.
- route를 나눈 이유: 응답 shape(리스트 vs 요약 텍스트)와 비용/트리거 빈도(DB 읽기 vs OpenAI 과금)가 다르기 때문 ([ADR-0008](../02_ADR.md)).

> service 내부 함수명(`buildPostsQuery`/`queryPosts`/`queryPostDigests`)은 계약을 명확히 하기 위한 권장 시그니처다. 공유 축(조회 조건 로직 공유 + projection만 분리)이 지켜지면 backend가 최종 네이밍을 확정할 수 있다.

---

## 1. 데이터 모델: `Post` / `PostDigest`

`posts` 테이블 **논리 계약**(frontend가 기대할 필드). 정확한 물리 타입/제약/인덱스는 **backend 구현 시 실제 스크래핑 샘플로 최종 확정**한다([01_ARCHITECTURE.md §6](../01_ARCHITECTURE.md)).

### `Post` (원본 필드 전체 — `/api/posts` 응답 요소)

| 필드 | 타입 | nullable | 설명 | 확정도 |
|------|------|----------|------|--------|
| `idxno` | `number` | no | 게시글 PK (tennispeople 원본 식별자) | 물리타입(number/string) 미확정 — 논리상 number |
| `title` | `string` | no | 게시글 제목 | 확정 |
| `author` | `string \| null` | **yes** | 작성자 (원본에 없을 수 있음) | 확정 (nullable) |
| `posted_at` | `string` (ISO 8601) | no | 게시글 작성일. R4의 "date"가 이 필드 | 시각 포함 여부(date vs datetime) 미확정 |
| `views` | `number` | no | 조회수 | 확정 |
| `created_at` | `string` (ISO 8601 datetime) | no | 우리 DB에 적재된 시각(크롤러 UPSERT 시점) | 확정 |

### `PostDigest` (`/api/summary` 내부용 — `Post`의 부분집합)

| 필드 | 타입 | 설명 |
|------|------|------|
| `posted_at` | `string` (ISO 8601) | `Post.posted_at`와 동일 |
| `title` | `string` | `Post.title`과 동일 |

> `PostDigest`는 `Post`의 `Pick<Post, 'posted_at' \| 'title'>` 부분집합이다 — 별도 소스가 아니라 같은 테이블의 projection. 중복 정의 금지.

**런타임 검증 스키마(zod 이식용) 참고 형태**

```
PostSchema = object({
  idxno:      number(),
  title:      string(),
  author:     string().nullable(),
  posted_at:  string(),           // ISO 8601
  views:      number(),
  created_at: string(),           // ISO 8601 datetime
})
PostDigestSchema = PostSchema.pick({ posted_at: true, title: true })
```

---

## 2. `GET /api/posts` (R3)

저장된 게시글을 **원본 필드 전체**로 제공한다. 분석 시점(`new Date()`) 기준 기간별 게시글 수 추이/상대 구간 필터링 차트는 프론트가 이 원본 데이터를 가공해 그린다.

### 파라미터 (query string)

| 이름 | 타입 | 필수 | 기본 | 설명 |
|------|------|------|------|------|
| `from` | `string` (ISO date, `YYYY-MM-DD`) | no | 없음(하한 없음) | `posted_at >= from` 필터. 상대 구간(예: 6개월 전)은 프론트가 `new Date()` 기준으로 계산해 전달 |
| `to` | `string` (ISO date, `YYYY-MM-DD`) | no | 없음(상한 없음) | `posted_at <= to` 필터 |

- `from`/`to` 미지정 시 전체 반환. 상대 구간(6개월/1년)의 기준 시점(`new Date()`)은 **클라이언트에서 계산**해 `from`으로 넘긴다(SPA 특성상 분석 시점은 프론트 소유).
- 정렬: `posted_at` 오름차순(시계열 차트 전제). 최종 정렬 방향은 backend 확정 가능하나, 프론트 차트가 시계열이므로 **오름차순 권장**.

### 응답 `200 OK`

```json
{
  "posts": [ /* Post[] */ ],
  "count": 1234
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `posts` | `Post[]` | §1의 `Post` 배열(원본 필드 전체) |
| `count` | `number` | `posts` 길이(필터 적용 후 총 개수) |

### 예시

요청: `GET /api/posts?from=2026-01-14`

```json
{
  "posts": [
    {
      "idxno": 84213,
      "title": "이번 주말 오픈코트 같이 치실 분",
      "author": "라켓맨",
      "posted_at": "2026-01-15",
      "views": 142,
      "created_at": "2026-07-14T05:12:33.000Z"
    },
    {
      "idxno": 84590,
      "title": "테린이 라켓 추천 부탁드려요",
      "author": null,
      "posted_at": "2026-02-03",
      "views": 87,
      "created_at": "2026-07-14T05:12:41.000Z"
    }
  ],
  "count": 2
}
```

---

## 3. `GET /api/summary` (R4)

지정 기간 게시글의 `posted_at + title`만 service로 조회해 OpenAI API로 요약한 결과를 반환한다. OpenAI 키는 이 서버리스 함수 경유로만 접근한다(프론트 직접 호출 금지).

### 파라미터 (query string)

| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `from` | `string` (ISO date, `YYYY-MM-DD`) | **yes** | 요약 대상 구간 시작. 요약은 반드시 구간을 지정해야 함 |
| `to` | `string` (ISO date, `YYYY-MM-DD`) | **yes** | 요약 대상 구간 끝 |

- 두 파라미터 모두 필수 — 미지정/역전(`from > to`) 시 `400`.
- 내부적으로 `queryPostDigests({ from, to })`로 `PostDigest[]`만 조회 → OpenAI에 전달.

### 응답 `200 OK`

```json
{
  "summary": "…요약 텍스트…",
  "period": { "from": "2026-01-01", "to": "2026-06-30" },
  "postCount": 128
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `summary` | `string` | OpenAI가 생성한 요약 텍스트 |
| `period` | `{ from: string; to: string }` | 요약에 사용된 구간(요청 echo) |
| `postCount` | `number` | 요약 입력에 포함된 게시글 수 |

- 대상 구간에 게시글이 0건이면 `200`으로 `summary`를 빈 요약("해당 기간 게시글 없음" 취지)으로 반환할지, `postCount: 0`으로만 알릴지는 **UX 미확정** — backend/frontend가 QA 전 합의. 기본안: `200` + `postCount: 0` + `summary: ""`(OpenAI 호출 생략해 과금 방지).

### 예시

요청: `GET /api/summary?from=2026-01-01&to=2026-06-30`

```json
{
  "summary": "이 기간 게시글은 오픈코트 모집과 라켓/장비 추천 문의가 주를 이뤘습니다. …",
  "period": { "from": "2026-01-01", "to": "2026-06-30" },
  "postCount": 128
}
```

---

## 4. 에러 shape (두 엔드포인트 공통)

모든 에러는 아래 shape로 통일한다.

```json
{ "error": { "code": "bad_request", "message": "from 파라미터는 필수입니다" } }
```

| HTTP | `code` | 발생 조건 |
|------|--------|-----------|
| `400` | `bad_request` | 파라미터 누락/형식오류(날짜 형식 불량), `from > to` 역전 |
| `405` | `method_not_allowed` | `GET` 외 메서드 |
| `502` | `upstream_error` | 의존 외부시스템 실패 — Supabase 조회 실패(`/api/posts`, `/api/summary` 공통) 또는 OpenAI 호출 실패(`/api/summary`). `message`에 어느 upstream인지 명시 |
| `500` | `internal_error` | 그 외 예기치 못한 서버 오류 |

- 에러를 조용히 삼키지 않는다 — upstream 실패는 `upstream_error`로 표면화하고 서버 로그에 원인 기록.

---

## 5. 외부설정 필요사항 (키 이름/용도만)

| env var | 용도 | 사용 엔드포인트 |
|---------|------|-----------------|
| `SUPABASE_URL` | Supabase 프로젝트 URL | posts, summary |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버리스에서 `posts` 조회용 키(서버 경유 전용, 프론트 노출 금지) | posts, summary |
| `OPENAI_API_KEY` | OpenAI 요약 호출 키(서버 경유 전용) | summary |
| `OPENAI_MODEL` | (선택) 요약 모델명 지정 | summary |

- 위 키는 모두 `VITE_` 접두사 금지(클라이언트 번들 노출 방지). 발급처/실제 값은 사용자 몫.
- Supabase 조회에 anon 키 + RLS를 쓸지 service_role 키를 쓸지는 backend 구현 시 확정(미확정) — 위 표는 service_role 기준 기본안.
