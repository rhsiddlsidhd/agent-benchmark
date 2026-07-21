# src/

> Last updated: 2026-07-19

## Overview

`src/`는 이 프로젝트 애플리케이션 코드 루트다. 라우트(`app/`)·컴포넌트·훅·유틸·상태관리 등 전체 구현이 이 아래 있다.

이 파일은 두 가지를 다룬다. 하나는 `src/` 바로 밑에 하위 폴더 없이 단독으로 있는 Next.js 특수 파일(현재 `middleware.ts`) — `AGENTS.md`에 명시된 대로 이 프로젝트의 실제 설치 버전(Next.js 16, `node_modules/next/dist/docs/`) 기준으로 정의한다. 다른 하나는 하위 폴더 2개 이상에 걸쳐 있어 특정 폴더 CLAUDE.md 하나에 넣기엔 범위가 넘치는 교차 컨벤션(배럴 import 정책, `hooks/`-`lib/` 배치 경계, 상태관리 계층 원칙) — `CLAUDE_MD_HIERARCHY.md`의 overlap 승격 규칙에 따라 여기 모은다. 한 폴더 안에서만 완결되는 규칙은 각자 CLAUDE.md 소관이다.

## Structure

```
src/
└── middleware.ts   # Next.js 16 기준 deprecated 파일명 — Critical Convention 참고
```

## Critical Convention

- Next.js 16 이상에서 새 요청 인터셉트 로직을 `middleware.ts`/`export function middleware`로 만들지 않는다 — 공식 문서: `middleware` 파일 컨벤션은 v16.0.0부터 deprecated고 `proxy.ts`/`export function proxy`(또는 default export)로 개명됐다. 기존 `middleware.ts`는 공식 codemod(`npx @next/codemod@canary middleware-to-proxy .`)로 마이그레이션 대상이다.
- Server Action의 인증/권한 검증을 Proxy(옛 Middleware)에 위임하지 않는다 — 이유가 두 겹이다: (1) 공식 문서상 Server Function은 별도 라우트가 아니라 호출된 페이지로 가는 POST 요청이라, matcher가 그 경로를 제외하면 Proxy가 조용히 건너뛴다. (2) 렌더링 시점 접근 제어(인증된 페이지에만 폼을 렌더링하는 것)는 애초에 보안 경계가 아니다 — UI를 거치지 않고도 동일 오리진에서 같은 POST 요청을 직접 보낼 수 있다. 두 이유 모두 각 Server Action 내부에서 세션/역할을 반드시 재검증해야 하는 근거다.
- matcher 없이 Proxy를 배포하지 않는다 — 공식 문서: matcher가 없으면 정적 파일(`_next/static`)·이미지 최적화(`_next/image`)·`public/` 자산까지 모든 요청에서 실행돼, 의도치 않게 CSS/JS/이미지 로딩을 막을 수 있다.
- Proxy 안에서 느린 데이터 페칭(외부 API 호출 등)을 하지 않는다 — 공식 문서: Proxy는 느린 데이터 페칭 용도가 아니며, 세션 관리·인가의 전체 솔루션으로 쓰여서도 안 된다(낙관적 체크 용도로만).
- 프로젝트당 두 번째 proxy/middleware 파일을 만들지 않는다 — 공식 문서: 프로젝트당 `proxy.ts` 단 하나만 지원한다. 로직을 나누고 싶으면 별도 모듈로 쪼갠 뒤 그 안에서 import해서 조립한다.
- `src/constants/`·`src/hooks/`·`src/types/`·`src/utils/` 안에서 개별 파일을 직접 import하지 않는다 — 이 네 폴더는 각자 `index.ts` 배럴을 통해서만 import한다. default export가 있는 파일(`open-app.ts`의 `openApp`, `hooks/`의 일부 파일)은 배럴에서 `export { default as X } from "./x"`로 명시 re-export한다 — `export *`는 default를 안 옮긴다.
- 특정 외부 SDK 초기화에 결합된 훅(예: 카카오맵)을 `src/hooks/`에 두지 않는다 — "훅이라는 형태"가 아니라 "무엇을 감싸는가"가 배치 기준이므로, 그 SDK를 감싸는 라이브러리 폴더(`src/lib/{서비스}/`)가 소유한다.
- 로컬 상태로 충분한 걸 곧바로 Context나 Zustand로 확장하지 않는다 — 클라이언트 상태 범위는 로컬 → Context API(`src/context/`) → Zustand(`src/store/`) 순으로만 넓힌다. 서버에서 온 데이터의 캐싱·중복 호출 방지는 이 사다리와 별개로 `useSWR`(주로 `src/hooks/`의 훅 안에서 Zustand 구독과 함께 조합)이 전담한다 — 서버 상태를 Context/Zustand로 직접 옮기지 않는다.
- **구현체 하나가 2곳 이상의 구체적 소비처에서 쓰이면, 이름에 그 소비처 중 하나를 특정하지 않는다** — 트리거 조건이 다른 두 케이스가 있고 적용법도 다르다.
  - **위치적 이유**: 같은 순수 UI/훅이 2곳 이상의 라우트 컨테이너에서 그대로 재사용될 때 → 접미사 `View`를 붙여 "특정 라우트 전용 컨테이너가 아니라 공유되는 실체"임을 이름에 표시한다(예: `organisms/CoupleInfoFormView.tsx` + `hooks/useCoupleInfoForm.ts`, 각 라우트는 동명의 `_components/CoupleInfoForm.tsx` 컨테이너를 따로 둔다).
  - **내용적 이유**: 컴포넌트/훅이 다루는 도메인 데이터 자체가 2개 이상일 때 → 접미사가 아니라 애초에 이름의 기본형 자체를 도메인 무관한 추상 개념으로 짓는다(예: 게시글 수+검색량을 같이 그리는 차트라면 `PostsChart`가 아니라 `ActivityChart`).
