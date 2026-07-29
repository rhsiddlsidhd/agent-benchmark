# CLAUDE.md — src/client/store/

> Last updated: 2026-07-29
> 이 폴더는 프로젝트 고유 선택 — 전역 클라이언트 상태(Zustand) 레이어.
> **목표 설계, 마이그레이션 진행 전** — 아래 Critical Convention은 공식 가이드 기준 목표 아키텍처다. 현재 코드는 아직 이 형태가 아니다(Gotchas 참고). 문서를 먼저 확정하고 이 문서 기준으로 코드를 리팩토링한다.

## Overview

Zustand(`node_modules/zustand`, v5) 기반 앱 전체 범위 클라이언트 상태 레이어. 목표 아키텍처는 **결합된 store 하나**(slices 패턴, 공식 가이드 `flux-inspired-practice.md` "Single store")를 **요청/마운트당 인스턴스화**(`zustand/vanilla` `createStore` + Context, 공식 가이드 `nextjs.md` "No global stores")하는 형태다. 특정 UI 트리에만 한정된 상태는 여기가 아니라 `src/client/context/`(`src/client/context/CLAUDE.md` 참고).

## Structure (목표)

```
src/client/store/
├── index.ts                    # 배럴 — export *
├── app.store.ts                 # createAppStore — 아래 슬라이스 전부 spread해 결합, persist는 여기 한 곳에서만(order 슬라이스만 partialize)
├── provider.tsx                 # "use client" — useState(() => createAppStore())로 요청/마운트당 1개 생성, Context.Provider
├── use-app-store.ts             # useContext + useStore(store, selector) — 소비 훅, 기존 useXStore(selector) 시그니처 유지
├── order.slice.ts               # createOrderSlice — 도메인 데이터 상태
├── admin-modal.slice.ts         # createAdminModalSlice — 모달 UI 상태(필드 접두사로 충돌 회피, 아래 Critical Convention)
└── guestbook-modal.slice.ts     # createGuestbookModalSlice — 모달 UI 상태(동일)
```

## Critical Convention

- **단일 결합 store(slices 패턴)** — 공식 가이드(`flux-inspired-practice.md`): "Your applications global state should be located in a single Zustand store." 도메인별 `createXSlice(set, get) => ({...})` 함수로 쪼개고, `app.store.ts`에서 `create<AppStore>()((...a) => ({ ...createOrderSlice(...a), ...createAdminModalSlice(...a), ... }))`로 결합한다(공식 가이드 `slices-pattern.md`). 미들웨어(`persist` 등)는 슬라이스 각각이 아니라 **결합 지점에만** 적용한다 — 공식 가이드: "you should only apply middlewares in the combined store. Applying them inside individual slices can lead to unexpected issues."
- **필드명이 슬라이스 간 충돌하면 접두사로 구분한다** — 예: `admin-modal.slice.ts`/`guestbook-modal.slice.ts` 둘 다 `isOpen`/`type`을 쓰면 결합 시 서로 덮어쓴다, `adminModalIsOpen`/`guestbookModalIsOpen`처럼 슬라이스별 접두사를 붙인다.
- **`create()` 대신 `zustand/vanilla`의 `createStore` + React Context로 store를 요청/마운트당 인스턴스화한다** — 공식 가이드(`nextjs.md`): "No global stores - Because the store should not be shared across requests, it should not be defined as a global variable." `createAppStore()` 팩토리 함수 + `"use client"` Provider(`useState(() => createAppStore())`로 최초 1회만 생성) + 소비 훅(`useContext`+`useStore(store, selector)`) 3단 구성을 쓴다.
- **React Server Component/Server Action은 이 store를 읽거나 쓰지 않는다** — 공식 가이드(`nextjs.md`): "React Server Components should not read from or write to the store." RSC는 hook/context를 못 쓰므로 애초에 구조적으로 강제된다.
- **TypeScript는 항상 curried `create<State>()(...)`(슬라이스는 `StateCreator`) 형태로 쓴다** — 공식 문서(`README.md` TypeScript Usage): "Basic typescript usage doesn't require anything special except for writing `create<State>()(...)` instead of `create(...)`." 미들웨어를 나중에 추가해도 타입이 깨지지 않는 유일한 형태다.
- **컴포넌트에서 store를 구독할 땐 항상 selector를 쓴다** — `useAppStore((state) => state.field)`. selector 없이 전체 상태를 꺼내면 그 컴포넌트가 store의 모든 변경에 리렌더된다(공식 문서 "Fetching everything" 경고: "it will cause the component to update on every state change").
- **여러 필드를 객체/배열로 한 번에 select할 땐 `useShallow`(`zustand/react/shallow`)로 감싼다** — v5부터 selector 결과의 얕은 비교가 자동이 아니다, 감싸지 않으면 매 렌더마다 새 객체/배열이 만들어져 selector가 매번 다른 값으로 보여 리렌더가 안 걸러진다(공식 문서 "Selecting multiple state slices" 참고).
- 액션 안에서 현재 상태를 읽어야 하면 클로저 대신 `get()`을 쓴다 — `(set, get) => ({ ... })`(공식 문서 "Read from state in actions"). `set`은 기본적으로 얕은 merge라 일부 필드만 갱신할 땐 나머지를 직접 스프레드할 필요 없다 — 전체 교체가 필요할 때만 `set(newState, true)`(두 번째 인자)를 쓴다, 이때 다른 슬라이스 필드까지 날아갈 수 있으니 결합 store에선 특히 주의(공식 문서 "Overwriting state").
- 전부 named export로 통일한다 — `src/CLAUDE.md`의 `src/` 전체 default export 금지 규칙 참고.

## Gotchas

- **지금 코드는 위 목표 아키텍처로 아직 마이그레이션되지 않았다** — `order.store.ts`/`admin.modal.store.ts`/`guestbook.modal.store.ts` 3개가 각자 전역 `create()`(slices 아님, Context 아님)로 분리돼있다. 실제 위험은 낮다 — 셋 다 Client Component 전용으로만 쓰이고(RSC/Server Action에서 import 없음, grep 확인됨) 초기값도 고정값(`isOpen: false` 등)이라 요청 간 상태 누수 시나리오가 실질적으로 없다. 그래도 공식 권장과는 다른 상태이니 다음 리팩토링 대상.
- 결합 store 하나로 합치면 Provider를 **어디까지 감싸야 하는지**가 새로운 문제가 된다 — `admin-modal` 슬라이스는 `/admin` 라우트에서만, `guestbook-modal`은 `/preview`에서만, `order`는 `/checkout`·`/my-orders`·`/products`에서만 쓰인다. 세 도메인이 라우트를 공유하지 않으므로 Provider를 root layout까지 올려야 전부 커버되는데, 그러면 그 도메인을 안 쓰는 페이지도 슬라이스 인스턴스 생성 비용을 진다(가벼운 비용이지만 트레이드오프는 있다).
- `order.store.ts`만 zustand `persist` 미들웨어(sessionStorage)를 씀 — 새로고침에도 유지돼야 하는 상태(주문 진행 중 데이터)라 그런 것으로 보인다. 결합 store로 합친 뒤엔 `persist`의 `partialize`로 `order` 슬라이스만 골라 저장해야 한다(위 Critical Convention).
- 지금 `admin.modal.store.ts`/`guestbook.modal.store.ts`는 curried `create<State>()(...)` 형태가 아니다(`order.store.ts`만 미들웨어 때문에 curried) — 이것도 리팩토링 대상.

## 관련 문서

- 특정 UI 트리 한정 상태와의 경계: `src/client/context/CLAUDE.md`
