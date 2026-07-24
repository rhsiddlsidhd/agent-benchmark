# CLAUDE.md — src/client/

> Last updated: 2026-07-23
> `docs/ARCHITECTURE.md` 마이그레이션으로 생긴 최상위 분류(브라우저에서만 씀). 이전 `src/api/CLAUDE.md`의 클라이언트 fetch 계약 부분을 이 문서가 흡수했다 — Route Handler 응답 쪽(`response.ts`) 계약은 `src/server/CLAUDE.md` 참고.

## Overview

`components`/`hooks`/`store`/`context`/`lib`/`fetcher.ts` — "누가 import하는가" 기준으로 브라우저에서만 도는 코드를 모은 최상위 폴더.

`fetcher`는 **`useSWR`에 전달할 용도로만 좁힌다** — 시그니처는 `(url: string) => Promise<T>`(SWR fetcher 계약) 하나로 고정, 캐싱이 의미 있는 GET 조회 전용(`useBanks`/`useAuth`/`useFetchCoupleInfo`/`useProducts`/`GuestbookSection`). 브라우저 mutation은 이 폴더의 fetch가 아니라 Server Action(`src/server/actions/`)으로 간다 — 클라이언트에 mutation용 fetch 래퍼를 두지 않는다(과거 `apiRequest`는 제거 대상, Structure 참고).

## Structure

```
src/client/
├── components/   # atoms/molecules/organisms/templates — src/client/components/CLAUDE.md
├── hooks/        # src/client/hooks/CLAUDE.md
├── store/        # src/client/store/CLAUDE.md
├── context/      # src/client/context/CLAUDE.md
├── lib/          # 브라우저 전용 외부 연동(kakao) + cn — src/client/lib/CLAUDE.md
└── fetcher.ts    # useSWR 전용 — (url: string) => Promise<T>. src/server/response.ts envelope 파싱, 실패 시 ErrorPayload로 정규화해서 throw(세부는 아래 "에러 처리" 참고). 인증 쿠키는 동일 origin이라 브라우저가 자동으로 실어준다(수동 토큰 주입/401 refresh 로직 없음, Gotchas 참고).
```

> `apiRequest.ts`는 제거한다 — 브라우저 mutation은 전부 Server Action으로 이관한다(`src/CLAUDE.md` 데이터접근표 row 2). 남아있던 호출자(좋아요 토글/로그아웃/결제 검증/entry 토큰)는 Server Action으로 옮긴다.

## 에러 처리(목표 설계, 마이그레이션 진행 중)

> 전체 그림/공용 taxonomy는 `src/CLAUDE.md`의 "에러 핸들링" 참고. 여기는 이 폴더(채널 C) 전용 규칙만 다룬다.

- **C(`useSWR`)**: 응답 형태(`{data, error, isLoading}`)와 사용 패턴 자체가 공식 문서에 있다 — 공식 문서(`fetching-data.md`) 예제: `const { data, error, isLoading } = useSWR(...)`, `if (error) return <div>Error: {error.message}</div>`. `error`를 꺼내 렌더하는 것까지 공식 예제 패턴이다 — 리턴받고도 소비처가 렌더에 안 쓰면 그 패턴 위반이다.
- **폼 mutation 결과(채널 A)**: `useActionState`의 state로 받아 그대로 렌더한다 — `state`가 실은 `ErrorPayload`이므로 `fieldErrors`는 input 밑에, `message`는 전역 알림에.
- `fetcher`가 던진 에러든 action이 리턴한 `ErrorPayload`든, 클라이언트는 "필드냐/메시지냐/무반응이냐"를 **판단하지 않는다** — 서버가 이미 표시-안전한 `ErrorPayload`(민감 분류는 일반화, 필드 에러는 fieldErrors에)를 보냈으므로 컴포넌트는 그 shape을 그대로 렌더할 뿐이다(과거 `src/shared/utils`의 클라 판단 로직은 제거됐다).

## Critical Convention

- **Server Action은 `fetcher` 계약 대상이 아니다.** Server Action의 실패는 `fetcher`/`response.ts` envelope를 거치지 않고 `useActionState` state(`ErrorPayload`)로 직접 내려온다 — `fetcher`를 Server Action 호출에 쓰지 않는다(`ErrorPayload` 타입 자체는 `src/shared/types` 공유 계약이다).
- `fetcher` 밖에서 client-side fetch를 직접 만들지 않는다 — envelope 파싱/에러 정규화가 `fetcher`에 집중돼있으므로 우회하면 각자 다른 파싱 로직을 재구현하게 된다. GET 조회는 `useSWR`+`fetcher`, mutation은 Server Action이라 클라이언트에 그 외 fetch가 없다.
- `fetcher.ts`를 고칠 때 `src/server/response.ts`를 깨뜨리지 않는지 확인한다 — 둘 다 `response.ts`의 envelope shape(`ErrorPayload` 포함)을 그대로 전제하고 파싱한다.
- 서버 전용 코드(DB 드라이버, `next/headers` 등)를 이 트리에 두지 않는다 — 새 서버 전용 코드는 `src/server/`.

## Gotchas

- 폴더명이 이전엔 `api`(`src/api/`)의 일부였다 — 실제로는 Route Handler·Client fetch 둘 사이의 계약 중 클라이언트 절반(`fetcher`)만 여기 있다. 서버 절반(`response.ts`)은 `src/server/`.
- 서비스 레이어가 던지는 에러 타입(`src/shared/types/error.ts`)은 이 경계 + 서비스 레이어 전용이다 — 서비스 함수가 이미 이 타입을 던지는 경우 Server Action이 받아서 리턴값으로 번역한다(`src/server/actions/CLAUDE.md` Gotchas 참고).
- access token은 Bearer 헤더가 아니라 httpOnly 쿠키로 전달된다(트레이드오프는 `src/CLAUDE.md` 참고) — `fetcher`는 토큰을 다루지 않는다(쿠키가 동일 origin이라 자동으로 실림), `useAuthStore`에도 `token` 필드가 없다.

## 관련 문서

- Route Handler 응답 계약(response.ts): `src/server/CLAUDE.md`
- 이 계약에서 제외된 Server Actions: `src/server/actions/CLAUDE.md`
- 이 계약을 쓰는 Route Handlers: `src/app/api/CLAUDE.md`
- 응답/에러 타입 원본: `src/shared/types/CLAUDE.md`(`types/error.ts`)
- server/client/shared 3분할 배경: `docs/ARCHITECTURE.md`
