# src/

> Last updated: 2026-07-24

## Overview

앱 코드 루트 — 폴더 횡단 컨벤션(배럴 import, 상태관리 계층) 전담.

## Key Files

| File       | Purpose                                                                                             |
| ---------- | --------------------------------------------------------------------------------------------------- |
| `proxy.ts` | 인증/권한 기반 라우트 접근 제어(로그인 필요 경로, 어드민 role 체크, 로그인 유저의 auth 페이지 차단) |

## 데이터 접근 경로 — 무엇이 필요한가가 기준

"누가 부르는가"가 아니라 "무엇이 필요한가"로 경로가 갈린다 — 브라우저가 트리거해도 mutation은 예외 없이 Server Action으로 간다(아래 2번), route.ts를 거치는 건 캐싱이 필요한 조회뿐이다.

| # | 필요 | 경로 |
|---|---|---|
| 1 | 서버 렌더 시점 데이터(Server Component 렌더링용) | `src/server/services/*` 직접 import + 함수 호출 — route.ts 안 거침(같은 프로세스 안에서 굳이 HTTP 왕복 안 만듦) |
| 2 | 브라우저 트리거 mutation(create/update/delete) — 폼이든 이벤트 핸들러든 | Server Action — 폼 밖이면 이벤트 핸들러/`useEffect`를 `startTransition`으로 감싸 호출. route.ts/raw `fetch` 안 거침(Server Action은 브라우저에 함수 참조만 내려가는 RPC라 route.ts 자체가 불필요) |
| 3 | 브라우저가 캐싱/재검증(dedupe, focus·interval revalidate) 필요한 조회(GET) | route.ts + `fetcher`(`useSWR`) — raw `fetch` 안 거침(envelope 파싱/구조화된 에러 정규화가 `fetcher`에 집중) |

- 브라우저가 트리거하는 mutation은 예외 없이 Server Action(row 2)으로 간다 — 클라이언트에 raw `fetch`(및 그 래퍼)를 두지 않는다. 과거 "caller가 Server Action을 못 쓰는 mutation" 예외(외부 연동 등)는 실제 인스턴스가 없어 제거했다 — 외부 결제도 브라우저 SDK 호출만 클라에 남고 검증 mutation은 Server Action이다. 새로 그런 사례가 실제로 생기면 그때 재검토한다(가정만으로 예외 자리를 미리 열어두지 않는다).

## 에러 핸들링

### 흐름 (placeholder — 함수/클래스 이름은 마이그레이션 착수 시 코드에서 정해진다)

```
services (AppError throw / null 리턴)
   ↓
Server Action 공용 핸들러                     route.ts 공용 핸들러
(캐치 + 로깅 + 민감분류 message 일반화         (캐치 + 로깅 + 민감분류 message 일반화
 + ErrorPayload 리턴)                          + 분류→HTTP status 매핑 + Response 번역)
   ↓                                              ↓
{success:false, error: ErrorPayload}          Response(status=매핑된 status, body=ErrorPayload)
   ↓                                              ↓
                     client (useActionState / useSWR)
        서버가 준 ErrorPayload를 그대로 렌더 — fieldErrors→input, message→전역 알림.
        (클라이언트는 "원문 노출 안전한가"를 판단하지 않는다 — 서버가 이미 일반화해서 보냈다)

ErrorPayload = { 분류, message, fieldErrors? }
```

### 채널 분리 규칙

"데이터 접근 경로" 표와 짝을 이루는 3개 채널로 나눈다: **A** Server Action, **B** Route Handler(route.ts), **C** 클라이언트 `useSWR`(폼은 `useActionState`로 채널 A 결과를 받는다).

- A/B는 리턴 형태가 근본적으로 다르다(함수 리턴값 vs HTTP Response) — 서버 쪽 에러 처리(캐치·로깅·민감분류 message 일반화)는 채널별로 각자 만든다, 하나로 묶지 않는다. 단 `분류→안전문구`·`분류→HTTP status` 같은 lookup map은 양쪽이 공유한다 — 로직이 아니라 데이터라 공유해도 채널 분리 위반이 아니다.
- 클라이언트(채널 A 결과/채널 C 에러)는 실패를 "해석"하지 않는다 — 서버가 준 `ErrorPayload`를 그대로 렌더한다(`useActionState` state, `useSWR` `error`). "이 message를 원문으로 보여줘도 되나"를 클라이언트가 판단하지 않는다, 그 안전화는 서버 경계(A/B 핸들러)에서 이미 끝냈다. B는 소비자가 아니라 생산자라 이 렌더 대상이 아니다.

