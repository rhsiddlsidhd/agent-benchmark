# src/app

> Last updated: 2026-07-08

Next.js App Router 진입점 — 페이지/레이아웃/에러 경계. Route Handler(API) 세부 규칙은 `src/app/api/CLAUDE.md`에서 관리한다.

## Structure
- 라우트 전용 부속물(타입/순수함수/상수/서브 UI)은 Next 공식 private 폴더(`_folder`)로 분리한다. **필요한 것만** 생성 — 빈 폴더 강제 금지. 대표 예(`movie/[id]/`):
  ```
  movie/[id]/
  ├── page.tsx              # 조립(JSX)만 — 아래 4종에서 import
  ├── error.tsx / loading.tsx / not-found.tsx
  ├── detail.module.css
  ├── _components/          # 라우트 전용 서브 UI
  │   ├── index.tsx         # 배럴
  │   └── PersonLink.tsx
  ├── _types/               # 라우트 전용 타입/interface
  │   ├── index.ts
  │   └── KeyCrewPerson.ts
  ├── _utils/               # 라우트 전용 순수함수
  │   ├── index.ts
  │   └── formatRuntime.ts
  ├── _constants/           # 라우트 전용 상수
  │   ├── index.ts
  │   └── keyCrewJobs.ts
  └── _hooks/               # 라우트 전용 훅(특정 Route Handler에 1:1로 묶인 TanStack Query 훅 포함)
      ├── index.ts
      └── useDiscoverInfinite.ts
  ```
  파일명 케이스는 Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`를 따른다.

## Critical Conventions

- `error.tsx`와 `not-found.tsx`를 혼용하지 않는다 — `error.tsx`는 fetch 실패(타임아웃/5xx/네트워크) 경계, `not-found.tsx`는 존재하지 않는 리소스 전용이다.
- `loading.tsx`는 해당 세그먼트가 Server Component에서 직접 TMDB fetch를 할 때만 만든다 — 콘텐츠 모양에 맞는 스켈레톤으로 CLS를 줄이는 게 목적이라 fetch가 없으면 의미가 없다. fetch 없는 얇은 Client 컴포넌트 껍데기 라우트(예: `/search`)는 생략하고 로딩/에러는 TanStack Query 상태로 처리한다.
- `error.tsx`는 다음 중 하나에 해당할 때만 라우트별로 만든다 — 아니면 만들지 않고 루트 `error.tsx`에 위임한다. `error.js`는 선언되지 않은 세그먼트의 에러를 가장 가까운 부모 boundary로 자동 버블업한다(`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`).
  1. 라우트마다 다른 에러 메시지/UI가 필요하다.
  2. 그 라우트 위에 별도 `layout.tsx`가 끼어 있어 재시도 범위를 좁혀야 한다.
- `page.tsx`에 interface/순수함수/상수/서브 UI 컴포넌트/훅을 인라인으로 쌓지 않는다 — `_components`/`_types`/`_utils`/`_constants`/`_hooks`로 분리한다. 이 분리 규칙은 `page.tsx` 세그먼트 기준이며, `route.ts`(api) 전용 규칙은 `src/app/api/CLAUDE.md`에서 별도 관리한다.
- `_components`/`_types`/`_utils`/`_constants`/`_hooks`를 폴더 + `index.ts`(컴포넌트는 `index.tsx`) 배럴 형태 외의 방식으로 만들지 않는다 — 폴더 안 파일이 1개뿐이어도 예외 없이 이 형태를 유지한다.
- 각 파일은 기본적으로 export 1개다(`_components`/`_utils`/`_types`/`_constants`/`_hooks` 공통). 여러 export를 한 파일에 두는 건 하위 export가 주 export의 함수 body 안에서 직접 호출될 때만 허용한다 — 같은 도메인/섹션에서 쓰인다는 이유만으로 묶지 않는다.
  - 컴포넌트 예: `Skeleton`이 내부에서 `SkeletonCard`를 호출(`src/components/ui/skeleton.tsx`).
  - 순수함수 예: `movieToCard`/`tvToCard`가 내부에서 `yearOf`를 호출(`src/app/page.tsx`) — `_utils/`로 승격 시 한 파일 허용.
- 자기 폴더가 없는 루트 라우트라고 이 패턴을 생략하지 않는다 — `_components/` 등을 `layout.tsx`/`error.tsx`와 나란히 라우트 최상위에 둔다.
- 2개 이상 라우트가 공유하는 순수함수/UI/훅/타입/상수를 라우트 폴더 안에 남겨두지 않는다 — 순수함수는 `src/utils/`, UI는 `src/components/ui/`, 순수 브라우저 훅(TanStack Query 도메인 훅 제외)은 `src/hooks/`, 타입은 `src/types/`, 상수는 `src/constants/`로 승격한다. 컴포넌트명이 특정 도메인에 종속적이면 추상화한 이름으로 바꾼다.
- 여러 위치(RootLayout·복수 라우트)가 동일 클라이언트 상태를 React Context로 공유해야 하는 경우 라우트 폴더 안에 두지 않는다 — `src/context/`로 옮긴다(규칙은 `src/context/CLAUDE.md` 참고).
- 컴포넌트 Props/타입 규칙은 `@../../docs/COMPONENT_TYPES.md`를 따른다.

## Gotchas
- 없음.
