# docs/ERROR_HANDLING.md

> Last updated: 2026-07-28
> `src/CLAUDE.md`에서 분리됨. 여러 레이어(services/actions/route/client)에 걸친 공통 규칙 — 레이어별 세부 규칙은 아래 index 참고.

## 흐름 (placeholder — 함수/클래스 이름은 마이그레이션 착수 시 코드에서 정해진다)

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

## 채널 분리 규칙

`docs/DATA_ACCESS.md`와 짝을 이루는 3개 채널로 나눈다: **A** Server Action, **B** Route Handler(route.ts), **C** 클라이언트 `useSWR`(폼은 `useActionState`로 채널 A 결과를 받는다).

- A/B는 리턴 형태가 근본적으로 다르다(함수 리턴값 vs HTTP Response) — 서버 쪽 에러 처리(캐치·로깅·민감분류 message 일반화)는 채널별로 각자 만든다, 하나로 묶지 않는다. 단 `분류→안전문구`·`분류→HTTP status` 같은 lookup map은 양쪽이 공유한다 — 로직이 아니라 데이터라 공유해도 채널 분리 위반이 아니다.
- 클라이언트(채널 A 결과/채널 C 에러)는 실패를 "해석"하지 않는다 — 서버가 준 `ErrorPayload`를 그대로 렌더한다(`useActionState` state, `useSWR` `error`). "이 message를 원문으로 보여줘도 되나"를 클라이언트가 판단하지 않는다, 그 안전화는 서버 경계(A/B 핸들러)에서 이미 끝냈다. B는 소비자가 아니라 생산자라 이 렌더 대상이 아니다.

## 에러 표현 규칙

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

## 레이어별 규칙 위치 (index)

| 채널/레이어 | 목적(요약) | 규칙 위치 |
|---|---|---|
| services | `AppError` throw / `null` 리턴 — 구조화된 에러 원본 생산, HTTP 모름 | `src/server/services/CLAUDE.md` |
| Server Action(채널 A) | `AppError` 캐치 → 로깅 + 민감분류 일반화 + `ErrorPayload` 리턴 | `src/server/actions/CLAUDE.md` |
| route.ts(채널 B) | `AppError` 캐치 → 로깅 + 민감분류 일반화 + 분류→status 매핑 + Response 번역, `Response`/`NextResponse` 기준 | `src/server/CLAUDE.md` |
| 에러 타입 정의 | `AppError`/분류 taxonomy/`ErrorPayload` — 여러 레이어 공유 계약 | `src/shared/types/CLAUDE.md` |
| 클라이언트 소비(채널 C) | `useSWR` `error` 렌더 + `useActionState` state 렌더 — 서버가 준 `ErrorPayload` 그대로, 판단 로직 없음 | `src/client/CLAUDE.md` |
