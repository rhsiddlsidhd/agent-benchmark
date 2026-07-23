# CLAUDE.md — src/client/

> Last updated: 2026-07-23
> `docs/ARCHITECTURE.md` 마이그레이션으로 생긴 최상위 분류(브라우저에서만 씀). 이전 `src/api/CLAUDE.md`의 클라이언트 fetch 계약 부분을 이 문서가 흡수했다 — Route Handler 응답 쪽(`response.ts`) 계약은 `src/server/CLAUDE.md` 참고.

## Overview

`components`/`hooks`/`store`/`context`/`lib`/`fetcher.ts`/`apiRequest.ts` — "누가 import하는가" 기준으로 브라우저에서만 도는 코드를 모은 최상위 폴더.

`fetcher`는 **`useSWR`에 전달할 용도로만 좁힌다** — 시그니처는 `(url: string) => Promise<T>`(SWR fetcher 계약) 하나로 고정, 캐싱이 의미 있는 GET 조회 전용(`useBanks`/`useAuth`/`useFetchCoupleInfo`/`useProducts`/`GuestbookSection`). 캐싱 불필요한 mutation(POST/DELETE 등)은 `apiRequest`가 담당한다(Structure 참고) — `fetcher`에 `config`/`options` 인자를 얹어 두 역할을 겸하지 않는다.

## Structure

```
src/client/
├── components/   # atoms/molecules/organisms/templates — src/client/components/CLAUDE.md
├── hooks/        # src/client/hooks/CLAUDE.md
├── store/        # src/client/store/CLAUDE.md
├── context/      # src/client/context/CLAUDE.md
├── lib/          # 브라우저 전용 외부 연동(kakao) + cn — src/client/lib/CLAUDE.md
├── fetcher.ts    # useSWR 전용 — (url: string) => Promise<T>. src/server/response.ts envelope 파싱, 실패 시 HTTPError로 정규화해서 throw. 인증 쿠키는 동일 origin이라 브라우저가 자동으로 실어준다(수동 토큰 주입/401 refresh 로직 없음, Gotchas 참고).
└── apiRequest.ts # SWR 없이 직접 호출하는 mutation 요청 전용(POST/DELETE 등) — method/body 등 RequestInit을 받는다는 점 외엔 fetcher와 동일한 envelope 파싱.
```

## Critical Convention

- **Server Action은 이 계약 대상이 아니다.** Server Action은 예상된 실패를 이 폴더의 envelope/클래스 없이 그 액션 전용 plain 객체로 직접 리턴한다(`src/server/actions/CLAUDE.md` 참고). 이 폴더의 타입/빌더를 Server Action에서 import하지 않는다.
- `fetcher`/`apiRequest` 밖에서 client-side fetch를 직접 만들지 않는다 — envelope 파싱/에러 정규화가 이 둘에 집중돼있으므로, 우회하면 각자 다른 파싱 로직을 재구현하게 된다. `useSWR`과 조합하면 `fetcher`, 그 외 직접 호출은 `apiRequest`를 쓴다.
- `fetcher.ts`/`apiRequest.ts`를 고칠 때 `src/server/response.ts`를 깨뜨리지 않는지 확인한다 — 셋 다 `response.ts`의 envelope shape을 그대로 전제하고 파싱한다.
- 서버 전용 코드(DB 드라이버, `next/headers` 등)를 이 트리에 두지 않는다 — 새 서버 전용 코드는 `src/server/`.

## Gotchas

- 폴더명이 이전엔 `api`(`src/api/`)의 일부였다 — 실제로는 Route Handler·Client fetch 둘 사이의 계약 중 클라이언트 절반(`fetcher`/`apiRequest`)만 여기 있다. 서버 절반(`response.ts`)은 `src/server/`.
- `HTTPError` 클래스(`src/shared/types/error.ts`)는 이 경계 + 서비스 레이어 전용이다 — 서비스 함수가 이미 이 클래스를 던지는 경우 Server Action이 받아서 리턴값으로 번역한다(`src/server/actions/CLAUDE.md` Gotchas 참고).
- access token은 Bearer 헤더가 아니라 httpOnly 쿠키로 전달된다(트레이드오프는 `src/CLAUDE.md` 참고) — `fetcher`/`apiRequest` 둘 다 토큰을 다루지 않는다(쿠키가 동일 origin이라 자동으로 실림), `useAuthStore`에도 `token` 필드가 없다.

## 관련 문서

- Route Handler 응답 계약(response.ts): `src/server/CLAUDE.md`
- 이 계약에서 제외된 Server Actions: `src/server/actions/CLAUDE.md`
- 이 계약을 쓰는 Route Handlers: `src/app/api/CLAUDE.md`
- 응답/에러 타입 원본: `src/shared/types/CLAUDE.md`(`types/error.ts`)
- server/client/shared 3분할 배경: `docs/ARCHITECTURE.md`
