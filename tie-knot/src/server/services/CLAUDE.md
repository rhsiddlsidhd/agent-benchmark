# CLAUDE.md — src/server/services/

> Last updated: 2026-07-28
> 폴더 분리(서비스 레이어) 자체는 프로젝트 고유 선택이지만, 내부 에러 처리 패턴/트랜잭션 패턴은 공식 문서 근거가 있다 — Critical Convention·트랜잭션 섹션 참고.

## Overview

`services/`는 DB 접근 + 비즈니스 로직을 모아둔다 — `src/server/models/`(스키마)와 `src/server/lib/`(외부 연동 wrapper)를 조합해 실제 유스케이스를 구현한다(예: `auth.service.ts`의 `getAuth`가 `lib/cookies`+`lib/jose`+`models/user.model`을 조합). 한 파일에 같은 도메인의 여러 관련 함수(조회/생성/로그아웃 등)를 같이 둘 수 있다.

## Structure

```
src/server/services/
├── index.ts               # 배럴 — export *
├── auth.service.ts        # getUser, getAuth, requireAuth, logoutService, verifySession
├── user.service.ts
├── product.service.ts
└── ...                       # 도메인당 파일 1개(내부에 관련 함수 여러 개 허용)
```

## Critical Convention

- 파일명은 `{도메인}.service.ts`로 고정한다.
- DB 쿼리 전에 `dbConnect()`를 호출한다(`src/server/lib/mongodb/index.ts`) — mongoose는 `bufferCommands: false`(이 프로젝트 connect 설정)일 때 연결 전 쿼리를 버퍼링하지 않고 즉시 에러를 던진다(mongoose 공식 문서, connections 가이드).
- **쿼리 결과를 수정 없이 그대로 반환할 거면 `.lean()`을 쓴다** — mongoose 공식 문서: "you should use lean if you're executing a query and sending the results without modifying them"(lean 가이드). 반환값에 Document 인스턴스 메서드(`.save()`, virtual, custom getter)를 추가로 써야 하는 경우에만 `.lean()`을 안 쓴다.
- `.lean()` 결과의 ObjectId 필드는 services에서 명시적으로 `.toString()` 변환한다 — 모델 `toJSON` transform에 기대지 않는다(`src/server/models/CLAUDE.md` 참고).
- **update 쿼리(`updateOne`/`findOneAndUpdate`/`findByIdAndUpdate`)는 `runValidators: true`를 명시한다** — mongoose 공식 문서: "Update validators are off by default — you need to specify the `runValidators` option." `save()`와 달리 update류는 기본적으로 스키마 검증을 건너뛴다.
- **id를 받아 `mongoose.Types.ObjectId`로 변환하기 전에 `mongoose.isObjectIdOrHexString()`으로 형식을 먼저 검증한다** — 형식이 안 맞으면(24자리 hex 아님) 애초에 존재할 수 없는 리소스이므로 `AppError("NOT_FOUND", ...)`를 던진다. 검증 없이 바로 `new mongoose.Types.ObjectId(id)`를 호출하면 형식이 틀렸을 때 `AppError`가 아닌 raw 에러가 던져져 "services는 `AppError` 하나로 통일한다" 규칙이 깨진다(`docs/ERROR_HANDLING.md` 에러 표현 규칙).
- **mongoose 자체 에러(`ValidationError`/`CastError` 등)는 `AppError("INTERNAL", 원본 message)`로 감싸서 다시 throw한다** — services 호출 시점엔 이미 zod 검증을 통과한 데이터이므로, 이 시점에 나는 mongoose 에러는 "사용자가 고칠 수 있는 입력 오류"가 아니라 "서버가 처리 못한 예외"다. raw mongoose 에러를 그대로 던지지 않는다.
- **조회/판별형 함수(없는 게 정상 흐름인 경우, 예: `getUser`/`getAuth`)는 미존재 시 `null`을 리턴한다** — 공식 문서(`node_modules/next/dist/docs/01-app/02-guides/authentication.md` Line 1176-1198, `dal.ts` 예제)가 이 패턴 근거다. 단 `null`은 "레코드 없음"만 뜻한다 — DB 커넥션/타임아웃 같은 인프라 예외까지 try/catch로 삼켜 `null`로 만들지 않고 `AppError(INTERNAL)`로 throw한다(삼키면 DB 장애가 "미로그인/미존재"로 오분류돼 유효 세션 유저가 튕기고 장애도 로그에 안 잡힌다).
- **필수 존재/인가 확인형 함수(없으면 요청 자체가 잘못된 경우, 예: `getUserById`/`getUserEmail`/`requireAuth`)는 구조화된 에러 타입을 throw한다, plain `Error`를 던지지 않는다** — 공식 문서(`node_modules/next/dist/docs/01-app/02-guides/data-security.md` Line 401-421)가 DAL 함수 안에서 `throw new Error(...)`하는 예제 근거다. 두 패턴을 섞어서 "조회형인데 throw" 또는 "확인형인데 null 리턴"으로 짓지 않는다.
- **생성/변경형 함수(DB 쓰기, 예: `createCoupleInfoService`/`createProductService`)에서 Mongoose 저장 에러를 catch해 `false`/`null` 같은 sentinel 값으로 바꿔 리턴하지 않는다** — 호출자가 검증 실패인지 커넥션 실패인지 구분하지 못한다. 원인에 맞는 분류로 구조화된 에러를 만들어 다시 throw한다.

