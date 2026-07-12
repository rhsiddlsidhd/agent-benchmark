# src/context

> Last updated: 2026-07-08

React 내장 Context API로 관리하는 전역 클라이언트 상태 — 서로 다른 위치(RootLayout·복수 라우트)가 동일 상태를 구독해야 할 때만 여기 둔다. 외부 상태관리 라이브러리가 아니라 React 내장 API이므로 `src/lib/{외부라이브러리}/`가 아닌 별도 폴더로 분리한다.

## Structure
```
src/context/
├── {도메인}Context.tsx   # Provider + 접근 훅 co-locate
└── ...                    # Context 1개당 파일 1개
```

## Critical Conventions
- 파일명에 `{도메인}Context.tsx`(PascalCase, `Context` 접미사) 외의 형식을 쓰지 않는다 — Provider 컴포넌트가 주 export이므로 컴포넌트 파일명 규칙을 따른다.
- Provider 컴포넌트와 접근 훅(`use-` 접두사)을 별도 파일로 쪼개지 않는다 — `src/app/CLAUDE.md`의 "파일당 export 1개" 원칙의 명시적 예외다. `createContext` 결과 객체 자체는 export하지 않는다 — 접근 훅을 거치지 않은 직접 구독을 막기 위함이다.
- Provider 밖에서 접근 훅을 호출했을 때 기본값으로 조용히 넘어가지 않는다 — 즉시 에러를 던져 배선 누락을 개발 중 드러낸다.
- 단일 라우트 지역 상태(`useState`로 충분)나 단일 컴포넌트 트리 내부 공유(prop으로 충분)까지 Context로 만들지 않는다 — 여러 위치의 실제 공유가 필요할 때만 만든다.
- TanStack Query가 다루는 서버 상태(fetch 결과 캐시)는 여기 두지 않는다 — Context는 순수 클라이언트 UI 상태 전용이다.

## Gotchas
- Provider를 `src/app/layout.tsx`(RootLayout) 밖에서 조립하지 않는다 — Provider 자체는 라우팅/배치 판단을 하지 않는다.
- 값이 URL과 동기화되는 경우 공유 컴포넌트에서 `useSearchParams`를 쓰지 않는다 — 앱 전체가 CSR bailout(Suspense 요구)돼 정적 페이지가 깨진다. `history.replaceState` 기반 얕은 갱신을 쓴다.
