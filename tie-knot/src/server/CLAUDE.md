# CLAUDE.md — src/server/

> Last updated: 2026-07-23
> `docs/ARCHITECTURE.md` 마이그레이션으로 생긴 최상위 분류(클라이언트 번들에 절대 안 들어감). 이전 `src/api/CLAUDE.md`의 Route Handler 응답 계약 부분을 이 문서가 흡수했다 — 클라이언트 fetch 쪽(`fetcher`) 계약은 `src/client/CLAUDE.md` 참고.

## Overview

`models`/`services`/`lib`/`actions`/`response.ts` — "누가 import하는가" 기준으로 서버에서만 도는 코드를 모은 최상위 폴더. `app/`은 Next.js 라우팅 규약상 여기 못 들어오지만, `app/api/*/route.ts`는 이 트리(`services`/`response.ts`)를 직접 참조한다.

`response.ts`의 응답 envelope(`success`/`data` 또는 `success`/`error`)은 공식 문서가 요구하는 게 아니라, `src/client/fetcher.ts`가 라우트마다 다른 shape을 각각 파싱하지 않고 하나의 제네릭 로직으로 모든 응답을 처리하기 위해 이 프로젝트가 판단한 것이다 — Route Handler 자체는 공식 문서상 이 envelope 없이 `Response`만 반환해도 충분하다.

## Structure

```
src/server/
├── models/       # mongoose 스키마 — src/server/models/CLAUDE.md
├── services/     # DAL(비즈니스 로직 + DB 접근 + 인가) — src/server/services/CLAUDE.md
├── lib/          # 서버 전용 외부 연동 — src/server/lib/CLAUDE.md
├── actions/      # Server Actions — src/server/actions/CLAUDE.md
└── response.ts   # Route Handler 전용 응답 빌더 — 세부는 아래 "에러 처리" 참고.
```

## 에러 처리(목표 설계, 마이그레이션 진행 중)

> 전체 그림/공용 taxonomy는 `src/CLAUDE.md`의 "에러 핸들링 — 공통 규칙" 참고. 여기는 이 폴더(채널 B, route.ts) 전용 규칙만 다룬다.

- **기본 규칙**: 네이티브 `Response`를 쓴다 — 공식 문서(`route-handlers.md`): `return Response.json({ data })`.
- **예외 규칙**: `NextResponse`는 `.cookies`(`get`/`set`/`has`/`delete`), `.redirect()`, `.rewrite()` 중 하나가 실제로 필요할 때만 쓴다 — 공식 문서(`next-response.md`): "NextResponse extends the Web Response API with additional convenience methods." 이 세 가지가 그 "추가 편의 메서드"의 전부다.
- route.ts 핵심 로직 안에서 try/catch나 로깅을 직접 하지 않는다 — services가 던진 `AppError`를 캐치하고, 로깅하고, `Response`로 번역(분류→HTTP status 매핑 + body에 `ErrorPayload { 분류, message, fieldErrors? }` 실기)하는 건 공용 핸들러가 전담한다. 핵심 로직은 그냥 throw만 한다.
- 민감 분류(INTERNAL/EXTERNAL_SERVICE)의 `message`는 이 공용 핸들러가 일반 문구로 바꿔 담는다 — 원문은 로그에만. `분류→안전문구` lookup map은 Server Action 핸들러와 공유한다(로직 아닌 데이터라 채널 분리 위반 아님).
- 로깅은 그 공용 핸들러 안에서만 한다 — route.ts마다 각자 `console.error`를 찍지 않는다.
- 분류→HTTP status 매핑표는 `response.ts` 쪽에 둔다 — 에러 타입 정의(`src/shared/types/error.ts`) 안에는 안 둔다(services는 HTTP를 몰라야 한다는 원칙과 같은 이유).
- Server Action용 공용 핸들러와는 별개로 둔다 — 리턴 형태가 근본적으로 다르다(HTTP Response vs 함수 리턴값).

## Critical Convention

- Route Handler 응답은 `response.ts`의 공용 응답 빌더를 거친다 — `NextResponse.json(...)`/`Response.json(...)`을 route.ts 안에서 직접 만들지 않는다.
- **Server Action은 이 계약 대상이 아니다.** 공식 문서(`node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md`): "avoid using try/catch blocks and throw errors [for expected errors]. Instead, model expected errors as return values." — Server Action은 예상된 실패를 이 envelope 없이 그 액션 전용 plain 객체로 직접 리턴한다(`src/server/actions/CLAUDE.md` 참고). `response.ts`를 Server Action에서 import하지 않는다.
- `response.ts`를 고칠 때 클라이언트 쪽 파싱 로직을 깨뜨리지 않는지 확인한다 — 클라이언트도 이 envelope shape을 전제하고 파싱한다.
- 클라이언트 번들에 들어가면 안 되는 코드(DB 드라이버, 서버 전용 SDK, `next/headers` 사용 코드 등)는 전부 이 트리 안에 둔다 — 새 서버 전용 코드를 `src/shared/`나 `src/client/`에 두지 않는다.

## Gotchas

- 폴더명이 이전엔 `api`였다(`src/api/`) — 실제로는 Route Handler·Client fetch 둘 사이의 계약 중 서버 절반(`response.ts`)만 남았다. 클라이언트 절반(`fetcher`)은 `src/client/`로 이동했다.
- 서비스 레이어가 던지는 에러 타입(`src/shared/types/error.ts`)은 이 경계 + 서비스 레이어 전용이다 — Server Action은 자기 자신의 검증 실패를 이 타입으로 throw하지 않지만, 서비스 함수가 이미 이 타입을 던지는 경우는 액션이 캐치해서 리턴값으로 번역한다(`src/server/actions/CLAUDE.md` Gotchas 참고).
- access token은 Bearer 헤더가 아니라 httpOnly 쿠키로 전달된다(트레이드오프는 `src/CLAUDE.md` 참고) — `response.ts`는 토큰을 다루지 않는다.

## 관련 문서

- 클라이언트 fetch 계약(fetcher): `src/client/CLAUDE.md`
- 이 계약에서 제외된 Server Actions: `src/server/actions/CLAUDE.md`
- 이 계약을 쓰는 Route Handlers: `src/app/api/CLAUDE.md`
- 응답/에러 타입 원본: `src/shared/types/CLAUDE.md`(`types/error.ts`)
- server/client/shared 3분할 배경: `docs/ARCHITECTURE.md`
