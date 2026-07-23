# CLAUDE.md — src/schemas/

> Last updated: 2026-07-22
> 이 폴더는 프로젝트 고유 선택 — 런타임 검증(zod) 레이어.

## Overview

`schemas/`는 zod 기반 런타임 검증 스키마를 모아둔다 — 폼/API **입력값** 검증과, Route Handler가 돌려주는 **응답** 양쪽 다 다룬다. 여러 스키마가 서로 조합(import)될 수 있다(`login.schema.ts`가 `pw.schema.ts`의 `PWSchema`를 재사용).

**API 요청/응답처럼 실제 데이터가 오가는 경계(boundary) 타입은 예외 없이 이 폴더에 zod로 선언하고 `z.infer`로 타입을 뽑는다.** 손으로 쓴 interface를 경계 타입으로 재사용하지 않는다 — `src/types/`는 그 경계와 무관한 타입(제네릭 envelope처럼 T가 가변이라 애초에 zod로 고정할 수 없는 것) 전용이다(`src/types/CLAUDE.md` 참고). DB 레이어 타입(`src/models/`의 `ICoupleInfo` 등)은 이 규칙 대상이 아니다 — Date/ObjectId를 쓰는 DB 표현과 문자열로 직렬화되는 응답 표현은 실질적으로 다른 타입이라, 응답 경계에서 별도 zod 스키마로 다시 정의한다(같은 인터페이스를 두 레이어에 겸용하면 직렬화 시점에 타입이 실제로 어긋나도 컴파일러가 못 잡는다 — `src/app/api/banks/route.ts`가 겪은 문제).

## Structure

두 축(입력/응답)을 물리적 폴더로 분리한다 — 파일명 접미사가 아니라 폴더가 구분자다.

```
src/schemas/
├── index.ts               # 배럴 — `export *` + config.ts side-effect import(Gotchas 참고)
├── config.ts               # zod 전역 설정(z.config(z.locales.ko())), 배럴 안에서만 import됨
├── request/                 # 폼/API 입력값 검증 — 도메인당 파일 1개
│   ├── login.schema.ts       # 다른 스키마(pw.schema.ts의 PWSchema) 조합
│   ├── pw.schema.ts           # 공용 하위 조각(단독 엔드포인트 계약 아님)
│   └── ...
└── response/                 # Route Handler 응답 — 도메인당 파일 1개, 폴더가 이미 "응답"을 뜻하므로 파일명에 `.response` 접미사 안 붙임
    ├── coupleInfo.schema.ts
    └── ...
```

## Critical Convention

- 입력 스키마는 `request/{도메인}.schema.ts`, 응답 스키마는 `response/{도메인}.schema.ts`에 둔다 — 같은 도메인이어도 입력값과 응답값은 필드 구성이 다른 별개 계약이라 한 파일에 섞지 않는다(예: 응답엔 `_id`/`createdAt`/서버 계산 필드가 있지만 입력엔 없음). 두 폴더 간 import는 없다 — 응답 스키마가 입력 스키마를 조합해서 쓰거나 그 반대인 경우는 없어야 한다(방향이 다른 별개 계약이라서).
- 공통으로 재사용되는 하위 스키마(예: `request/pw.schema.ts`의 `PWSchema`)는 그 스키마 전용 파일로 분리하고, 같은 폴더 안 상위 스키마에서 import해 조합한다 — 같은 필드를 여러 파일에 중복 정의하지 않는다.
- 스키마에서 파생되는 TypeScript 타입(`z.infer<typeof xSchema>`)은 **같은 파일 안에서** 정의해 export한다(예: `request/product.schema.ts`의 `productSchema` 옆에 `export type ProductDto = z.infer<typeof productSchema>`) — `src/types/`로 옮기지 않는다. 스키마가 원본이고 타입은 그 파생물이라는 소유권을 한 파일 안에서 명확히 유지하기 위함(`src/types/CLAUDE.md` Gotchas 참고 — 반대 방식은 이미 시도됐다가 폐기됨). 다른 파일이 그 타입을 참조할 일이 없으면(예: `validateAndFlatten(schema, data)` 한 곳에서만 쓰이고 끝나는 액션 입력) 굳이 이름 붙여 export하지 않아도 된다 — 파일 경계를 넘어 재사용될 때만 이름이 필요하다.
- 스키마 소비처는 개별 파일 경로(`@/schemas/x.schema`)가 아니라 배럴(`@/schemas`)로 import한다(`src/CLAUDE.md` 배럴 정책 참고).

## Gotchas

- `config.ts`(zod 에러 메시지 한국어화, `z.config(z.locales.ko())`)는 이 폴더 어떤 스키마 파일도 직접 import하지 않는다 — `index.ts` 배럴 맨 위의 `import "./config"` side-effect로만 실행된다. 개별 파일 경로(`@/schemas/x.schema`)로 직접 import하면 이 side-effect를 안 타서 로케일 설정이 적용 안 된다 — 반드시 배럴(`@/schemas`) 경유로 import해야 하는 이유.
- `app/api/order/create/route.ts`는 이 폴더를 아예 안 쓰고 자체 인라인 zod 스키마를 정의한다 — 이 폴더의 컨벤션 대상이 아니다(별개 이슈).

## 관련 문서

- 이 스키마를 쓰는 폼 훅: `src/hooks/CLAUDE.md`
- 이 폴더와 `src/types/`의 소유권 경계: `src/types/CLAUDE.md`
- 배럴 import 정책(공통): `src/CLAUDE.md`
