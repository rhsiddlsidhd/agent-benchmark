# src/actions

> Last updated: 2026-07-19

## Scope

Server Actions(`"use server"`) 전용 규칙. 공식 문서(Next.js 15, App Router) 기준으로 정의하며, 현재 작성된 코드의 스타일은 기준에 포함하지 않는다.

## Structure

```
src/actions/
├── {create|update|delete}{Domain}Action.ts   # 예: createProductAction.ts
└── {domain동사}.ts                            # 예: loginUser.ts, signupUser.ts
```

## Critical Convention

- Server Action 파일에 `"use server"` 지시어 없이 서버 전용 함수를 export하지 않는다 — 이 지시어가 파일(또는 함수) 최상단에 있어야 React/Next가 해당 함수를 Server Action으로 인식한다.
- `redirect()`를 try/catch 블록 안에서 호출하지 않는다 — 공식 문서: `redirect`는 내부적으로 에러를 throw해 동작하므로 반드시 try/catch 밖에서 호출해야 한다. try 안에서 호출하면 catch가 리다이렉트 신호를 삼켜 리다이렉트가 동작하지 않는다.
- Server Action 내부에서 인증/권한 검증을 생략하지 않는다 — 공식 문서: Server Action은 공개 API 엔드포인트와 동일한 보안 고려가 필요하므로, 데이터 변경 전 반드시 세션/역할을 검증한다.
- mutation 이후 관련 캐시를 갱신하지 않고 끝내지 않는다 — 공식 문서 패턴: `revalidatePath`/`revalidateTag`로 변경된 데이터가 노출되는 경로를 명시적으로 갱신한다.
- Client Component에서 직접 호출할 Server Action을 컴포넌트 파일 안에 인라인으로 정의하지 않는다 — Client Component는 `"use server"`가 선언된 별도 파일의 export만 import해 호출할 수 있다(인라인 함수 레벨 `"use server"`는 Server Component 전용).
- `useActionState`로 연결되는 액션의 인자 순서를 `(prevState, formData)` 밖으로 바꾸지 않는다 — 이 훅의 계약이 이 순서를 요구한다.

## Gotchas

- 없음.
