# CLAUDE.md — src/api/

> Last updated: 2026-07-19

## Scope

- **Server Actions·API Routes·Client fetch 셋이 응답/에러를 만들 때 반드시 거쳐야 하는 계약 레이어로 설계됐다.** 이름만 보면 "클라이언트 전용"처럼 보이지만 아니다 — `error.ts` 자체 주석에 "Server Actions (handleActionError), API Routes (handleRouteError), Client Side (handleClientError)"라고 명시돼있다. 진짜 클라이언트 전용은 `fetcher.ts` 하나뿐이다.
- **단, 이 레이어는 런타임에서 요청/응답을 실제로 가로채는 인터셉터가 아니다.** 미들웨어(Proxy, `src/CLAUDE.md` 참고)처럼 강제로 거치게 만드는 지점이 없고, 각 route.ts/action이 알아서 `apiSuccess`/`handleRouteError`/`handleActionError`를 호출해야만 일관성이 유지되는 **관례(convention) 기반 계약**이다. 이걸 안 지켜도 빌드도, 런타임도 안 막는다 — 실제로 이미 안 지킨 라우트가 2곳 있다(Gotchas 참고). 그래서 "중앙 핸들러"라고 부르려면 지금 구조로는 부족하고, HOF 래퍼(예: route.ts/action 본문을 감싸는 `withApiHandler`) 같은 강제 메커니즘이 있어야 이름값을 한다.

## Structure

```
src/api/
├── response.ts      # 응답 shape 빌더 — success/apiSuccess(성공), createErrorResponse/createApiErrorResponse/createClientErrorResponse(실패). types/error.ts의 타입 재export.
├── error.ts           # 컨텍스트별 핸들러 — handleActionError(Server Action용)/handleRouteError(Route Handler용)/handleClientError(클라이언트용). 전부 response.ts 빌더에 위임만 함.
└── fetcher.ts           # 클라이언트 전용 — 인증 토큰 주입 + 401 시 refresh 후 재시도 로직 포함한 fetch 래퍼.
```

> 위 함수명(`apiSuccess`/`handleRouteError`/`handleActionError`/`handleClientError` 등)은 현재 구현 기준 이름일 뿐 고정된 계약이 아니다 — 리팩토링(예: HOF 래퍼 전환)으로 이름이 바뀌면 이 문서의 실제 식별자만 갱신한다. 이 문서가 지키려는 규칙의 본질은 "컨텍스트별 전용 빌더/핸들러를 거친다"는 것이지, 특정 함수명 자체가 아니다.

## Critical Convention

- 새 컨텍스트(Server Action/Route Handler/Client fetch)에서 응답을 만들 때 `NextResponse.json(...)`이나 커스텀 shape을 직접 만들지 않는다 — `response.ts`의 빌더 + `error.ts`의 해당 컨텍스트 핸들러를 거친다(Gotchas — 이걸 안 지킨 실제 사례 있음).
- `error.ts`/`response.ts`를 수정할 때 특정 컨텍스트(Action/Route/Client) 하나만 확인하고 끝내지 않는다 — 셋 다 같은 빌더에 의존하므로, 나머지 두 컨텍스트를 깨뜨리지 않는지 확인 후 커밋한다.
- 이 계약이 강제되지 않는다는 전제로 리뷰한다 — 새 route.ts/action을 추가하는 PR에서는 `apiSuccess`/`handleRouteError`/`handleActionError` 호출 여부를 리뷰어가 직접 확인한다(자동 검증 없음, Scope 참고).

## Gotchas

- 폴더명이 `api`라 `app/api/`(Route Handler)나 "클라이언트 API 호출 코드"로 착각하기 쉽다 — 실제로는 세 컨텍스트 공용 계약 레이어다.
- `app/api/upload/signature/route.ts`는 이 계약을 안 쓰고 `NextResponse.json({ error: string }, { status })`를 직접 만든다 — 다른 라우트의 에러 shape(`{ success: false, error: { message, code } }`)과 달라 `handleClientError`가 이 라우트 응답은 못 알아본다.
- `app/api/kakaomap/route.ts`도 이 계약을 안 쓴다 — `Response.json(data)`를 그냥 반환하고 try/catch 자체가 없어서 실패 시 shape이 아예 없다.

## 관련 문서

- 이 계약을 쓰는 Server Actions: `src/actions/CLAUDE.md`
- 이 계약을 쓰는 Route Handlers: `src/app/api/CLAUDE.md`
- 응답/에러 타입 원본: `src/types/CLAUDE.md`(`types/error.ts`)
