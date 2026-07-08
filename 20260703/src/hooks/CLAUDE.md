# src/hooks

> Last updated: 2026-07-08

2개 이상 라우트/컴포넌트 트리가 공유하는 순수 클라이언트 커스텀 훅 — `src/app/CLAUDE.md`의 "2개 이상 라우트가 공유하는 순수함수/UI는 승격" 규칙의 훅 버전이다.

## Structure
```
src/hooks/
├── index.ts                    # 배럴, 모든 훅은 여기서 import
├── useIntersectionObserver.ts
└── ...                          # 훅 1개당 파일 1개
```

## Critical Conventions
- 파일명/export 식별자 케이스에 `AGENTS.md`의 "네이밍 컨벤션" 섹션(camelCase, `use` 접두사) 외의 형식을 쓰지 않는다.
- 단일 라우트에서만 쓰는 훅은 여기 두지 않는다 — 해당 라우트의 `_hooks/`에 남긴다(2개 이상 라우트가 실제로 import할 때만 승격).
- 특정 Route Handler에 1:1로 묶인 TanStack Query 훅(`useSearchInfinite`, `useDiscoverInfinite` 등)은 여기 두지 않는다 — 그 라우트의 `_hooks/`가 소유한다. 이 폴더는 API 호출을 하지 않는 순수 브라우저 로직(옵저버·이벤트·타이머 등) 전용이다.
- 개별 파일을 직접 import하지 않는다 — 배럴을 통해서만 import한다(`src/components/ui` 규칙과 동일).

## Gotchas
- 없음.
