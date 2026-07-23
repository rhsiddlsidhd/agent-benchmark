# CLAUDE.md — src/server/services/

> Last updated: 2026-07-23
> 폴더 분리(서비스 레이어) 자체는 프로젝트 고유 선택이지만, 내부 에러 처리 패턴은 공식 문서 근거가 있다 — Critical Convention 참고.

## Overview

`services/`는 DB 접근 + 비즈니스 로직을 모아둔다 — `src/server/models/`(스키마)와 `src/lib/`(외부 연동 wrapper)를 조합해 실제 유스케이스를 구현한다(예: `auth.service.ts`의 `getAuth`가 `lib/cookies`+`lib/jose`+`models/user.model`을 조합). 한 파일에 같은 도메인의 여러 관련 함수(조회/생성/로그아웃 등)를 같이 둘 수 있다 — film-wiki식 "파일당 export 1개" 원칙은 여기 적용 안 함.

## Structure

```
src/server/services/
├── index.ts               # 배럴 — export *
├── auth.service.ts        # getUser, getAuth, requireAuth, logoutService
├── user.service.ts
├── product.service.ts
└── ...                       # 도메인당 파일 1개(내부에 관련 함수 여러 개 허용)
```

## Critical Convention

- 파일명은 `{도메인}.service.ts`로 고정한다.
- DB 쿼리 전에 `dbConnect()`를 호출한다(`src/server/lib/mongodb/index.ts`).
- Mongoose Document를 그대로 반환하지 않는다 — `.lean()` 또는 `.toJSON()`으로 변환한 뒤 반환한다(트레이드오프는 `doc.md` 참고).
- **조회/판별형 함수(없는 게 정상 흐름인 경우, 예: `getUser`/`getAuth`)는 `null`을 리턴한다** — 공식 문서(`node_modules/next/dist/docs/01-app/02-guides/authentication.md` Line 1176-1198, `dal.ts` 예제)가 이 패턴 근거다: DB 조회 실패/미존재를 try/catch로 삼키고 `null` 리턴, throw하지 않는다.
- **필수 존재/인가 확인형 함수(없으면 요청 자체가 잘못된 경우, 예: `getUserById`/`getUserEmail`/`requireAuth`)는 `HTTPError`를 throw한다** — 공식 문서(`node_modules/next/dist/docs/01-app/02-guides/data-security.md` Line 401-421)가 DAL 함수 안에서 `throw new Error(...)`하는 예제 근거다. 단 `HTTPError` 클래스 자체와 401/404 같은 status code 매핑은 공식 문서에 없는 프로젝트 고유 확장이다 — 두 패턴을 섞어서 "조회형인데 throw" 또는 "확인형인데 null 리턴"으로 짓지 않는다.
- 확인/인가형 분기에서 plain `Error`(`throw new Error(...)`)를 throw하지 않는다 — `handleClientError`(`src/shared/utils/error.ts`)의 `instanceof HTTPError` 판별을 못 타 정확한 status code 대신 500으로 처리된다. `throw new HTTPError(message, code)`로 통일한다.
- **생성/변경형 함수(DB 쓰기, 예: `createCoupleInfoService`/`createProductService`)에서 Mongoose 저장 에러를 catch해 `false`/`null` 같은 sentinel 값으로 바꿔 리턴하지 않는다** — 호출자가 검증 실패인지 커넥션 실패인지 구분하지 못한다. 원인에 맞는 status code로 `HTTPError`를 만들어 다시 throw한다(예: Mongoose validation error → 400, 그 외 DB 오류 → 500). 상태 코드별 의미는 `docs/ERROR_HANDLING.md` 참고.

## Gotchas

- `doc.md` — 코드 아니라 "`.lean()` vs `.toJSON()` 트레이드오프 가이드" 문서가 이 폴더에 있음. 새 service 함수 작성 전에 이 문서부터 읽는다 — 두 방식이 프로젝트 안에 실제로 혼재하므로(`getPremiumFeatureServiceWithLean` 예시가 문서 안에 있음) 아무거나 복붙하지 않는다.
- `requireAuth()`는 `getAuth()`를 감싸서 세션 없으면 `HTTPError(401)`을 throw하는 얇은 헬퍼다 — 인증이 필수인 Route Handler는 Bearer 헤더를 직접 파싱하지 않고 이 함수를 호출한다(`src/app/api/CLAUDE.md` Gotchas 참고).

## 관련 문서

- DB 스키마: `src/server/models/CLAUDE.md`
- 외부 연동 wrapper: `src/lib/CLAUDE.md`
- 이 서비스를 호출하는 쪽: `src/app/api/CLAUDE.md`, `src/server/actions/CLAUDE.md`
- 테스트 작성 컨벤션(DB/목킹 전략, assertion 패턴): `docs/TESTING_GUIDELINE.md`
- 레이어 간 에러 흐름 전체 그림, 상태 코드 의미 통일표: `docs/ERROR_HANDLING.md`
