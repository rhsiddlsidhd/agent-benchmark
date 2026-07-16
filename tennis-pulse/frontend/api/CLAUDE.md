# CLAUDE.md — frontend/api/

> Last updated: 2026-07-16T00:00:00+09:00

## Scope

- **Vercel Serverless Functions** — Vercel 배포 루트(Root Directory=`frontend`) 바로 아래 `api/`라서 파일기반 라우팅으로 자동 인식됨(`api/{도메인}.ts` → `/api/{도메인}`)

## Structure

```
frontend/api/
└── {도메인}.ts            # controller=route — /api/{도메인}
```

## Critical Convention

- 계약(파라미터/응답타입/에러shape) 확정 없이 엔드포인트 코드를 작성하지 않는다 — `write-api-spec` 스킬로 `docs/api/*.md`를 먼저 확정한다. 이유: 프론트/백 계약 어긋남을 사전에 차단하기 위함
- `api/` 안에 controller가 아닌 파일을 만들지 않는다 — 비즈니스 로직은 `frontend/services/{도메인}.ts`에 둔다. 이유: `api/`는 라우팅 전용 레이어로 물리적으로 고정하기 위함
- 이 라우트만 쓰는 타입은 `frontend/src/types/`로 옮기지 않고 이 파일 안에 인라인으로 정의한다 — 2개 이상 라우트가 같은 타입을 쓰게 될 때만 `frontend/src/types/{도메인}.ts`로 승격한다. 상세: `frontend/src/types/CLAUDE.md`
- 파일명은 kebab-case, 도메인명 그대로 쓴다(예: `posts.ts`) — PascalCase나 목적명으로 바꾸지 않는다. 이유: Vercel 파일기반 라우팅이 파일명을 그대로 URL 경로(`/api/{도메인}`)로 쓴다 — 케이스가 어긋나면 라우트 자체가 깨짐

## Gotchas

## 관련 문서

- API 계약 문서: `docs/api/*.md` (write-api-spec 스킬 산출물)
- 비즈니스 로직 물리 위치: `frontend/services/CLAUDE.md`
- 계약 타입 물리 위치: `frontend/src/CLAUDE.md`
- 파일명 케이스: `frontend/docs/conventions/00_FILE_CONVENTIONS.md`