> 실제 에러 타입/분류 체계는 마이그레이션 진행 중이다 — 공용 taxonomy/전체 그림은 `docs/ERROR_HANDLING.md` 참고, 이 문서에 세부를 복붙하지 않는다.

## 트랜잭션

- **언제 트랜잭션이 필요한가**: 서로 다른 컬렉션(또는 같은 컬렉션의 여러 문서)에 걸친 쓰기가 하나라도 실패하면 나머지 커밋 결과가 도메인 불변조건을 깨는 경우에만 쓴다 — 단일 문서 쓰기(`.create()`/`.save()`/update 하나)는 MongoDB 자체가 문서 단위 원자성을 보장하므로 트랜잭션이 필요 없다. 이 조건에 해당하는 지점: `payment.service.ts`의 `syncPayment` — PAID 확정 시 Payment 저장 + Order 상태 전이(`orderStatus`/`paymentId`) + Product `salesCount` 증가가 하나의 논리적 단위(FAILED 분기도 Payment 저장 + Order 상태 전이 2단계라 동일하게 해당) — 적용 완료, PAID/FAILED 두 분기 다 아래 패턴으로 트랜잭션 처리돼 있다.
- **트랜잭션은 replica set에서만 동작한다**(MongoDB 자체 제약, standalone에선 "Transaction numbers are only allowed on a replica set member or mongos") — Atlas(운영)는 기본 replica set이라 문제없지만, 로컬 테스트는 `mongodb-memory-server`가 기본 standalone이라 막힌다. `src/test/setup.ts`가 단일 노드 replSet으로 이미 전환돼 있다(`docs/TESTING_GUIDELINE.md` 참고) — 이 전환 없이는 트랜잭션 관련 테스트 자체가 불가능했다.
- **`mongoose.connection.transaction(fn)`을 쓴다** — `session.withTransaction()`의 mongoose 전용 wrapper로, 커밋/롤백을 자동 처리하고(성공 시 커밋, 함수가 throw하면 abort) 트랜잭션이 abort되면 그 안에서 `.save()`한 문서의 in-memory 변경사항도 원래 상태로 되돌린다(mongoose 공식 문서: "`Connection#transaction()` ... integrates Mongoose change tracking with transactions"). 두 갈래 패턴을 만들지 않는다 — 트랜잭션이 필요한 곳은 raw `session.startTransaction()`/`commitTransaction()`을 직접 안 쓰고 전부 이 함수 하나로 통일한다.
  ```ts
  await dbConnect();
  await mongoose.connection.transaction(async (session) => {
    await payment.save({ session });
    await order.save({ session });
    await ProductModel.findByIdAndUpdate(
      productId,
      { $inc: { salesCount: quantity } },
      { session },
    );
  });
  ```
