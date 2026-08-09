# docs/ERROR_HANDLING.md

> Last updated: 2026-07-29
> `src/CLAUDE.md`에서 분리됨. 여러 레이어(services/actions/route/client)에 걸친 공통 규칙 + 채널별(A/B/C) 상세 규칙까지 이 문서가 단일 소스다 — 레이어별 CLAUDE.md는 더 이상 상세 규칙을 중복 서술하지 않고 이 문서를 가리키기만 한다.

## 흐름

```
services (AppError throw / null 리턴)
   ↓
toErrorPayload(e, logPrefix)  — src/server/boundary.ts, A/B 공용
(캐치 + 로깅 + 민감분류 message 일반화 + ErrorPayload 리턴)
   ↓                                              ↓
actionError(e)                                routeSuccess(data) / routeError(e)
{success:false, error: ErrorPayload}          분류→HTTP status 매핑 + Response 번역
   ↓                                          Response(status=매핑된 status, body=ErrorPayload)
   └────────── 셋 다 src/server/boundary.ts (A/B 공용 파일) 안에 같이 있다 ──────────┘
                     client (useActionState / useSWR)
        서버가 준 ErrorPayload를 그대로 렌더 — fieldErrors→input, message→전역 알림.
        (클라이언트는 "원문 노출 안전한가"를 판단하지 않는다 — 서버가 이미 일반화해서 보냈다)

ErrorPayload = { 분류, message, fieldErrors? }
```

## 채널 분리 규칙

`docs/DATA_ACCESS.md`와 짝을 이루는 3개 채널로 나눈다: **A** Server Action, **B** Route Handler(route.ts), **C** 클라이언트 `useSWR`(폼은 `useActionState`로 채널 A 결과를 받는다).

- A/B는 **최종 리턴 타입**이 근본적으로 다르다(함수 리턴값 vs HTTP Response) — 이건 Next.js 공식 제약(Server Function은 직렬화 가능한 값을, Route Handler는 `Response`를 리턴해야 함)이라 협상 불가. 이 최종 wrapping은 채널별로 다른 **함수**(`actionError`/`routeError`)로 분리한다.
- 단 이 제약은 "함수는 분리"를 요구할 뿐 "파일도 분리"를 요구하지 않는다 — Next.js 공식 문서 어디에도 이 내부 로직(변환이든 최종 wrapping이든)을 파일 단위로 채널별 분리하라는 규정은 없다(`node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md`, `15-route-handlers.md` 확인 완료). 그래서 `routeSuccess`/`routeError`/`actionError`/`toErrorPayload`는 전부 `src/server/boundary.ts` 한 파일에 같이 둔다. 과거엔 이 문서가 "채널별로 각자 만든다, 하나로 묶지 않는다"며 파일 단위 분리까지 요구했고, 그 다음엔 성공/실패-wrapping/실패-변환을 `response.ts`/`errorHandlers.ts`/`errorPayload.ts` 3파일로 나눴었다 — 둘 다 프로젝트 자체 판단이었지 프레임워크 요구사항은 아니었다. 최종적으로 코드량(총 ~65줄) 대비 과분할이라 판단해 `boundary.ts` 하나로 합쳤다.
- `분류→안전문구`·`분류→HTTP status` 같은 lookup map도 여전히 양쪽이 공유한다 — 로직이 아니라 데이터라 공유해도 채널 분리 위반이 아니다.
- 클라이언트(채널 A 결과/채널 C 에러)는 실패를 "해석"하지 않는다 — 서버가 준 `ErrorPayload`를 그대로 렌더한다(`useActionState` state, `useSWR` `error`). "이 message를 원문으로 보여줘도 되나"를 클라이언트가 판단하지 않는다, 그 안전화는 서버 경계(A/B 핸들러)에서 이미 끝냈다. B는 소비자가 아니라 생산자라 이 렌더 대상이 아니다.

## 에러 표현 규칙

- services가 던지는 에러는 `AppError` 하나로 통일한다 — HTTP status를 들고 다니는 에러 타입(`HTTPError` 등)을 만들지 않는다. `AppError`는 앱 고유 분류만 담고 HTTP status는 모른다(HTTP는 route.ts만의 관심사). HTTP status로의 번역은 route.ts 경계에서만 일어난다.
- 이 분류 taxonomy는 services 전용 어휘가 아니다 — Server Action 자체의 zod 검증(VALIDATION)도 services를 안 거치지만 같은 분류를 공유한다.
- 분류→HTTP status 매핑은 그 분류 정의 자체에 박아넣지 않는다 — 같은 이유로, 매핑표(`ERROR_STATUS_MAP`)는 route.ts 쪽 코드(`src/server/boundary.ts`)에 별도로 둔다.
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

## 채널 A — Server Action (`src/server/actions/`)

