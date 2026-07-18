# src/actions

> Last updated: 2026-07-19

## Scope

Server Actions(`"use server"`) 전용 규칙. `AGENTS.md`에 명시된 대로 이 프로젝트의 실제 설치 버전(Next.js 16, `node_modules/next/dist/docs/`)을 기준으로 정의하며, 현재 작성된 코드의 스타일은 기준에 포함하지 않는다.

## Structure

```
src/actions/
├── {create|update|delete}{Domain}Action.ts   # 예: createProductAction.ts
└── {domain동사}.ts                            # 예: loginUser.ts, signupUser.ts
```

## Critical Convention

- Server Action 파일에 `"use server"` 지시어 없이 서버 전용 함수를 export하지 않는다 — 이 지시어가 파일(또는 함수) 최상단에 있어야 React/Next가 해당 함수를 Server Action으로 인식한다.
- `redirect()`를 try/catch 블록 안에서 호출하지 않는다 — 공식 문서: `redirect`는 내부적으로 에러를 throw해 동작하므로 반드시 try/catch 밖에서 호출해야 한다. try 안에서 호출하면 catch가 리다이렉트 신호를 삼켜 리다이렉트가 동작하지 않는다.
- 클라이언트가 넘긴 값을 소유권 판단 없이 그대로 DB 조회/수정 조건으로 쓰지 않는다 — 리소스 참조(ID)와 변경 내용만 클라이언트에서 받고, 소유자/권한은 세션에서 다시 조회해 대조한다. zod 등 스키마 검증은 값의 "형태"만 보장할 뿐 소유권을 보장하지 않는다.
- DB 레코드를 그대로 반환값으로 넘기지 않는다 — Server Action의 리턴값은 클라이언트로 직렬화되므로, UI가 실제로 쓰는 필드만 추려 반환한다.
- mutation 이후 관련 캐시를 갱신하지 않고 끝내지 않는다 — Server Action 안에서는 즉시 반영(read-your-own-writes)이 필요하면 `updateTag`를, 오리진이 Route Handler 등 Server Action 바깥이면 `revalidateTag`/`revalidatePath`를 쓴다(`updateTag`는 Server Action 밖에서 호출하면 에러가 던져진다).
- Client Component에서 직접 호출할 Server Action을 컴포넌트 파일 안에 인라인으로 정의하지 않는다 — Client Component는 `"use server"`가 선언된 별도 파일의 export만 import해 호출할 수 있다(인라인 함수 레벨 `"use server"`는 Server Component 전용).
- `useActionState`로 연결되는 액션의 인자 순서를 `(prevState, formData)` 밖으로 바꾸지 않는다 — 이 훅의 계약이 이 순서를 요구한다.

## Gotchas

- 클라이언트에서 여러 Server Action을 `Promise.all`로 동시에 트리거해도 병렬로 실행되지 않는다 — Next.js가 클라이언트당 순차 디스패치(sequential dispatch)하므로 두 번째 액션은 첫 번째가 끝난 뒤 시작된다. 진짜 병렬 처리가 필요하면 액션 하나 안에서 처리하거나 Route Handler를 쓴다.
- CSRF 체크(Origin/Host 대조)·요청 본문 1MB 제한·클로저 값 암호화는 프레임워크가 자동으로 처리한다 — 액션 안에 직접 구현하지 않는다.

## 관련 문서

- 인증/권한 검증 규칙(Proxy 의존 금지 포함): `src/CLAUDE.md`