### 에러 표현 규칙

- services가 던지는 에러는 `AppError` 하나로 통일한다 — HTTP status를 들고 다니는 에러 타입(`HTTPError` 등)을 만들지 않는다. `AppError`는 앱 고유 분류만 담고 HTTP status는 모른다(HTTP는 route.ts만의 관심사). HTTP status로의 번역은 route.ts 경계에서만 일어난다.
- 이 분류 taxonomy는 services 전용 어휘가 아니다 — Server Action 자체의 zod 검증(VALIDATION)도 services를 안 거치지만 같은 분류를 공유한다.
- 분류→HTTP status 매핑은 그 분류 정의 자체에 박아넣지 않는다 — 같은 이유로, 매핑표는 route.ts 쪽 코드(`response.ts`)에 별도로 둔다.
- 필드별 검증 에러(폼 input 단위)는 `AppError`에 넣지 않는다 — zod 검증 실패는 services를 거치지 않고 Server Action 안에서 바로 만들어지는 별개 경로이기 때문이다.
- 클라이언트로 나가는 에러는 단일 `ErrorPayload { 분류, message, fieldErrors? }` 형태로 통일한다 — 채널 A 리턴(`{ success:false, error: ErrorPayload }`)과 채널 B Response body가 같은 객체를 싣는다. `fieldErrors`는 zod 경로에서만 채워지는 optional이라, 클라이언트는 채널을 구분하지 않고 이 한 shape만 소비한다.
- 민감 분류(INTERNAL/EXTERNAL_SERVICE)의 `message`는 서버 공용 핸들러가 일반 문구로 바꿔 담는다 — 원문은 서버 로그에만 남긴다. 원문을 응답 body에 실어 보낸 뒤 클라이언트에서 가리지 않는다(그 시점엔 이미 네트워크로 노출됨).

| 분류 | HTTP status | 의미 |
|---|---|---|
| VALIDATION | 400 | 입력값 검증 실패 |
| UNAUTHENTICATED | 401 | 인증 필요/세션 만료 |
| FORBIDDEN | 403 | 인가 실패 |
| NOT_FOUND | 404 | 리소스 없음 |
| INTERNAL | 500 | 서버/DB 처리 실패 |
| DISABLED | 503 | 기능 일시 비활성 |
| EXTERNAL_SERVICE | 502 | 외부 연동 실패 |

### 레이어별 규칙 위치 (index)

| 채널/레이어 | 목적(요약) | 규칙 위치 |
|---|---|---|
| services | `AppError` throw / `null` 리턴 — 구조화된 에러 원본 생산, HTTP 모름 | `src/server/services/CLAUDE.md` |
| Server Action(채널 A) | `AppError` 캐치 → 로깅 + 민감분류 일반화 + `ErrorPayload` 리턴 | `src/server/actions/CLAUDE.md` |
| route.ts(채널 B) | `AppError` 캐치 → 로깅 + 민감분류 일반화 + 분류→status 매핑 + Response 번역, `Response`/`NextResponse` 기준 | `src/server/CLAUDE.md` |
| 에러 타입 정의 | `AppError`/분류 taxonomy/`ErrorPayload` — 여러 레이어 공유 계약 | `src/shared/types/CLAUDE.md` |
| 클라이언트 소비(채널 C) | `useSWR` `error` 렌더 + `useActionState` state 렌더 — 서버가 준 `ErrorPayload` 그대로, 판단 로직 없음 | `src/client/CLAUDE.md` |

## Critical Convention

