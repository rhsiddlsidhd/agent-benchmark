# CLAUDE.md — frontend/src/components/layouts/

> Last updated: 2026-07-16T00:00:00+09:00

## Scope

- **페이지 구조 골격** — `Header`, `Footer`처럼 화면 전체를 감싸는 도메인/라우트 비종속 컴포넌트. 콘텐츠 자체가 아니라 콘텐츠를 감싸는 틀만 담당한다.

## Structure

```
frontend/src/components/layouts/
└── {Layout}.tsx     # children을 받아 감싸는 구조 컴포넌트
```

## Critical Convention

- props 타입에 `frontend/src/types/*`의 도메인 타입을 쓰지 않는다 — `ui/`와 동일 이유(`frontend/src/components/ui/CLAUDE.md` 참고), 골격도 도메인에 종속되면 재사용 불가능해짐
- props 타입에 `children?: React.ReactNode`(optional)를 포함하지 않는 레이아웃 컴포넌트를 만들지 않는다 — 지금 당장 고정 콘텐츠만 렌더링해도 무방하다. 이유: children을 타입에서 아예 빼면, 나중에 합성이 필요해졌을 때 이 컴포넌트를 쓰는 모든 곳의 prop 시그니처를 같이 고쳐야 함
- `use{Domain}` 훅이나 `frontend/services/*`, `frontend/api/*`를 직접 호출/import하지 않는다 — 이유: `frontend/src/components/ui/CLAUDE.md`와 동일, 골격에 fetch 로직이 섞이면 안 됨

## Gotchas

## 관련 문서

- 상위 3분류 기준: `frontend/src/components/CLAUDE.md`
- 파일명 케이스: `frontend/docs/conventions/00_FILE_CONVENTIONS.md`
