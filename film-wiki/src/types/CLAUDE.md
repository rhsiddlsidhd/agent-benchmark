# src/types

> Last updated: 2026-07-15

2개 이상 라우트가 공유하는 타입/인터페이스 — `src/app/CLAUDE.md`의 "2개 이상 라우트가 공유하는 순수함수/UI/훅/타입/상수는 승격" 규칙의 타입 버전. Route Handler 요청/응답 계약 타입은 여기 두지 않는다.

## Structure
```
src/types/
├── index.ts          # 배럴, 모든 타입은 여기서 import
├── {타입명}.ts
└── ...                 # 타입 1개당 파일 1개
```

## Critical Conventions
- 파일명/export 식별자 케이스는 `CLAUDE.md`의 "네이밍 컨벤션" 섹션(PascalCase)을 따른다.
- 파일당 export 1개 원칙(`src/app/CLAUDE.md`)을 따른다.
- 개별 파일을 직접 import하지 않는다 — 배럴을 통해서만 import한다(`src/utils`/`src/hooks`/`src/components/ui` 규칙과 동일).
- 단일 라우트에서만 쓰는 타입은 여기 두지 않는다 — 해당 라우트의 `_types/`에 남긴다(2개 이상 라우트가 실제로 import할 때만 승격).
- Route Handler(`route.ts`)의 요청/응답 계약 타입은 여기 두지 않는다 — `src/app/api/{route}/_types/`가 소유한다(`src/app/api/CLAUDE.md` 참고). 계약을 쓰는 페이지 라우트 훅은 그 `_types/`를 직접 import한다.
- 특정 외부 라이브러리/API에 강결합된 타입(예: `src/lib/tmdb/types/Movie.ts`의 TMDB 응답 타입)은 여기 두지 않는다 — `src/lib/{외부라이브러리}/types/`가 소유한다(`src/lib/CLAUDE.md` 참고). 여러 라우트가 그 타입을 공유해도 승격 대상 아니다 — 공유 여부가 아니라 결합 대상이 소유권 기준.

## Gotchas
- 없음.
