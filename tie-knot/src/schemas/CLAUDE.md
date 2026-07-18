# CLAUDE.md — src/schemas/

> Last updated: 2026-07-18
> 이 폴더는 Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md` 소관 밖(프로젝트 고유 선택) — 런타임 검증(zod) 레이어.

## Scope

- **zod 기반 런타임 검증 스키마.** 폼/API 입력값 검증에 쓰며, 여러 스키마가 서로 조합(import)될 수 있다(`login.schema.ts`가 `pw.schema.ts`의 `PWSchema`를 재사용).

## Structure

```
src/schemas/
├── index.ts               # 배럴 아님 — zod 전역 설정(Gotchas 참고)
├── login.schema.ts          # 다른 스키마(PWSchema) 조합
├── pw.schema.ts
├── register.schema.ts
├── product.schema.ts
└── ...                        # 도메인당 파일 1개
```

## Critical Convention

- 파일명은 `{도메인}.schema.ts`로 고정한다.
- 공통으로 재사용되는 하위 스키마(예: `PWSchema`)는 그 스키마 전용 파일로 분리하고, 상위 스키마에서 import해 조합한다 — 같은 필드를 여러 파일에 중복 정의하지 않는다.
- 스키마에서 파생되는 TypeScript 타입(`z.infer<typeof xSchema>`)은 **같은 파일 안에서** 정의해 export한다(예: `product.schema.ts`의 `productSchema` 옆에 `export type ProductDto = z.infer<typeof productSchema>`) — `src/types/`로 옮기지 않는다. 스키마가 원본이고 타입은 그 파생물이라는 소유권을 한 파일 안에서 명확히 유지하기 위함(`src/types/CLAUDE.md` Gotchas 참고 — 반대 방식은 이미 시도됐다가 폐기됨).

## Gotchas

- `index.ts`가 다른 폴더(`lib/token`, `lib/email`)의 `index.ts`와 다르게 **배럴이 아니다** — `z.config(z.locales.ko())`로 zod 에러 메시지를 한국어로 바꾸는 전역 side-effect 설정 파일이다. 이 파일이 실제로 import되는 지점(앱 진입점 등)을 확인하지 않고 "당연히 배럴이겠거니" 하고 개별 스키마를 여기서 재정의/재export 하지 않는다.

## 관련 문서

- 이 스키마를 쓰는 폼 훅: `src/hooks/CLAUDE.md`
- 이 폴더와 `src/types/`의 소유권 경계: `src/types/CLAUDE.md`