- **영어 사전에 이미 한 단어로 존재하는 합성어는 그 표기를 따르고, PascalCase/camelCase 규칙을 적용한다며 단어 중간을 임의로 대문자화하지 않는다** — 예: `guestbook`은 사전에 등재된 한 단어라 `Guestbook`/`guestbook`이 맞고, `GuestBook`처럼 쪼개 대문자화하지 않는다(`signup`도 동일 이유로 `Signup`/`signup`, `SignUp` 아님). 도메인/파일/식별자 전체에 일관 적용.
- **access token은 Bearer 헤더가 아니라 httpOnly 쿠키로 전달한다(마이그레이션 완료).** 트레이드오프:
  - 이전 구조 — refresh token은 httpOnly 쿠키(`token`), access token은 JSON 응답으로 클라이언트에 내려줘서 `useAuthStore`(Zustand, 비영속)에 저장, 매 요청마다 `Authorization: Bearer <token>` 수동 첨부, 401 감지 시 `src/api/fetcher.ts`가 refresh 후 동시 요청 큐잉까지 하며 재시도. 이 자체(Bearer+401 감지+refresh+동시성 안전 큐잉)는 **업계에 잘 알려진 표준 패턴이다**(axios interceptor refresh-token 패턴과 동일 구조) — 패턴 자체가 틀린 게 아니었다.
  - 근데 이 패턴은 원래 프론트/백엔드가 **다른 origin**일 때(모바일 앱, 별도 도메인 SPA처럼 브라우저가 쿠키를 자동으로 못 실어주는 클라이언트) 필요한 것이다. 이 프로젝트는 Next.js 풀스택이라 프론트와 API가 **동일 origin**, 같은 배포 — 쿠키가 모든 요청에 자동으로 실린다. 그래서 access token도 refresh token처럼 httpOnly 쿠키로 옮겼다 — 서버(Route Handler/Server Action)가 `cookies()`로 직접 읽는다. 클라이언트는 토큰 값을 아예 모른다.
  - 실제 변경: `loginUser.ts`가 access token을 응답 바디 대신 refresh token과 함께 httpOnly 쿠키로 직접 set(`services/auth.service.ts`). `getAuth()`는 access 쿠키를 먼저 확인(빠른 경로, DB 조회 없이 검증)하고 없으면 refresh 쿠키로 재발급 후 access 쿠키를 갱신(느린 경로) — `requireAuth()` 헬퍼가 인증 필수 라우트 전용으로 추가됨. `useAuthStore`에서 `token` 필드 제거, `setToken`→`setSession`으로 개명(더 이상 토큰이 아니므로). `src/api/fetcher.ts`/`apiRequest.ts`에서 Bearer 헤더 주입 + 401 감지·refresh·재시도 큐잉 로직 전부 제거. Bearer 헤더를 직접 검사하던 Route Handler 4개(`couple-info`/`order/create`/`payment/complete`/`products/[id]/like` — `kakaomap`은 검사 대상 아니었음, 외부 Kakao API 인증용 헤더였음)는 `requireAuth()` 호출로 전환. 더 이상 필요 없어진 `auth/refresh`/`auth/verify` 라우트는 삭제.

## Gotchas

- 지금 `src/middleware.ts`의 matcher는 `/api/*`를 포함하지 않는다 — Route Handler(`src/app/api/`)는 Proxy 보호 대상이 아니며, 각 route.ts가 Bearer 토큰 검사를 개별적으로 반복 중이다(현재로선 이게 유일한 방어선).
- Next.js 16에서 Proxy 기본 런타임은 Node.js다(과거 Edge 런타임 기본에서 변경) — Proxy 파일에 `runtime` config 옵션을 쓰면 에러가 난다.
- `Guestbook`이 `GuestBook`으로 잘못 쪼개진 표기를 통일 완료 — 파일 리네임 포함(`GuestBookSection.tsx`→`GuestbookSection.tsx`, `guestBookSection.mapper.ts`→`guestbookSection.mapper.ts`, `GuestBookModal.tsx`→`GuestbookModal.tsx`, `GuestBookClientSection.tsx`→`GuestbookClientSection.tsx`, `deleteGuestBookAction.ts`→`deleteGuestbook.ts`) + 식별자(`GuestBookType`→`GuestbookType` 등). 14개 파일 전부 완료.

## 관련 문서

- Server Action 인증 규칙이 적용되는 대상: `src/actions/CLAUDE.md`
- 배럴 import 정책이 적용되는 대상: `src/constants/CLAUDE.md`, `src/hooks/CLAUDE.md`, `src/types/CLAUDE.md`, `src/utils/CLAUDE.md`
- SDK 초기화 훅 배치 경계 양쪽 당사자: `src/hooks/CLAUDE.md`, `src/lib/CLAUDE.md`
- 상태관리 계층의 각 단: `src/context/CLAUDE.md`(Context), `src/store/CLAUDE.md`(Zustand)
- 추상화 네이밍 규칙이 실제 적용된 사례: `src/components/organisms/CLAUDE.md`(`CoupleInfoFormView`), `src/hooks/CLAUDE.md`(`useCoupleInfoForm`/`useNavigationGeo`)
