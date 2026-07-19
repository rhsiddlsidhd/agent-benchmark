# CLAUDE.md — src/types/

> Last updated: 2026-07-18

## Scope

- **도메인/공용 계약 타입** — 파일당 도메인(또는 공용 계약) 1개(`auth`, `checkout`, `error`, `field`, `image`, `alert`, `announcement`, `product-table-row`). 모델 레이어(`@/models/*.model`)의 타입을 재사용해 조합할 수 있다(`AuthSession`이 `UserRole` import) — 여기 정의된 타입은 API/도메인 계약이고, `models/`는 DB 스키마 계약으로 소유권이 다르다.

## Structure

```
src/types/
├── index.ts             # 배럴
├── auth.ts             # AuthSession 등 인증 도메인 타입
├── error.ts             # APIResponse/ErrorResponse — 여러 레이어가 공유하는 공용 계약
├── field.ts              # 폼 필드 공용 props 타입(목적명 예외)
└── ...                    # 도메인당 파일 1개
```

## Critical Convention

- 파일명은 kebab-case, 다음 둘 중 하나로 짓는다: **도메인**(비즈니스 개체/영역 기반 이름, 예: `auth`, `checkout`) | **목적**(기능/역할 기반 이름, 여러 레이어가 공유하는 공용 계약일 때만 예외적으로 사용, 예: `error`, `field`).
- zod 런타임 검증 스키마(`z.object(...)` 등)와 그 파생 타입(`z.infer<typeof xSchema>`)을 이 폴더에 두지 않는다 — 스키마와 파생 타입은 `src/schemas/{도메인}.schema.ts` 안에 같이 있다(`src/schemas/CLAUDE.md` 참고). 이 폴더는 스키마와 무관한 API/도메인 계약 타입 전용이다.

## Gotchas

- `couple.ts`는 삭제됐다 — 전체가 주석 처리된 죽은 코드였다(zod 스키마+`z.infer` 파생을 이 폴더 안에서 하려던 폐기된 시도, `Subway.tsx`와 동일 사유).

## 관련 문서

- 파일명/식별자 케이스: Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`
- DB 스키마 계약: `src/models/CLAUDE.md`
- 런타임 검증(zod) 스키마: `src/schemas/CLAUDE.md`
- 배럴 import 정책: `src/CLAUDE.md`
