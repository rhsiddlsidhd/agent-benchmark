# src/server/actions

> Last updated: 2026-07-29

## Overview

Server Component가 `src/server/services/*`를 직접 import해서 호출하는 것과 같은 축이다 — route.ts를 안 거치고 함수를 직접 호출한다는 점은 동일하다(`docs/DATA_ACCESS.md` 참고). 다른 점은 호출 트리거뿐이다: Client Component가 이 폴더의 함수를 `useActionState`나 form `action`에 직접 넘기면, Next.js가 그 함수 참조를 RPC로 변환해 서버에서 실행한다

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
  - 서비스 레이어가 던진 `AppError`를 액션이 다시 throw해서 `boundary.ts`의 `actionError`가 캐치·번역(`{ success:false, error }`)하는 것도 이 규칙 위반 아님 — 액션 "자신의" 검증 실패가 아니라 더 아래 레이어에서 이미 난 예외를 리턴값으로 옮기는 것뿐이다. 상세 규칙은 `docs/ERROR_HANDLING.md` §채널 A 참고.
- 클라이언트가 넘긴 값을 소유권 판단 없이 그대로 DB 조회/수정 조건으로 쓰지 않는다 — 리소스 참조(ID)와 변경 내용만 클라이언트에서 받고, 소유자/권한은 세션에서 다시 조회해 대조한다. zod 등 스키마 검증은 값의 "형태"만 보장할 뿐 소유권을 보장하지 않는다.
- DB 레코드를 그대로 반환값으로 넘기지 않는다 — Server Action의 리턴값은 클라이언트로 직렬화되므로, UI가 실제로 쓰는 필드만 추려 반환한다.
- mutation 이후 관련 캐시를 갱신하지 않고 끝내지 않는다 — Server Action 안에서는 즉시 반영(read-your-own-writes)이 필요하면 `updateTag`를, 오리진이 Route Handler 등 Server Action 바깥이면 `revalidateTag`/`revalidatePath`를 쓴다(`updateTag`는 Server Action 밖에서 호출하면 에러가 던져진다).
- Client Component에서 직접 호출할 Server Action을 컴포넌트 파일 안에 인라인으로 정의하지 않는다 — Client Component는 `"use server"`가 선언된 별도 파일의 export만 import해 호출할 수 있다(인라인 함수 레벨 `"use server"`는 Server Component 전용).
- `useActionState`로 연결되는 액션의 인자 순서를 `(prevState, formData)` 밖으로 바꾸지 않는다 — 이 훅의 계약이 이 순서를 요구한다.

## Gotchas

- `"use server"` 파일이라 배럴(`index.ts`)로 묶여도 클라이언트엔 실제 코드 대신 RPC 참조만 내려가서 다른 액션의 서버 전용 의존성(mongodb/bcrypt 등)이 새지 않는다.
- 클라이언트에서 여러 Server Action을 `Promise.all`로 동시에 트리거해도 병렬로 실행되지 않는다 — Next.js가 클라이언트당 순차 디스패치(sequential dispatch)하므로 두 번째 액션은 첫 번째가 끝난 뒤 시작된다. 진짜 병렬 처리가 필요하면 액션 하나 안에서 처리하거나 Route Handler를 쓴다.
- CSRF 체크(Origin/Host 대조)·요청 본문 1MB 제한·클로저 값 암호화는 프레임워크가 자동으로 처리한다 — 액션 안에 직접 구현하지 않는다.

## References

즉시 로드(`@import`) 아님 — 트리거 열 키워드에 해당하는 작업일 때만 해당 문서를 읽는다.

| 문서                   | 위치          | 트리거                               | 요약                                    |
| ---------------------- | ------------- | ------------------------------------ | --------------------------------------- |
| `ERROR_HANDLING.md`    | `docs/`       | 에러 처리 로직 작성/수정 시          | 채널 A 상세 규칙 |
| `CLAUDE.md`            | `src/`        | Proxy/인증·인가 검증 규칙 확인 시    | Proxy 의존 금지 등 인증/인가 검증 규칙  |
| `CLAUDE.md`            | `src/server/` | 응답/에러 계약(Route/Client) 확인 시 | 이 폴더가 제외된 응답/에러 계약         |
| `CLAUDE.md`            | `src/client/` | 클라이언트 소비 쪽 계약 확인 시      | 이 폴더가 제외된 응답/에러 계약         |
| `TESTING_GUIDELINE.md` | `docs/`       | 이 폴더 테스트 작성 시               | 리턴값 assertion 패턴                   |
