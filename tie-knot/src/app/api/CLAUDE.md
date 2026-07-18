# src/app/api

> Last updated: 2026-07-19

## Scope

Next.js Route Handler(`route.ts`) 전용 규칙. `AGENTS.md`에 명시된 대로 이 프로젝트의 실제 설치 버전(Next.js 16, `node_modules/next/dist/docs/`)을 기준으로 정의하며, 현재 작성된 코드의 스타일은 기준에 포함하지 않는다.

## Structure

```
src/app/api/
├── auth/{cookie,entry,logout,me,refresh,verify}/route.ts
├── banks/route.ts
├── couple-info/route.ts
├── guestbook/route.ts
├── kakaomap/route.ts
├── order/create/route.ts
├── payment/complete/route.ts
├── premium-features/route.ts
├── products/route.ts
├── products/[id]/like/route.ts
├── subway/route.ts
└── upload/signature/route.ts
```

## Critical Convention

- `route.ts`와 동일한 라우트 세그먼트에 `page.tsx`를 두지 않는다 — Next.js 공식 문서: Route Handler는 `page.js`와 같은 라우트 세그먼트 레벨에 공존할 수 없다.
- HTTP 메서드 핸들러를 `GET`/`POST`/`PUT`/`PATCH`/`DELETE`/`HEAD`/`OPTIONS` 이외 이름으로 export하지 않는다 — Route Handler는 이 이름의 export만 요청 라우팅에 사용한다(공식 지원 메서드 목록).
- 핸들러 함수를 `Response`(또는 `NextResponse`) 반환 없이 끝내지 않는다 — Route Handler는 반드시 응답을 반환해야 하는 계약이며, 위반 시 런타임 에러가 발생한다.
- 동적 세그먼트의 `params`를 동기 값처럼 구조분해하지 않는다 — `params`는 `Promise<{...}>` 타입이므로 `await params`로 풀어 써야 한다(수동 타입 대신 `next typegen`으로 생성되는 전역 `RouteContext<'/경로/[id]'>` 헬퍼를 써도 된다).
- `next/headers`의 `cookies()`/`headers()`를 동기 함수처럼 호출하지 않는다 — 두 함수 모두 비동기이므로 `await cookies()`/`await headers()`로 사용한다.
- GET 이외의 메서드(POST/PUT/PATCH/DELETE)에 캐싱 옵트인(`export const dynamic = 'force-static'`)을 적용하지 않는다 — 공식 문서: GET을 제외한 나머지 메서드는 같은 파일에 캐시되는 GET과 나란히 있어도 캐시되지 않는다.
- Route Handler 안에서 `updateTag()`를 호출하지 않는다 — 공식 문서: `updateTag`는 Server Action 전용이며 Route Handler에서 호출하면 에러가 던져진다. Route Handler에서 캐시를 무효화해야 하면 `revalidateTag`/`revalidatePath`를 쓴다.

## Gotchas

- `upload/signature/route.ts`, `kakaomap/route.ts`가 `src/api/` 공용 응답/에러 계약을 안 쓰는 라우트다 — 구체적인 내용과 이유는 `src/api/CLAUDE.md` Gotchas 참고.
