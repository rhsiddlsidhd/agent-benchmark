# src/constants

> Last updated: 2026-07-15

2개 이상 라우트가 공유하는 상수 — `src/app/CLAUDE.md`의 "2개 이상 라우트가 공유하는 순수함수/UI/훅/타입/상수는 승격" 규칙의 상수 버전. 특정 외부 라이브러리/모듈에 강결합된 상수는 여기 두지 않는다.

## Structure
```
src/constants/
├── index.ts          # 배럴, 모든 상수는 여기서 import
├── {상수명}.ts
└── ...                 # 상수 1개당 파일 1개
```

## Critical Conventions
- 파일명은 kebab-case, export 식별자 케이스는 `src/CLAUDE.md`의 공통 규칙(리터럴 값이면 SCREAMING_SNAKE_CASE, 아니면 camelCase)을 따른다.
- 파일당 export 1개 원칙(`src/app/CLAUDE.md`)을 따른다.
- 개별 파일을 직접 import하지 않는다 — 배럴을 통해서만 import한다(`src/utils`/`src/hooks`/`src/components/ui` 규칙과 동일).
- 단일 라우트에서만 쓰는 상수는 여기 두지 않는다 — 해당 라우트의 `_constants/`에 남긴다(2개 이상 라우트가 실제로 import할 때만 승격).
- 특정 외부 라이브러리/모듈에 강결합된 상수(예: `src/lib/tmdb/images.ts`의 `BLUR_DATA_URL`)는 여기 두지 않는다 — `src/lib/{외부라이브러리}/`가 소유한다.

## Gotchas
- 없음.
