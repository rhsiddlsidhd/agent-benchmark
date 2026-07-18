# CLAUDE.md — src/components/ui/

> Last updated: 2026-07-16T00:00:00+09:00

## Scope

- **도메인/라우트 비종속 재사용 프리미티브만** — `Button`, `Input`처럼 어느 도메인에서 갖다 써도 깨지지 않는 leaf 컴포넌트. 특정 도메인에서만 쓰이는 컴포넌트는 2번째 도메인이 그 컴포넌트를 재사용하게 되더라도 곧바로 여기로 승격하지 않는다 — props에서 도메인 타입을 걷어내 범용화까지 마친 뒤에만 옮긴다(Critical Convention 참고).

## Structure

```
src/components/ui/
└── {Component}.tsx     # 원시타입/제네릭 props만 받는 leaf 컴포넌트
```

## Critical Convention

- props 타입에 `src/types/*`의 도메인 타입을 쓰지 않는다 — `string`/`number`/`boolean` 같은 원시타입이나 `<T>` 제네릭만 받는다. 이유: 이름을 아무리 범용으로 지어도(`Button.tsx`) props가 `Post` 같은 도메인 타입을 받으면 실질적으로 그 도메인 전용 컴포넌트가 됨 — `ui/`에 두는 존재 이유(도메인 무관 재사용)가 무의미해짐
- `use{Domain}` 훅이나 `services/*`, `api/*`를 직접 호출/import하지 않는다 — 데이터는 항상 props로만 받는다. 이유: fetch 로직이 섞이면 leaf 프리미티브가 아니게 되고, 호출부(Panel)가 아닌 곳에서 fetch 로직이 중복됨

## Gotchas

## 관련 문서

- 상위 3분류 기준: `src/components/CLAUDE.md`
