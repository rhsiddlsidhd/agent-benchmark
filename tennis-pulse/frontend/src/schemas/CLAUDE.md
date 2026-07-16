# CLAUDE.md — frontend/src/schemas/

> Last updated: 2026-07-16T00:00:00+09:00

## Scope

- **zod 런타임 검증 스키마 실물** — `{Domain}Schema` export만 둔다. 컴파일 타임 타입(`z.infer` 파생 타입 포함)은 여기 두지 않는다 — `frontend/src/types/{도메인}.ts`가 여기서 import해 파생시킨다(Critical Convention 참고).

## Structure

```
frontend/src/schemas/
├── {도메인}.ts            # {Domain}Schema = z.object({...}) 등 zod 스키마만
└── {목적}.ts              # 2개 이상 도메인이 공유하는 공통 zod 서브스키마(예: PaginationSchema)
```

## Critical Convention

- 파일명은 kebab-case, 도메인명 그대로 쓴다(예: `posts.ts`) — 대응하는 `frontend/src/types/{도메인}.ts`, `frontend/api/{도메인}.ts`와 동일 도메인명을 써야 한다. 이유: 도메인명이 어긋나면 계약 타입·스키마·라우트 세 파일을 이어서 추적할 수 없음
- export하는 zod 스키마는 `{Domain}Schema` 형태 PascalCase+Schema 접미사로 고정한다. 예: `PostSchema`, `PostDigestSchema`
- 여기서 정의한 스키마의 파생 타입(`z.infer<typeof {Domain}Schema>`)을 이 폴더 안에서 다시 export하지 않는다 — `frontend/src/types/{도메인}.ts`가 이 스키마를 import해서 타입만 파생시킨다. 이유: 컴파일 타임 타입 경계(`types/`)와 런타임 검증 경계(`schemas/`)가 섞이면 어느 쪽이 "계약의 원본"인지 알 수 없게 됨
- 2개 이상 도메인이 공유하게 된 공통 서브스키마(페이지네이션 응답 등)를 도메인 파일에 중복해서 정의하지 않는다 — `schemas/{목적}.ts`로 승격한다(`{목적}.ts`는 kebab-case·목적명, 도메인명 금지 — `frontend/docs/conventions/00_FILE_CONVENTIONS.md` 참고). 2번째 소비자가 생기기 전엔 승격하지 않는다. 이유: `constants/`·`services/`·`hooks/`와 동일 원칙

## Gotchas

## 관련 문서

- 파생 타입 물리 위치: `frontend/src/types/CLAUDE.md`
- 소비하는 쪽(fetch 경계 검증): `frontend/src/hooks/CLAUDE.md`
- 파일명 케이스 기본 원칙: `frontend/docs/conventions/00_FILE_CONVENTIONS.md`
