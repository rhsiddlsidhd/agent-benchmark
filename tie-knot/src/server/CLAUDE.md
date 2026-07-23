# CLAUDE.md — src/server/

> Last updated: 2026-07-23
> `docs/ARCHITECTURE.md` 마이그레이션으로 생긴 최상위 분류(클라이언트 번들에 절대 안 들어감). 이전 `src/api/CLAUDE.md`의 Route Handler 응답 계약 부분을 이 문서가 흡수했다 — 클라이언트 fetch 쪽(`fetcher`/`apiRequest`) 계약은 `src/client/CLAUDE.md` 참고.

## Overview

`models`/`services`/`lib`/`actions`/`response.ts` — "누가 import하는가" 기준으로 서버에서만 도는 코드를 모은 최상위 폴더. `app/`은 Next.js 라우팅 규약상 여기 못 들어오지만, `app/api/*/route.ts`는 이 트리(`services`/`response.ts`)를 직접 참조한다.

`response.ts`의 응답 envelope(`success`/`data` 또는 `success`/`error`)은 공식 문서가 요구하는 게 아니라, `src/client/fetcher.ts`/`apiRequest.ts`가 라우트마다 다른 shape을 각각 파싱하지 않고 하나의 제네릭 로직으로 모든 응답을 처리하기 위해 이 프로젝트가 판단한 것이다 — Route Handler 자체는 공식 문서상 이 envelope 없이 `Response`만 반환해도 충분하다.

## Structure

```
src/server/
├── models/       # mongoose 스키마 — src/server/models/CLAUDE.md
├── services/     # DAL(비즈니스 로직 + DB 접근 + 인가) — src/server/services/CLAUDE.md
├── lib/          # 서버 전용 외부 연동 — src/server/lib/CLAUDE.md
├── actions/      # Server Actions — src/server/actions/CLAUDE.md
└── response.ts   # Route Handler 전용 응답 빌더 — apiOk(성공)/apiFail(실패), NextResponse.json으로 감쌈. fetcher/apiRequest가 파싱을 위해 의존하는 유일한 envelope.
```

## Critical Convention

- Route Handler 응답은 `response.ts`의 `apiOk`/`apiFail`을 거친다 — `NextResponse.json(...)`/`Response.json(...)`을 route.ts 안에서 직접 만들지 않는다(공식 문서 자체는 `try/catch`+`Response` 직접 반환만 요구하지만, 클라이언트 쪽 `fetcher.ts`/`apiRequest.ts` 둘 다 하나의 제네릭 로직으로 파싱하기 위해 envelope 통일이 필요, 위 Overview 참고).
- **Server Action은 이 계약 대상이 아니다.** 공식 문서(`node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md`): "avoid using try/catch blocks and throw errors [for expected errors]. Instead, model expected errors as return values." — Server Action은 예상된 실패를 이 envelope/클래스 없이 그 액션 전용 plain 객체로 직접 리턴한다(`src/server/actions/CLAUDE.md` 참고). `response.ts`를 Server Action에서 import하지 않는다.
- `response.ts`를 고칠 때 `src/client/fetcher.ts`/`apiRequest.ts`를 깨뜨리지 않는지 확인한다 — 셋 다 이 envelope shape을 그대로 전제하고 파싱한다.
- 클라이언트 번들에 들어가면 안 되는 코드(DB 드라이버, 서버 전용 SDK, `next/headers` 사용 코드 등)는 전부 이 트리 안에 둔다 — 새 서버 전용 코드를 `src/shared/`나 `src/client/`에 두지 않는다.

## Gotchas

- 폴더명이 이전엔 `api`였다(`src/api/`) — 실제로는 Route Handler·Client fetch 둘 사이의 계약 중 서버 절반(`response.ts`)만 남았다. 클라이언트 절반(`fetcher`/`apiRequest`)은 `src/client/`로 이동했다.
- `HTTPError` 클래스(`src/shared/types/error.ts`)는 이 경계 + 서비스 레이어 전용이다 — Server Action은 자기 자신의 검증 실패를 이 클래스로 throw하지 않지만, 서비스 함수가 이미 이 클래스를 던지는 경우는 액션이 `try/catch`+`instanceof HTTPError`로 받아서 리턴값으로 번역한다(`src/server/actions/CLAUDE.md` Gotchas 참고).
- access token은 Bearer 헤더가 아니라 httpOnly 쿠키로 전달된다(트레이드오프는 `src/CLAUDE.md` 참고) — `response.ts`는 토큰을 다루지 않는다.

## 관련 문서

- 클라이언트 fetch 계약(fetcher/apiRequest): `src/client/CLAUDE.md`
- 이 계약에서 제외된 Server Actions: `src/server/actions/CLAUDE.md`
- 이 계약을 쓰는 Route Handlers: `src/app/api/CLAUDE.md`
- 응답/에러 타입 원본: `src/shared/types/CLAUDE.md`(`types/error.ts`)
- server/client/shared 3분할 배경: `docs/ARCHITECTURE.md`
