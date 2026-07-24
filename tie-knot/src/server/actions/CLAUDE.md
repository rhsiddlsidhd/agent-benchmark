# src/server/actions

> Last updated: 2026-07-19
> `AGENTS.md`에 명시된 대로 이 프로젝트의 실제 설치 버전(Next.js 16, `node_modules/next/dist/docs/`)을 기준으로 정의한다 — 현재 작성된 코드의 스타일은 기준에 포함하지 않는다.

## Overview

Server Component가 `src/server/services/*`를 직접 import해서 호출하는 것과 같은 축이다 — route.ts를 안 거치고 함수를 직접 호출한다는 점은 동일하다(`src/CLAUDE.md`의 "데이터 접근 경로" 참고). 다른 점은 호출 트리거뿐이다: Client Component가 이 폴더의 함수를 `useActionState`나 form `action`에 직접 넘기면, Next.js가 그 함수 참조를 RPC로 변환해 서버에서 실행한다 

## Structure

```
src/server/actions/
├── index.ts   # 배럴 — export *
└── {동사}{Domain}.ts   # 예: createProduct.ts, deleteGuestbook.ts, loginUser.ts — "Action" 접미사 없음
```

## Critical Convention

- 파일명/함수명에 "Action" 접미사를 붙이지 않는다 — 공식 문서(`server-actions.md`) 예제(`createPost`, `deletePost`, `completeItem`, `completeItemUnsafe` 등) 전부 동사+도메인명뿐, "Action" 접미사가 붙은 예시가 하나도 없다. 두 갈래 패턴을 만들지 않는다 — 도메인 무관하게 전부 `{동사}{Domain}.ts`(파일명=함수명, camelCase) 하나로 통일한다.
- Server Action 파일에 `"use server"` 지시어 없이 서버 전용 함수를 export하지 않는다 — 이 지시어가 파일(또는 함수) 최상단에 있어야 React/Next가 해당 함수를 Server Action으로 인식한다.
- `redirect()`를 try/catch 블록 안에서 호출하지 않는다 — 공식 문서: `redirect`는 내부적으로 에러를 throw해 동작하므로 반드시 try/catch 밖에서 호출해야 한다. try 안에서 호출하면 catch가 리다이렉트 신호를 삼켜 리다이렉트가 동작하지 않는다.
- **예상 가능한 실패(입력 검증 실패, 비즈니스 규칙 위반 등)는 throw하지 않고 리턴값으로 모델링한다** — 공식 문서(`error-handling.md`): "avoid using try/catch blocks and throw errors [for expected errors]. Instead, model expected errors as return values." `try/catch`는 진짜 예측 불가능한 예외(DB 연결 실패 등)에만 쓰고, 잡은 뒤엔 구체적 원인을 노출하지 않는 일반 메시지로 변환해서 리턴한다. 반환 타입은 각 액션이 자기 유스케이스에 맞게 직접 정의한다 — 공용 계약은 `src/server/CLAUDE.md`(Route Handler), `src/client/CLAUDE.md`(Client fetch) 참고(이 폴더 소관 아님).
- 클라이언트가 넘긴 값을 소유권 판단 없이 그대로 DB 조회/수정 조건으로 쓰지 않는다 — 리소스 참조(ID)와 변경 내용만 클라이언트에서 받고, 소유자/권한은 세션에서 다시 조회해 대조한다. zod 등 스키마 검증은 값의 "형태"만 보장할 뿐 소유권을 보장하지 않는다.
- DB 레코드를 그대로 반환값으로 넘기지 않는다 — Server Action의 리턴값은 클라이언트로 직렬화되므로, UI가 실제로 쓰는 필드만 추려 반환한다.
- mutation 이후 관련 캐시를 갱신하지 않고 끝내지 않는다 — Server Action 안에서는 즉시 반영(read-your-own-writes)이 필요하면 `updateTag`를, 오리진이 Route Handler 등 Server Action 바깥이면 `revalidateTag`/`revalidatePath`를 쓴다(`updateTag`는 Server Action 밖에서 호출하면 에러가 던져진다).
- Client Component에서 직접 호출할 Server Action을 컴포넌트 파일 안에 인라인으로 정의하지 않는다 — Client Component는 `"use server"`가 선언된 별도 파일의 export만 import해 호출할 수 있다(인라인 함수 레벨 `"use server"`는 Server Component 전용).
- `useActionState`로 연결되는 액션의 인자 순서를 `(prevState, formData)` 밖으로 바꾸지 않는다 — 이 훅의 계약이 이 순서를 요구한다.

