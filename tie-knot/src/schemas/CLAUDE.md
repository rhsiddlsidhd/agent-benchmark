# CLAUDE.md — src/schemas/

> Last updated: 2026-07-22
> 이 폴더는 프로젝트 고유 선택 — 런타임 검증(zod) 레이어.

## Overview

`schemas/`는 zod 기반 런타임 검증 스키마를 모아둔다 — 폼/API 입력값 검증에 쓰며, 여러 스키마가 서로 조합(import)될 수 있다(`login.schema.ts`가 `pw.schema.ts`의 `PWSchema`를 재사용).

## Structure

```
src/schemas/
├── index.ts               # 배럴 — `export *` + config.ts side-effect import(Gotchas 참고)
├── config.ts               # zod 전역 설정(z.config(z.locales.ko())), 배럴 안에서만 import됨
├── login.schema.ts          # 다른 스키마(PWSchema) 조합
├── pw.schema.ts
└── ...                        # 도메인당 파일 1개
```

## Critical Convention

- 파일명은 `{도메인}.schema.ts`로 고정한다.
- 공통으로 재사용되는 하위 스키마(예: `PWSchema`)는 그 스키마 전용 파일로 분리하고, 상위 스키마에서 import해 조합한다 — 같은 필드를 여러 파일에 중복 정의하지 않는다.
- 스키마에서 파생되는 TypeScript 타입(`z.infer<typeof xSchema>`)은 **같은 파일 안에서** 정의해 export한다(예: `product.schema.ts`의 `productSchema` 옆에 `export type ProductDto = z.infer<typeof productSchema>`) — `src/types/`로 옮기지 않는다. 스키마가 원본이고 타입은 그 파생물이라는 소유권을 한 파일 안에서 명확히 유지하기 위함(`src/types/CLAUDE.md` Gotchas 참고 — 반대 방식은 이미 시도됐다가 폐기됨).
- 스키마 소비처는 개별 파일 경로(`@/schemas/x.schema`)가 아니라 배럴(`@/schemas`)로 import한다(`src/CLAUDE.md` 배럴 정책 참고).

## Gotchas

- `config.ts`(zod 에러 메시지 한국어화, `z.config(z.locales.ko())`)는 이 폴더 어떤 스키마 파일도 직접 import하지 않는다 — `index.ts` 배럴 맨 위의 `import "./config"` side-effect로만 실행된다. 개별 파일 경로(`@/schemas/x.schema`)로 직접 import하면 이 side-effect를 안 타서 로케일 설정이 적용 안 된다 — 반드시 배럴(`@/schemas`) 경유로 import해야 하는 이유.
- `app/api/order/create/route.ts`는 이 폴더를 아예 안 쓰고 자체 인라인 zod 스키마를 정의한다 — 이 폴더의 컨벤션 대상이 아니다(별개 이슈).

## 관련 문서

- 이 스키마를 쓰는 폼 훅: `src/hooks/CLAUDE.md`
- 이 폴더와 `src/types/`의 소유권 경계: `src/types/CLAUDE.md`
- 배럴 import 정책(공통): `src/CLAUDE.md`
