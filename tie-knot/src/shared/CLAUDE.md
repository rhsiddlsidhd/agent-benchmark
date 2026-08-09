# CLAUDE.md — src/shared/

> Last updated: 2026-07-29

## Overview

server/client 둘 다에서 import 가능한 isomorphic 코드 전담(server/client 전용 코드는 각각 `src/server/CLAUDE.md`/`src/client/CLAUDE.md`). "어떤 형태의 값인가"로 4폴더로 나눈다 — 도메인이 아니라 값의 성격이 분류 기준이다: **리터럴 값**(`constants/`), **side-effect 없는 순수 함수**(`utils/`), **zod 무관 순수 계약 타입**(`types/`), **zod 런타임 검증 + 그 경계 타입**(`schemas/`). 이 4개는 서로 배타적이다 — 값 하나가 두 폴더 기준에 동시에 걸치면(예: zod 스키마에서 뽑은 타입) 아래 Critical Convention의 소유권 규칙으로 하나를 정한다.

## Structure

```
src/shared/
├── constants/   # 리터럴 값(문자열/숫자/불리언 또는 그 배열/lookup map) — src/shared/constants/CLAUDE.md
├── utils/       # side-effect 없는 도메인-무관 순수 함수 — src/shared/utils/CLAUDE.md
├── types/       # zod 무관 도메인/공용 계약 타입 — src/shared/types/CLAUDE.md
└── schemas/     # zod 런타임 검증(입력/응답 양쪽) + 그 파생 타입 — src/shared/schemas/CLAUDE.md
```

## Critical Convention

- **파일명은 kebab-case, 목적명(기능/역할 기반 이름, 도메인명과 대비) 원칙 — `constants/`/`utils/`/`types/` 공통.** `types/`만 예외가 있다: 도메인 기반 이름도 허용하고, 목적명은 "여러 레이어가 공유하는 공용 계약일 때만" 예외적으로 쓴다(`src/shared/types/CLAUDE.md` 참고).
- **파일 하나당 목적/도메인 1개** — 4개 폴더 전부 이 단위로 쪼갠다. 파일 안에 여러 무관한 목적/도메인을 합치지 않는다.
- **zod 검증이 필요한 경계(boundary) 타입은 `schemas/`에 zod로 선언하고 같은 파일 안에서 `z.infer`로 파생 타입까지 정의한다 — `types/`로 분리하지 않는다.** `types/`는 zod로 애초에 고정할 수 없는 것(제네릭 envelope처럼 타입 파라미터가 가변인 것)과 zod 자체가 필요 없는 순수 도메인/공용 계약 타입 전용이다. "스키마가 원본, 타입은 파생물"이라는 소유권을 한 파일 안에 유지하기 위함이다 — 타입을 먼저 손으로 쓰고 zod가 그걸 뒤따라가는 반대 방식은 이미 시도됐다가 폐기됐다(세부 근거는 `src/shared/schemas/CLAUDE.md`/`src/shared/types/CLAUDE.md` 참고).

## Gotchas

- `schemas/`의 실제 파일명(`coupleInfo.schema.ts`/`premiumFeature.schema.ts`/`pwConfirm.schema.ts`/`userEmail.schema.ts`)은 camelCase다 — 위 kebab-case 원칙과 다르다. `constants`/`types`/`utils`엔 지금 다단어 파일명 사례가 없어서 이 원칙이 실제로 충돌 없이 지켜지는지 검증된 적이 없다 — `schemas/`가 의도된 예외인지, 그냥 안 맞춰진 드리프트인지 문서화된 근거가 없다.

## 관련 문서

- server/client/shared 3분할 배경: `docs/ARCHITECTURE.md`
