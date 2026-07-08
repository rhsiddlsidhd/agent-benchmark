# src/components

> Last updated: 2026-07-08

공용 UI(`ui/`) — 특정 라우트에 종속되지 않는 재사용 프리미티브만 둔다. 도메인 로직·탐색(라우팅) 판단은 여기서 하지 않고 호출부 책임으로 남긴다.

## Structure
```
src/components/ui/
├── index.ts              # 배럴, 모든 컴포넌트는 여기서 import
├── ContentCard.tsx
├── PosterImage.tsx
└── ...                   # 컴포넌트 1개당 파일 1개
```

## Critical Conventions
- 파일명/export 식별자 케이스는 `AGENTS.md`의 "네이밍 컨벤션" 섹션을 따른다.
  - `ui/{컴포넌트명}.tsx` — 파일명은 export 컴포넌트명과 동일하게 쓴다(`ContentCard.tsx` → `export function ContentCard`).
  - 컴포넌트명에 특정 엔티티/리소스명을 쓰지 않는다 — 형태·역할 명사로 짓는다(`Content`/`Person`처럼 여러 엔티티를 통칭하는 상위어는 허용). `_components/`→`ui/` 승격 시 이름에 엔티티명이 남아있으면 이 규칙대로 바꾼다(`src/app/CLAUDE.md` 승격 규칙과 짝).
- 개별 파일 직접 import 하지 않는다 - `ui/` 컴포넌트는 배럴을 통해서만 import 
- 컴포넌트 Props/타입 규칙은 `@../../docs/COMPONENT_TYPES.md`를 따른다.

## Gotchas
- `ErrorState`(fetch 실패)와 `not-found.tsx`(리소스 없음)는 혼용 금지.
- `<Link>`로 감쌀지 판단은 프리미티브가 하지 않는다 — `PersonAvatar` 등은 마크업만 제공하고 탐색 흐름 책임은 호출부에 있다.

