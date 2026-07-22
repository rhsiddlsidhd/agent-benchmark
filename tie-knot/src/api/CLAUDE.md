# CLAUDE.md — src/api/

> Last updated: 2026-07-19

## Overview

`src/api/`는 Route Handler ↔ Client fetch 사이에서만 쓰는 공유 계약 + 클라이언트 fetch 중앙 처리를 담당한다. Server Action은 이 폴더 소관이 아니다(공식 문서 근거는 Critical Convention 참고) — `src/actions/CLAUDE.md`가 별도로 다룬다.

`fetcher`는 **`useSWR`에 전달할 용도로만 좁힌다** — 시그니처는 `(url: string) => Promise<T>`(SWR fetcher 계약) 하나로 고정, 캐싱이 의미 있는 GET 조회 전용(`useBanks`/`useAuth`/`useFetchCoupleInfo`/`useProducts`/`GuestbookSection`). 캐싱 불필요한 mutation(POST/DELETE 등)은 `apiRequest`가 담당한다(Structure 참고) — `fetcher`에 `config`/`options` 인자를 얹어 두 역할을 겸하지 않는다.

`response.ts`의 응답 envelope(`success`/`data` 또는 `success`/`error`)은 공식 문서가 요구하는 게 아니라, `fetcher.ts`/`apiRequest.ts`가 라우트마다 다른 shape을 각각 파싱하지 않고 하나의 제네릭 로직으로 모든 응답을 처리하기 위해 이 프로젝트가 판단한 것이다 — Route Handler 자체는 공식 문서상 이 envelope 없이 `Response`만 반환해도 충분하다.

## Structure

```
src/api/
├── index.ts   # 배럴 — export *
├── response.ts   # Route Handler 전용 응답 빌더 — apiOk(성공)/apiFail(실패), NextResponse.json으로 감쌈. fetcher/apiRequest가 파싱을 위해 의존하는 유일한 envelope.
├── fetcher.ts    # useSWR 전용 — (url: string) => Promise<T>. response.ts envelope 파싱, 실패 시 HTTPError로 정규화해서 throw. 인증 쿠키는 동일 origin이라 브라우저가 자동으로 실어준다(수동 토큰 주입/401 refresh 로직 없음, Gotchas 참고).
└── apiRequest.ts   # SWR 없이 직접 호출하는 mutation 요청 전용(POST/DELETE 등) — method/body 등 RequestInit을 받는다는 점 외엔 fetcher와 동일한 envelope 파싱.
```

## Critical Convention

- **Server Action은 이 계약 대상이 아니다.** 공식 문서(`node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md`): "avoid using try/catch blocks and throw errors [for expected errors]. Instead, model expected errors as return values." — Server Action은 예상된 실패를 이 폴더의 envelope/클래스 없이 그 액션 전용 plain 객체로 직접 리턴한다(`src/actions/CLAUDE.md` 참고). 이 폴더의 타입/빌더를 Server Action에서 import하지 않는다.
- Route Handler 응답은 `response.ts`의 `apiOk`/`apiFail`을 거친다 — `NextResponse.json(...)`/`Response.json(...)`을 route.ts 안에서 직접 만들지 않는다(공식 문서 자체는 `try/catch`+`Response` 직접 반환만 요구하지만, 이 프로젝트는 클라이언트 쪽 `fetcher.ts`/`apiRequest.ts` 둘 다 하나의 제네릭 로직으로 파싱하기 위해 envelope 통일이 필요, 위 Overview 참고).
- `fetcher`/`apiRequest` 밖에서 client-side fetch를 직접 만들지 않는다 — envelope 파싱/에러 정규화가 이 둘에 집중돼있으므로, 우회하면 각자 다른 파싱 로직을 재구현하게 된다. `useSWR`과 조합하면 `fetcher`, 그 외 직접 호출은 `apiRequest`를 쓴다.
- `response.ts`/`fetcher.ts`/`apiRequest.ts`를 고칠 때 나머지를 깨뜨리지 않는지 확인한다 — 셋 다 `response.ts`의 envelope shape을 그대로 전제하고 파싱한다.

## Gotchas

- 폴더명이 `api`라 `app/api/`(Route Handler)나 "클라이언트 API 호출 코드 전반"으로 착각하기 쉽다 — 실제로는 Route Handler·Client fetch 둘 사이의 계약 + 클라이언트 중앙 fetch 핸들러다. Server Action은 명시적으로 제외.
- `HTTPError` 클래스(`src/types/error.ts`)는 이 폴더(Route/fetch 경계) + 서비스 레이어 전용이다 — Server Action은 자기 자신의 검증 실패를 이 클래스로 throw하지 않지만(위 Critical Convention), 서비스 함수가 이미 이 클래스를 던지는 경우는 액션이 `try/catch`+`instanceof HTTPError`로 받아서 리턴값으로 번역한다(`src/actions/CLAUDE.md` Gotchas 참고).
- access token은 Bearer 헤더가 아니라 httpOnly 쿠키로 전달된다(트레이드오프는 `src/CLAUDE.md` 참고) — `fetcher`/`apiRequest` 둘 다 토큰을 다루지 않는다(쿠키가 동일 origin이라 자동으로 실림), `useAuthStore`에도 `token` 필드가 없다.

## 관련 문서

- 이 계약에서 제외된 Server Actions: `src/actions/CLAUDE.md`
- 이 계약을 쓰는 Route Handlers: `src/app/api/CLAUDE.md`
- 응답/에러 타입 원본: `src/types/CLAUDE.md`(`types/error.ts`)