- **트랜잭션 안의 모든 연산에 `{ session }`을 빠짐없이 넘긴다** — mongoose 공식 문서: "remember to set the session option on every operation. If you don't, your operation will execute outside of the transaction." 하나라도 빠뜨리면 그 쓰기만 조용히 트랜잭션 밖에서 즉시 커밋돼, 나머지가 롤백돼도 그것만 남는다.
- **트랜잭션 안에서 `Promise.all`류로 연산을 병렬 실행하지 않는다** — mongoose 공식 문서: "Running operations in parallel is not supported during a transaction... is undefined behaviour and should be avoided." 순차로(`await`를 하나씩) 실행한다.
- **롤백은 DB 쓰기 되돌리기만 다룬다 — 외부 API 호출 같은 비-DB 부수효과는 트랜잭션 경계 안에 넣지 않는다.** `syncPayment`는 PortOne을 조회만 하고(쓰기 없음) 그 결과를 트랜잭션 시작 전에 이미 받아온 뒤 DB 쓰기만 트랜잭션으로 묶으므로 이 조건을 만족한다 — 트랜잭션 도중 외부 API에 실제로 쓰기 요청을 보내야 하는 경우가 생기면(아직 없음) DB 롤백만으로 부족해 별도 보상 로직이 필요해진다는 것을 그 시점에 재검토한다(가정만으로 지금 보상 로직 자리를 미리 만들지 않는다).

## Gotchas

- `requireAuth()`는 `getAuth()`를 감싸서 세션 없으면 `AppError(UNAUTHENTICATED)`를 throw하는 얇은 헬퍼다 — HTTP status(401)는 여기서 모른다, 각 채널 공용 핸들러가 UNAUTHENTICATED를 자기 형태(route.ts는 401 Response, Server Action은 `ErrorPayload`)로 번역한다. 인증이 필수인 Route Handler·Server Action 둘 다 세션 검증에 이 함수를 공유한다(`src/app/api/CLAUDE.md` Gotchas 참고).
- mongoose에 `mongoose.set('transactionAsyncLocalStorage', true)` 글로벌 옵션이 있다(설치된 버전 8.20.3에 실재 확인) — 켜면 트랜잭션 콜백 안의 모든 연산에 `session`을 자동 주입해 위 "session 빠뜨림" 실수 자체를 없앤다. 지금은 안 켠다 — 트랜잭션을 쓰는 지점이 `syncPayment` 하나뿐이라 켰을 때의 영향 범위(다른 서비스 함수들의 기존 동작)를 실제로 검증할 근거가 부족하다. 트랜잭션 쓰는 지점이 늘어나 session 누락 실수가 반복되면 그때 켤지 재검토한다(가정만으로 미리 켜지 않는다).

## References

즉시 로드(`@import`) 아님 — 트리거 열 키워드에 해당하는 작업일 때만 해당 문서를 읽는다.

| 문서                 | 위치                   | 트리거                              | 요약                               |
| -------------------- | ----------------------- | ------------------------------------ | ----------------------------------- |
| `CLAUDE.md`          | `src/server/models/`    | DB 스키마 확인 시                    | 모델 정의                           |
| `CLAUDE.md`          | `src/server/lib/`       | 외부 연동 wrapper 확인 시            | 외부 연동 컨벤션                    |
| `CLAUDE.md`          | `src/app/api/`          | 이 서비스를 호출하는 쪽(route.ts) 확인 시 | Route Handler 컨벤션           |
| `CLAUDE.md`          | `src/server/actions/`   | 이 서비스를 호출하는 쪽(action) 확인 시   | Server Action 컨벤션           |
| `TESTING_GUIDELINE.md` | `docs/`                | 이 폴더 테스트 작성 시               | DB/목킹 전략, assertion 패턴        |
| `ERROR_HANDLING.md`  | `docs/`                 | 에러 처리 로직 작성/수정 시          | 레이어 간 에러 흐름, 분류 taxonomy  |
