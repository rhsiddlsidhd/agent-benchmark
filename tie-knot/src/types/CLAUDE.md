# CLAUDE.md — src/types/

> Last updated: 2026-07-18

## Scope

- **도메인/공용 계약 타입** — 파일당 도메인(또는 공용 계약) 1개(`auth`, `checkout`, `couple`, `error`, `field`, `image`, `alert`, `announcement`). 모델 레이어(`@/models/*.model`)의 타입을 재사용해 조합할 수 있다(`AuthSession`이 `UserRole` import) — 여기 정의된 타입은 API/도메인 계약이고, `models/`는 DB 스키마 계약으로 소유권이 다르다.

## Structure

```
src/types/
├── index.ts             # 배럴(향후 지향점, 아직 없음 — Gotchas 참고)
├── auth.ts             # AuthSession 등 인증 도메인 타입
├── error.ts             # APIResponse/ErrorResponse — 여러 레이어가 공유하는 공용 계약
├── field.ts              # 폼 필드 공용 props 타입(목적명 예외)
└── ...                    # 도메인당 파일 1개
```

## Critical Convention

- 파일명은 kebab-case, 다음 둘 중 하나로 짓는다: **도메인**(비즈니스 개체/영역 기반 이름, 예: `auth`, `couple`) | **목적**(기능/역할 기반 이름, 여러 레이어가 공유하는 공용 계약일 때만 예외적으로 사용, 예: `error`, `field`).
- 개별 파일을 직접 import하지 않는다 — `index.ts` 배럴을 통해서만 import한다(향후 지향점, 현재 미적용 — Gotchas 참고).
- zod 런타임 검증 스키마(`z.object(...)` 등)와 그 파생 타입(`z.infer<typeof xSchema>`)을 이 폴더에 두지 않는다 — 스키마와 파생 타입은 `src/schemas/{도메인}.schema.ts` 안에 같이 있다(`src/schemas/CLAUDE.md` 참고). 이 폴더는 스키마와 무관한 API/도메인 계약 타입 전용이다.

## Gotchas

- `productTableRow.ts` — camelCase로 돼있어 kebab-case 규칙 위반. 리네임 대상: `product-table-row.ts`(코드 리팩토링은 추후 진행 예정).
- `index.ts` 배럴이 아직 없음 — 지금은 전부 개별 파일 직접 import(`@/types/auth` 등), `@/types`(배럴 경로)로 import하는 곳 0곳. 배럴 도입은 향후 지향점이고, 기존 import 전체를 바꾸는 리팩토링은 별도로 진행 예정.
- `couple.ts` 전체가 주석 처리된 죽은 코드다 — zod 스키마 정의 + `z.infer` 파생을 이 폴더 안에서 하려던 시도의 흔적이다. 실제로 채택된 방식은 스키마와 파생 타입을 `schemas/coupleInfo.schema.ts`에 같이 두는 쪽이라, 이 파일의 죽은 코드를 참고해서 되살리지 않는다 — 폐기된 접근이다.

## 관련 문서

- 파일명/식별자 케이스: Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`
- DB 스키마 계약: `src/models/`
- 런타임 검증(zod) 스키마: `src/schemas/CLAUDE.md`
