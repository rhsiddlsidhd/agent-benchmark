# CLAUDE.md — src/server/services/

> Last updated: 2026-07-26
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
- DB 쿼리 전에 `dbConnect()`를 호출한다(`src/server/lib/mongodb/index.ts`) — mongoose는 `bufferCommands: false`(이 프로젝트 connect 설정)일 때 연결 전 쿼리를 버퍼링하지 않고 즉시 에러를 던진다(mongoose 공식 문서, connections 가이드).
- **쿼리 결과를 수정 없이 그대로 반환할 거면 `.lean()`을 쓴다** — mongoose 공식 문서: "you should use lean if you're executing a query and sending the results without modifying them"(lean 가이드). 반환값에 Document 인스턴스 메서드(`.save()`, virtual, custom getter)를 추가로 써야 하는 경우에만 `.lean()`을 안 쓴다.
- **update 쿼리(`updateOne`/`findOneAndUpdate`/`findByIdAndUpdate`)는 `runValidators: true`를 명시한다** — mongoose 공식 문서: "Update validators are off by default — you need to specify the `runValidators` option." `save()`와 달리 update류는 기본적으로 스키마 검증을 건너뛴다.
- **id를 받아 `mongoose.Types.ObjectId`로 변환하기 전에 `mongoose.isObjectIdOrHexString()`으로 형식을 먼저 검증한다** — 형식이 안 맞으면(24자리 hex 아님) 애초에 존재할 수 없는 리소스이므로 `AppError("NOT_FOUND", ...)`를 던진다. 검증 없이 바로 `new mongoose.Types.ObjectId(id)`를 호출하면 형식이 틀렸을 때 `AppError`가 아닌 raw 에러가 던져져 "services는 `AppError` 하나로 통일한다" 규칙이 깨진다(`src/CLAUDE.md` 에러 표현 규칙).
- **mongoose 자체 에러(`ValidationError`/`CastError` 등)는 `AppError("INTERNAL", 원본 message)`로 감싸서 다시 throw한다** — services 호출 시점엔 이미 zod 검증을 통과한 데이터이므로, 이 시점에 나는 mongoose 에러는 "사용자가 고칠 수 있는 입력 오류"가 아니라 "서버가 처리 못한 예외"다. raw mongoose 에러를 그대로 던지지 않는다.
- **조회/판별형 함수(없는 게 정상 흐름인 경우, 예: `getUser`/`getAuth`)는 미존재 시 `null`을 리턴한다** — 공식 문서(`node_modules/next/dist/docs/01-app/02-guides/authentication.md` Line 1176-1198, `dal.ts` 예제)가 이 패턴 근거다. 단 `null`은 "레코드 없음"만 뜻한다 — DB 커넥션/타임아웃 같은 인프라 예외까지 try/catch로 삼켜 `null`로 만들지 않고 `AppError(INTERNAL)`로 throw한다(삼키면 DB 장애가 "미로그인/미존재"로 오분류돼 유효 세션 유저가 튕기고 장애도 로그에 안 잡힌다).
- **필수 존재/인가 확인형 함수(없으면 요청 자체가 잘못된 경우, 예: `getUserById`/`getUserEmail`/`requireAuth`)는 구조화된 에러 타입을 throw한다, plain `Error`를 던지지 않는다** — 공식 문서(`node_modules/next/dist/docs/01-app/02-guides/data-security.md` Line 401-421)가 DAL 함수 안에서 `throw new Error(...)`하는 예제 근거다. 두 패턴을 섞어서 "조회형인데 throw" 또는 "확인형인데 null 리턴"으로 짓지 않는다.
- **생성/변경형 함수(DB 쓰기, 예: `createCoupleInfoService`/`createProductService`)에서 Mongoose 저장 에러를 catch해 `false`/`null` 같은 sentinel 값으로 바꿔 리턴하지 않는다** — 호출자가 검증 실패인지 커넥션 실패인지 구분하지 못한다. 원인에 맞는 분류로 구조화된 에러를 만들어 다시 throw한다.

> 실제 에러 타입/분류 체계는 마이그레이션 진행 중이다 — 공용 taxonomy/전체 그림은 `src/CLAUDE.md`의 "에러 핸들링 — 공통 규칙" 참고, 이 문서에 세부를 복붙하지 않는다.

## Gotchas

- `requireAuth()`는 `getAuth()`를 감싸서 세션 없으면 `AppError(UNAUTHENTICATED)`를 throw하는 얇은 헬퍼다 — HTTP status(401)는 여기서 모른다, 각 채널 공용 핸들러가 UNAUTHENTICATED를 자기 형태(route.ts는 401 Response, Server Action은 `ErrorPayload`)로 번역한다. 인증이 필수인 Route Handler·Server Action 둘 다 세션 검증에 이 함수를 공유한다(`src/app/api/CLAUDE.md` Gotchas 참고).

## 관련 문서

- DB 스키마: `src/server/models/CLAUDE.md`
- 외부 연동 wrapper: `src/lib/CLAUDE.md`
- 이 서비스를 호출하는 쪽: `src/app/api/CLAUDE.md`, `src/server/actions/CLAUDE.md`
- 테스트 작성 컨벤션(DB/목킹 전략, assertion 패턴): `docs/TESTING_GUIDELINE.md`
- 레이어 간 에러 흐름 전체 그림, 분류 taxonomy, 레이어별 규칙 위치: `src/CLAUDE.md`(에러 핸들링 — 공통 규칙)
