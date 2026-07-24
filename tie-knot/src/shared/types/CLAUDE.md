# CLAUDE.md — src/shared/types/

> Last updated: 2026-07-18

## Overview

도메인/공용 계약 타입 전담, zod 스키마는 제외.

## Structure

```
src/shared/types/
├── index.ts             # 배럴
├── auth.ts             # AuthSession 등 인증 도메인 타입
├── error.ts             # AppError · 분류 taxonomy · ErrorPayload · 응답 envelope — 여러 레이어 공유 공용 계약
├── field.ts              # 폼 필드 공용 props 타입(목적명 예외)
└── ...                    # 도메인당 파일 1개
```

## Critical Convention

- 파일명은 kebab-case, 다음 둘 중 하나로 짓는다: **도메인**(비즈니스 개체/영역 기반 이름, 예: `auth`, `checkout`) | **목적**(기능/역할 기반 이름, 여러 레이어가 공유하는 공용 계약일 때만 예외적으로 사용, 예: `error`, `field`).
- zod 런타임 검증 스키마(`z.object(...)` 등)와 그 파생 타입(`z.infer<typeof xSchema>`)을 이 폴더에 두지 않는다 — 스키마와 파생 타입은 `src/shared/schemas/{도메인}.schema.ts` 안에 같이 있다(`src/shared/schemas/CLAUDE.md` 참고). 이 폴더는 스키마와 무관한 API/도메인 계약 타입 전용이다.
- `error.ts`는 에러 공용 계약을 담는다: `AppError`(services가 throw하는 앱 고유 분류 에러 — HTTP status 모름), 분류 taxonomy(VALIDATION/UNAUTHENTICATED/… 전체 표는 `src/CLAUDE.md`), `ErrorPayload { 분류, message, fieldErrors? }`(채널 A 리턴·채널 B body가 공유하는 클라이언트-facing 형태), 그리고 응답 envelope 타입. HTTP status를 든 에러 타입(`HTTPError` 등)은 두지 않는다 — status를 에러 타입에 넣으면 services가 HTTP를 알게 되고, HTTP 번역은 route.ts 경계 소관이기 때문이다.

## Gotchas

- 없음.

## 관련 문서

- 식별자 케이스 공통 규칙: `src/CLAUDE.md`
- DB 스키마 계약: `src/server/models/CLAUDE.md`
- 런타임 검증(zod) 스키마: `src/shared/schemas/CLAUDE.md`
- 배럴 import 정책: `src/CLAUDE.md`