- Server Action의 인증/권한 검증을 Proxy에 위임하지 않는다 — 렌더링 시점 접근 제어는 애초에 보안 경계가 아니다(UI 없이 동일 오리진에서 같은 POST 요청을 직접 보낼 수 있다), 그래서 각 Server Action 내부에서 세션/역할을 반드시 재검증한다.
- matcher 없이 Proxy를 배포하지 않는다 — 공식 문서: matcher가 없으면 정적 파일(`_next/static`)·이미지 최적화(`_next/image`)·`public/` 자산까지 모든 요청에서 실행돼, 의도치 않게 CSS/JS/이미지 로딩을 막을 수 있다.
- Proxy 안에서 느린 데이터 페칭(외부 API 호출 등)을 하지 않는다 — 공식 문서: Proxy는 느린 데이터 페칭 용도가 아니며, 세션 관리·인가의 전체 솔루션으로 쓰여서도 안 된다(낙관적 체크 용도로만).
- 프로젝트당 두 번째 proxy 파일을 만들지 않는다 — 공식 문서: 프로젝트당 `proxy.ts` 단 하나만 지원한다. 로직을 나누고 싶으면 별도 모듈로 쪼갠 뒤 그 안에서 import해서 조립한다.
- **`src/` 하위 폴더 안 파일은 개별 경로로 직접 import하지 않는다 — `index.ts` 배럴을 기본으로 두고 그 배럴을 통해서만 import한다. 배럴은 예외 없이 전부 `export * from "./x"`로만 구성한다. `src/` 안 파일도 `export default`를 쓰지 않는다 — 전부 named export로 짓는다.** 단, `src/app/`은 Next.js 공식 규약상 예외(라우트 파일 `export default` 강제, 배럴 구조 불가) — 상세는 `src/app/CLAUDE.md` 참고.
- 로컬 상태로 충분한 걸 곧바로 Context나 Zustand로 확장하지 않는다 — 클라이언트 상태 범위는 로컬 → Context API(`src/client/context/`) → Zustand(`src/client/store/`) 순으로만 넓힌다.
- 서버에서 온 데이터를 Context/Zustand로 직접 옮기지 않는다 — 캐싱·중복 호출 방지는 `useSWR`(주로 `src/client/hooks/`의 훅 안에서 Zustand 구독과 함께 조합)이 전담한다.
- 외부 SDK를 초기화하는 훅(`useKakaoLoader` 등)은 `src/client/hooks/`가 아니라 그 SDK를 감싸는 `src/lib/{service}/`에 둔다 — 훅이라도 연동 대상 하나에 강결합돼 있으면 `lib/`의 "연동 대상 1개 = 폴더 1개" 소관이다(`src/lib/CLAUDE.md`, `src/client/hooks/CLAUDE.md` 참고).
- **구현체 하나가 2곳 이상의 구체적 소비처에서 쓰이면, 이름에 그 소비처 중 하나를 특정하지 않는다** — 특정하면 그 이름이 다른 소비처 입장에선 의미가 맞지 않게 된다.
- **식별자 케이스**: 타입/인터페이스는 PascalCase, 함수/변수는 camelCase다. `export const`의 값을 재귀적으로 뜯어봤을 때 문자열/숫자/불리언 리터럴(또는 그 배열/lookup map)로만 이루어져 있으면 SCREAMING_SNAKE_CASE로 export한다 — 단일 값이든 여러 값 나열이든 키→리터럴 값 lookup map이든 "값이 끝까지 리터럴이냐"가 기준이다. 값 안에 함수·컴포넌트 참조·이종 필드 객체가 하나라도 섞이면 camelCase다. **위치가 `constants/`든 파일 내부 로컬이든 무관하게 적용한다** — 컴포넌트/훅 안 로컬 상수도 대상이다.
- 같은 아티팩트 타입끼리 파일명 케이스가 겹치지 않게 짓는다 — 파일명만 보고 컴포넌트인지 훅인지 유틸인지 구분할 수 있어야 한다.
- `{목적}` 기반 파일(도메인 무관 범용 카테고리 — `utils/`, `constants/{목적}.ts`, `hooks/use{목적}.ts`, `services/{목적}.service.ts`, `schemas/{목적}.schema.ts` 등)에는 도메인/라우트가 드러나는 이름을 쓰지 않는다 — 이름이 도메인에 종속되면 재사용 가능 범위를 파일명만으로 오판하게 된다(예: `postsFormatter.ts` 금지).

## Gotchas

- 지금 `src/proxy.ts`의 matcher는 `/api/*`를 포함하지 않는다 — Route Handler(`src/app/api/`)는 Proxy 보호 대상이 아니며, 각 route.ts가 Bearer 토큰 검사를 개별적으로 반복 중이다(현재로선 이게 유일한 방어선).
- Server Function(Server Action)은 별도 라우트가 아니라 호출된 페이지로 가는 POST 요청이다 — matcher가 그 경로를 제외하면 Proxy가 조용히 건너뛰어, Proxy가 막아준다고 착각하기 쉽다.
- Next.js 16에서 Proxy 기본 런타임은 Node.js다(과거 Edge 런타임 기본에서 변경) — Proxy 파일에 `runtime` config 옵션을 쓰면 에러가 난다.