## 에러 처리(목표 설계, 마이그레이션 진행 중)

> 전체 그림/공용 taxonomy는 `src/CLAUDE.md`의 "에러 핸들링 — 공통 규칙" 참고. 여기는 이 폴더(채널 A) 전용 규칙만 다룬다.

- 리턴 형태를 공식 문서가 지정하지 않는다 — 공식 문서(`server-actions.md`): "Constrain return values. Action returns are serialized to the client. Shape them to what the UI renders, not raw database records." `{success, error}` envelope은 프로젝트 컨벤션이지 Next.js 요구사항이 아니다.
- 핵심 로직(액션 본문) 안에서 try/catch나 로깅을 직접 하지 않는다 — services가 던진 `AppError`를 캐치하고, 로깅하고, 리턴값(`{ success:false, error: ErrorPayload }`, `ErrorPayload = { 분류, message, fieldErrors? }`)으로 번역하는 건 이 폴더 전체가 공유하는 공용 핸들러가 전담한다. 핵심 로직은 그냥 throw만 한다.
- 민감 분류(INTERNAL/EXTERNAL_SERVICE)의 `message`는 이 공용 핸들러가 일반 문구로 바꿔 담는다 — 원문은 로그에만 남긴다. 클라이언트는 받은 `message`를 그대로 렌더하므로 여기서 안 가리면 원문이 브라우저까지 샌다. `분류→안전문구` lookup map은 route.ts 핸들러와 공유한다(로직이 아니라 데이터라 공유해도 채널 분리 위반 아님).
- 로깅은 그 공용 핸들러 안에서만 한다 — 액션마다 각자 `console.error`를 찍지 않는다, 나중에 외부 에러추적 서비스를 붙여도 이 지점만 고치면 되게 한다.
- route.ts용 공용 핸들러와는 별개로 둔다 — 리턴 형태가 근본적으로 다르다(함수 리턴값 vs HTTP Response).

## Gotchas

- `"use server"` 파일이라 배럴(`index.ts`)로 묶여도 클라이언트엔 실제 코드 대신 RPC 참조만 내려가서 다른 액션의 서버 전용 의존성(mongodb/bcrypt 등)이 새지 않는다.
- 클라이언트에서 여러 Server Action을 `Promise.all`로 동시에 트리거해도 병렬로 실행되지 않는다 — Next.js가 클라이언트당 순차 디스패치(sequential dispatch)하므로 두 번째 액션은 첫 번째가 끝난 뒤 시작된다. 진짜 병렬 처리가 필요하면 액션 하나 안에서 처리하거나 Route Handler를 쓴다.
- CSRF 체크(Origin/Host 대조)·요청 본문 1MB 제한·클로저 값 암호화는 프레임워크가 자동으로 처리한다 — 액션 안에 직접 구현하지 않는다.
- 서비스 레이어가 던지는 에러를 공용 핸들러가 캐치해서 리턴값으로 번역하는 것은, 액션 "자신의" 검증 실패를 throw하는 게 아니라 더 아래 레이어에서 이미 일어난 예외를 리턴값으로 번역하는 것이라 "예상 가능한 실패는 리턴값으로 모델링한다" 규칙과 상충하지 않는다.

## 관련 문서

- 인증/권한 검증 규칙(Proxy 의존 금지 포함): `src/CLAUDE.md`
- Server Action이 제외된 응답/에러 계약(Route/Client 전용): `src/server/CLAUDE.md`, `src/client/CLAUDE.md`
- 테스트 작성 컨벤션(리턴값 assertion 패턴): `docs/TESTING_GUIDELINE.md`
