# CLAUDE.md — src/types/

> Last updated: 2026-07-16T00:00:00+09:00

## Scope

- **2개 이상의 라우트가 공유하는 타입/interface만** — `docs/api/{도메인}.md` 계약을 코드로 반영한 단일 소스. zod 스키마는 `src/schemas/CLAUDE.md`, 쿼리 검증 함수는 `services/CLAUDE.md` 소관이라 이 폴더엔 없다. 라우트 하나만 쓰는 타입은 여기 두지 않는다(Critical Convention 참고). `api/*.ts`(서버)와 `src/hooks/*.ts`(클라이언트) 양쪽이 여기서 import한다.

## Structure

```
src/types/
├── {도메인}.ts            # 2개 이상 라우트가 공유하는 응답/에러 타입(interface/type)만
└── {목적}.ts              # schemas/{목적}.ts(공유 서브스키마)의 파생 타입만
```

## Critical Convention

- 파일 최상단에 `// 계약 문서: docs/api/{도메인}.md` 주석으로 원본 계약 문서를 명시하지 않고 타입을 정의하지 않는다. 이유: 계약 문서와 타입 실물 간 추적성을 잃으면 어느 쪽이 최신인지 알 수 없게 됨
- 라우트 하나만 쓰는 타입을 이 폴더에 미리 옮겨두지 않는다 — 그 라우트를 쓰는 파일(`api/{도메인}.ts` 또는 `services/{도메인}.ts`)에 인라인으로 정의한다. 이유: 2번째 소비자가 생기기 전까지는 공유 여부가 확정되지 않은 상태라 미리 중앙화하면 오버엔지니어링 — 실제로 2개 이상 라우트가 같은 타입을 쓰게 될 때만 이 폴더로 승격한다
- zod 스키마, 쿼리 검증 함수, 그 안에서 쓰는 순수 헬퍼(날짜 형식 검사 등)를 이 폴더에 두지 않는다. 이유: 이 폴더는 컴파일 타임 타입만 다루는 경계로 고정 — 런타임 검증 로직이 섞이면 어디까지가 "계약 타입"이고 어디부터가 "검증 로직"인지 구분이 깨짐. 상세 위치: `src/schemas/CLAUDE.md`(zod), `services/CLAUDE.md`(쿼리 검증), `src/utils/CLAUDE.md`(도메인 무관 순수 헬퍼)
- zod 스키마 객체(`export const {Domain}Schema = z.object({...})`)를 이 폴더에서 직접 정의하지 않는다 — `src/schemas/{도메인}.ts`에서 `{Domain}Schema`를 import한 뒤 `export type {Domain} = z.infer<typeof {Domain}Schema>`로 타입만 파생시킨다. 이유: 스키마 원본이 두 곳에 흩어지면 어느 쪽이 진짜 계약인지 알 수 없게 됨 — `schemas/`가 원본, `types/`는 그 파생 타입만 가짐
- `src/schemas/{목적}.ts`(2개 이상 도메인이 공유하는 서브스키마)가 있는데 그 파생 타입을 각 `{도메인}.ts`마다 중복 정의하지 않는다 — `types/{목적}.ts`로 한 번만 파생시켜 공유한다(`{목적}.ts`는 kebab-case·목적명, 도메인명 금지). 이유: `{도메인}.ts` 쪽 규칙과 동일 — 원본은 `schemas/`, `types/`는 파생만

## Gotchas

## 관련 문서

- API 계약 문서: `docs/api/*.md`
- zod 스키마 물리 위치: `src/schemas/CLAUDE.md`
- 쿼리 검증 함수 물리 위치: `services/CLAUDE.md`
- 이 파일을 import하는 쪽: `api/CLAUDE.md`(controller), `src/hooks/CLAUDE.md`(훅)
- 파일명 케이스: `src/CLAUDE.md`
