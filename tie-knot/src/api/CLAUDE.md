# CLAUDE.md — src/api/

> Last updated: 2026-07-18

## Scope

- **Server Actions·API Routes·Client fetch 셋이 공유하는 응답/에러 계약 레이어.** 이름만 보면 "클라이언트 전용"처럼 보이지만 아니다 — `error.ts` 자체 주석에 "Server Actions (handleActionError), API Routes (handleRouteError), Client Side (handleClientError)"라고 명시돼있다. 진짜 클라이언트 전용은 `fetcher.ts` 하나뿐이다.

## Structure

```
src/api/
├── response.ts      # 응답 shape 빌더 — success/apiSuccess(성공), createErrorResponse/createApiErrorResponse/createClientErrorResponse(실패). types/error.ts의 타입 재export.
├── error.ts           # 컨텍스트별 핸들러 — handleActionError(Server Action용)/handleRouteError(Route Handler용)/handleClientError(클라이언트용). 전부 response.ts 빌더에 위임만 함.
└── fetcher.ts           # 클라이언트 전용 — 인증 토큰 주입 + 401 시 refresh 후 재시도 로직 포함한 fetch 래퍼.
```

## Critical Convention

- 새 컨텍스트(Server Action/Route Handler/Client fetch)에서 응답을 만들 때 `NextResponse.json(...)`이나 커스텀 shape을 직접 만들지 않는다 — `response.ts`의 빌더 + `error.ts`의 해당 컨텍스트 핸들러를 거친다(`src/app/api/CLAUDE.md` Gotchas — 이걸 안 지킨 실제 사례 있음).
- `error.ts`/`response.ts`를 수정할 땐 세 컨텍스트(Action/Route/Client) 전부에 영향이 간다는 걸 인지한다 — 특정 컨텍스트만 고치려고 만든 변경이 다른 둘을 깨뜨리지 않는지 확인한다.

## Gotchas

- 폴더명이 `api`라 `app/api/`(Route Handler)나 "클라이언트 API 호출 코드"로 착각하기 쉽다 — 실제로는 세 컨텍스트 공용 계약 레이어다.

## 관련 문서

- 이 계약을 쓰는 Server Actions: `src/actions/CLAUDE.md`
- 이 계약을 쓰는 Route Handlers: `src/app/api/CLAUDE.md`
- 응답/에러 타입 원본: `src/types/CLAUDE.md`(`types/error.ts`)
