# src/utils

> Last updated: 2026-07-08

2개 이상 라우트가 공유하는 순수함수 — `src/app/CLAUDE.md`의 "2개 이상 라우트가 공유하는 순수함수/UI/훅은 승격" 규칙의 함수 버전. React/DOM/TMDB fetch에 의존하지 않는 입력→출력 순수 로직만 둔다.

## Structure
```
src/utils/
├── index.ts          # 배럴, 모든 함수는 여기서 import
├── yearOf.ts
├── formatRuntime.ts
└── ...                 # 함수 1개당 파일 1개
```

## Critical Conventions
- 파일명/export 식별자 케이스는 `CLAUDE.md`의 "네이밍 컨벤션" 섹션(camelCase)을 따른다.
- 파일당 export 1개 원칙(`src/app/CLAUDE.md`)을 따른다 — 하위 export가 주 export 함수 body 안에서 직접 호출될 때만 한 파일 허용.
- 개별 파일을 직접 import하지 않는다 — 배럴을 통해서만 import한다(`src/hooks`/`src/components/ui` 규칙과 동일).
- 단일 라우트에서만 쓰는 순수함수는 여기 두지 않는다 — 해당 라우트의 `_utils/`에 남긴다(2개 이상 라우트가 실제로 import할 때만 승격).
- React 훅(`use` 접두사) 성격의 로직은 여기 두지 않는다 — `src/hooks/`가 소유한다.
- TMDB fetch 등 외부 I/O가 섞인 로직은 여기 두지 않는다 — `src/lib/`가 소유한다.

## Gotchas
- 없음.