- 리턴 형태를 공식 문서가 지정하지 않는다 — 공식 문서(`server-actions.md`): "Constrain return values. Action returns are serialized to the client. Shape them to what the UI renders, not raw database records." `{success, error}` envelope은 프로젝트 컨벤션이지 Next.js 요구사항이 아니다.
- 핵심 로직(액션 본문) 안에서 try/catch나 로깅을 직접 하지 않는다 — services가 던진 `AppError`를 캐치하고, 로깅하고, 리턴값(`{ success:false, error: ErrorPayload }`)으로 번역하는 건 `src/server/boundary.ts`의 `actionError`가 전담한다. 핵심 로직은 그냥 throw만 한다.
- 민감 분류(INTERNAL/EXTERNAL_SERVICE)의 `message`를 일반 문구로 바꾸는 것과 로깅은 `actionError`가 내부적으로 호출하는 `toErrorPayload`가 담당한다(`routeError`와 공유하는 A/B 공용 함수) — 원문은 로그에만 남긴다. 클라이언트는 받은 `message`를 그대로 렌더하므로 여기서 안 가리면 원문이 브라우저까지 샌다.
- 로깅은 `toErrorPayload` 안에서만 한다 — 액션마다 각자 `console.error`를 찍지 않는다, 나중에 외부 에러추적 서비스를 붙여도 이 지점만 고치면 되게 한다.
- 최종 wrapping 함수(`actionError`가 `{success:false, error}`로 감싸는 부분)는 route.ts용 `routeError`와는 다른 함수로 둔다 — 리턴 타입이 근본적으로 다르다(함수 리턴값 vs HTTP Response, Next.js 공식 제약). 단 파일은 위 "채널 분리 규칙"대로 공유한다.
- 서비스 레이어가 던지는 에러를 `actionError`가 캐치해서 리턴값으로 번역하는 것은, 액션 "자신의" 검증 실패를 throw하는 게 아니라 더 아래 레이어에서 이미 일어난 예외를 리턴값으로 번역하는 것이라 "예상 가능한 실패는 리턴값으로 모델링한다" 규칙과 상충하지 않는다.

## 채널 B — route.ts (`src/app/api/**/route.ts`)

- **기본 규칙**: 네이티브 `Response`를 쓴다 — 공식 문서(`route-handlers.md`): `return Response.json({ data })`.
- **예외 규칙**: `NextResponse`는 `.cookies`(`get`/`set`/`has`/`delete`), `.redirect()`, `.rewrite()` 중 하나가 실제로 필요할 때만 쓴다 — 공식 문서(`next-response.md`): "NextResponse extends the Web Response API with additional convenience methods." 이 세 가지가 그 "추가 편의 메서드"의 전부다.
- route.ts 핵심 로직 안에서 try/catch나 로깅을 직접 하지 않는다 — services가 던진 `AppError`를 캐치하고, 로깅하고, `Response`로 번역(분류→HTTP status 매핑 + body에 `ErrorPayload` 실기)하는 건 `src/server/boundary.ts`의 `routeError`가 전담한다. 핵심 로직은 그냥 throw만 한다.
- 민감 분류(INTERNAL/EXTERNAL_SERVICE)의 `message`를 일반 문구로 바꾸는 것과 로깅은 `toErrorPayload`가 담당한다(A/B 공용) — `routeError`는 그 결과를 받아 `분류→HTTP status` 매핑 후 `Response`로 wrapping만 한다.
- 분류→HTTP status 매핑표(`ERROR_STATUS_MAP`)는 `boundary.ts` 쪽에 둔다 — 에러 타입 정의(`src/shared/types/error.ts`) 안에는 안 둔다(services는 HTTP를 몰라야 한다는 원칙과 같은 이유).
- 최종 wrapping 함수(`routeError`)는 리턴 타입이 근본적으로 다르다(HTTP Response vs 함수 리턴값, Next.js 공식 제약)는 이유로 `actionError`와는 다른 함수로 둔다. 단 파일은 위 "채널 분리 규칙"대로 공유한다.

## 채널 C — 클라이언트 소비 (`src/client/`)

- **`useSWR`**: 응답 형태(`{data, error, isLoading}`)와 사용 패턴 자체가 공식 문서에 있다 — 공식 문서(`fetching-data.md`) 예제: `const { data, error, isLoading } = useSWR(...)`, `if (error) return <div>Error: {error.message}</div>`. `error`를 꺼내 렌더하는 것까지 공식 예제 패턴이다 — 리턴받고도 소비처가 렌더에 안 쓰면 그 패턴 위반이다.
- **폼 mutation 결과(채널 A)**: `useActionState`의 state로 받아 그대로 렌더한다 — `state`가 실은 `ErrorPayload`이므로 `fieldErrors`는 input 밑에, `message`는 전역 알림에.
- `fetcher`가 던진 에러든 action이 리턴한 `ErrorPayload`든, 클라이언트는 "필드냐/메시지냐/무반응이냐"를 **판단하지 않는다** — 서버가 이미 표시-안전한 `ErrorPayload`(민감 분류는 일반화, 필드 에러는 fieldErrors에)를 보냈으므로 컴포넌트는 그 shape을 그대로 렌더할 뿐이다.

## 레이어별 규칙 위치 (index)

| 채널/레이어 | 목적(요약) | 상세 규칙 |
|---|---|---|
| services | `AppError` throw / `null` 리턴 — 구조화된 에러 원본 생산, HTTP 모름 | `src/server/services/CLAUDE.md` |
| Server Action(채널 A) | `AppError` 캐치 → 로깅 + 민감분류 일반화 + `ErrorPayload` 리턴 | 이 문서 §채널 A |
| route.ts(채널 B) | `AppError` 캐치 → 로깅 + 민감분류 일반화 + 분류→status 매핑 + Response 번역 | 이 문서 §채널 B |
| 에러 타입 정의 | `AppError`/분류 taxonomy/`ErrorPayload` — 여러 레이어 공유 계약 | `src/shared/types/CLAUDE.md` |
| 클라이언트 소비(채널 C) | `useSWR` `error` 렌더 + `useActionState` state 렌더 — 서버가 준 `ErrorPayload` 그대로, 판단 로직 없음 | 이 문서 §채널 C |
