# src/app/api

> Last updated: 2026-07-19

## Overview

`src/app/api/`는 Next.js Route Handler(`route.ts`) 전용 규칙을 다룬다 — `AGENTS.md`에 명시된 대로 이 프로젝트의 실제 설치 버전(Next.js 16, `node_modules/next/dist/docs/`)을 기준으로 정의하며, 현재 작성된 코드의 스타일은 기준에 포함하지 않는다.

## Structure

```
src/app/api/
├── auth/{cookie,entry,logout,me}/route.ts
├── products/[id]/like/route.ts
└── ...                        # 라우트 세그먼트당 route.ts 1개
```

## Critical Convention

- `route.ts`와 동일한 라우트 세그먼트에 `page.tsx`를 두지 않는다 — Next.js 공식 문서: Route Handler는 `page.js`와 같은 라우트 세그먼트 레벨에 공존할 수 없다.
- HTTP 메서드 핸들러를 `GET`/`POST`/`PUT`/`PATCH`/`DELETE`/`HEAD`/`OPTIONS` 이외 이름으로 export하지 않는다 — Route Handler는 이 이름의 export만 요청 라우팅에 사용한다(공식 지원 메서드 목록).
- 핸들러 함수를 `Response`(또는 `NextResponse`) 반환 없이 끝내지 않는다 — Route Handler는 반드시 응답을 반환해야 하는 계약이며, 위반 시 런타임 에러가 발생한다.
- 동적 세그먼트의 `params`를 동기 값처럼 구조분해하지 않는다 — `params`는 `Promise<{...}>` 타입이므로 `await params`로 풀어 써야 한다(수동 타입 대신 `next typegen`으로 생성되는 전역 `RouteContext<'/경로/[id]'>` 헬퍼를 써도 된다).
- `next/headers`의 `cookies()`/`headers()`를 동기 함수처럼 호출하지 않는다 — 두 함수 모두 비동기이므로 `await cookies()`/`await headers()`로 사용한다.
- GET 이외의 메서드(POST/PUT/PATCH/DELETE)에 캐싱 옵트인(`export const dynamic = 'force-static'`)을 적용하지 않는다 — 공식 문서: GET을 제외한 나머지 메서드는 같은 파일에 캐시되는 GET과 나란히 있어도 캐시되지 않는다.
- Route Handler 안에서 `updateTag()`를 호출하지 않는다 — 공식 문서: `updateTag`는 Server Action 전용이며 Route Handler에서 호출하면 에러가 던져진다. Route Handler에서 캐시를 무효화해야 하면 `revalidateTag`/`revalidatePath`를 쓴다.
- 응답 생성 시 이 프로젝트가 추가한 계약을 따른다 — 세부 규칙은 `src/server/CLAUDE.md` 참고.

## Gotchas

- 수동 refresh 라우트(`auth/refresh`/`auth/verify`)는 없다 — access token이 httpOnly 쿠키라 클라이언트가 수동으로 refresh를 트리거할 필요가 없고, `services/auth.service.ts`의 `getAuth()`가 라우트 호출 시점에 자동으로 처리한다(`src/CLAUDE.md` 참고).
- 인증이 필요한 Route Handler는 Bearer 헤더를 직접 파싱하지 않고 `services/auth.service.ts`의 `requireAuth()`를 호출한다(세션 없으면 401 throw) — `couple-info`/`order/create`/`payment/complete`/`products/[id]/like`가 이 패턴을 따른다. `kakaomap`의 `Authorization` 헤더는 별개(외부 Kakao API 인증용)라 해당 없음.

## 관련 문서

- 응답/에러 계약: `src/server/CLAUDE.md`
- 이 라우트가 호출하는 비즈니스 로직: `src/server/services/CLAUDE.md`
- Server Actions(자매 컨텍스트): `src/server/actions/CLAUDE.md`
- Proxy/Middleware 경계: `src/CLAUDE.md`
- 테스트 작성 컨벤션(1차 범위에서 후순위): `docs/TESTING_GUIDELINE.md`
