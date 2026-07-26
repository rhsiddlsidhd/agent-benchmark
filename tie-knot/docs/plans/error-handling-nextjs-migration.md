# Next.js 16.2 에러 핸들링 마이그레이션 — Phase 플랜

> 이 문서는 다른 세션이 이어서 작업할 수 있도록 만든 작업 단위 기록이다. 완료된 Phase는 체크하고, 세션 종료 시 진행 상황/막힌 지점을 이 파일에 남긴다.
> 배경: `AGENTS.md` 경고대로 이 리포의 Next.js는 훈련데이터와 다른 버전(16.2.10) — API는 `node_modules/next/dist/docs/`가 원본이다.

## 전제 (이미 확인된 사실)

- `node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md`, `.../file-conventions/error.md`, `.../functions/catchError.md` 3개가 이 버전의 에러 핸들링 공식문서.
- services/actions/route/client 레이어 간 에러 흐름·분류 계약(`docs/ERROR_HANDLING.md`는 삭제됨)은 이번 세션 그릴링으로 **설계 확정 + 각 `CLAUDE.md` 반영 완료**됐다 — 그 규칙에서 파생되는 코드 마이그레이션을 아래 **트랙 B**로 추가했다(전체 그림은 `src/CLAUDE.md` "에러 핸들링"). 원래 이 문서가 다루던 React 렌더링 에러 경계(error.tsx 계열)+client GET 페칭은 **트랙 A**(Phase 1~3)다. 두 트랙은 서로 독립이라 병행 가능하다.
- `error.tsx` 3개 존재: `src/app/(main)/error.tsx`, `(main)/(products)/error.tsx`, `(main)/(admin)/error.tsx` — 전부 route-group 단위, `reset` prop 사용 중(구버전 시그니처).
- `global-error.tsx`는 프로젝트에 없음.
- `notFound()` 이미 3곳(`products/page.tsx`, `products/[id]/page.tsx`, `preview/[id]/page.tsx`)에서 사용 중 — services의 null 리턴 계약과 맞물려 있어 이 부분은 손댈 거 없음.
- client GET 페칭: 7개 훅(`useBanks`/`useAuth`/`useProducts`/`useFetchCoupleInfo`/`usePremiumFeatures`/`useSubwayLineInfo`/`useSubwayStations`)은 `useSWR`+`fetcher` 표준 경로. `useNavigationGeo.ts`/`KakaoMap.tsx` 2곳은 `/api/kakaomap`을 raw `fetch()` + `useEffect`로 직접 호출 — `src/client/CLAUDE.md`의 "fetcher/apiRequest 밖 직접 fetch 금지" 위반 상태, 두 파일이 같은 엔드포인트를 중복 호출 중.
- `src/app/api/kakaomap/route.ts`는 이미 `apiOk`/`apiFail`(`response.ts` envelope) 사용 — `fetcher` 그대로 붙일 수 있음, route 쪽 변경 불필요.

---

# 트랙 A — React 렌더링 에러 경계 + client GET 페칭

## Phase 1 — `global-error.tsx` 추가

**상태: 문서화 완료, 코드 미착수**

- [x] `src/app/CLAUDE.md`에 `## global-error.tsx` 독립 섹션 추가(규칙 + 제약 표: Provider 소멸/CSS 재import/metadata 미지원).
- [ ] `src/app/global-error.tsx` 구현.
  - `'use client'`, 자체 `<html>`/`<body>`.
  - `organisms/ErrorFallback.tsx` 재사용(atoms만 조합, provider 의존 없어서 안전).
  - `globals.css` 별도 import 필수(root layout이 담당하던 게 같이 대체됨).
  - `metadata`/`generateMetadata` export 안 함(Client Component라 미지원).
  - prop 시그니처는 Phase 2 결정에 따라감 — Phase 2 먼저 정하고 처음부터 `unstable_retry`로 만들 것(구버전 `reset`으로 만들었다가 또 고치지 않기 위해).

## Phase 2 — `reset()` → `unstable_retry()` 마이그레이션

**상태: 결정 완료, 코드 미착수**

**결정: 마이그레이션한다.**
- 이유: `reset()`은 재fetch를 안 함 — Server Component가 던진 에러는 `reset()`으로 복구 안 됨(공식문서 명시). 이 프로젝트 대부분 페이지가 Server Component 데이터페칭이라, "다시 시도" 버튼이 실제로 안 고쳐주는 케이스가 있을 수 있는 기능 결함 리스크(스타일 문제 아님).

**결정: `organisms/ErrorFallback.tsx`의 `reset` prop을 `retry`로 리네임한다.**
- 이유: `reset={unstable_retry}`처럼 이름만 어긋나게 넘기면 나중에 읽는 사람이 "그냥 상태 초기화"로 착각함. 버튼 라벨이 이미 "다시 시도"라 `retry`가 실제 동작과 맞고, 이 리포 컨벤션(`src/CLAUDE.md`)이 이름-의미 일치에 엄격한 결과와도 맞음.

**작업 대상**: `(main)/error.tsx`, `(main)/(products)/error.tsx`, `(main)/(admin)/error.tsx`, `organisms/ErrorFallback.tsx`(prop 리네임), 신규 `global-error.tsx`(Phase 1) — 전부 이 시그니처로.

## Phase 3 — Client GET 페칭 컨벤션 위반 정리 (`kakaomap`)

**상태: 방향 합의, 세부 Phase 미착수**

### Phase 3-1 — `useNavigationGeo.ts`: raw fetch → `useSWR`+`fetcher` 전환

- route(`src/app/api/kakaomap/route.ts`)는 이미 `apiOk`/`apiFail` envelope라 route 쪽 변경 불필요 — client 쪽 호출 방식만 표준 경로로 전향.
- `useSubwayLineInfo.ts` 패턴 그대로:
  ```ts
  const swrKey = address ? `/api/kakaomap?address=${address}` : null;
  const { data, error } = useSWR(swrKey, (url) => fetcher<KakaomapResponse>(url));
  ```
- 기존 `try/catch` + `console.error` 에러 처리를 SWR의 `error` 반환값 기반으로 재구성.

### Phase 3-2 — `KakaoMap.tsx`: 중복 호출 제거

- 지금 `KakaoMap.tsx`가 자체 `useEffect`로 `/api/kakaomap`을 또 호출 중(`useNavigationGeo.ts`와 별개 중복).
- Phase 3-1 완료 후, `KakaoMap.tsx`가 자체 fetch 로직을 버리고 `useNavigationGeo` 훅을 호출하는 구조로 리팩터 — Phase 3-1 선행 필수(순서 있음).

### Phase 3-3 — `navigator.geolocation` 부분 회귀 확인

- `useNavigationGeo.ts`의 `current`(브라우저 geolocation) 쪽은 이번 마이그레이션 대상 아님 — `useState`+`useEffect` 그대로 유지.
- Phase 3-1/3-2 리팩터 후 이 부분이 실수로 같이 안 건드려졌는지만 확인.

---

# 트랙 B — 레이어 에러 계약 코드 마이그레이션

**규칙 확정 완료(이번 세션 그릴링), 각 `CLAUDE.md` 반영 완료, 코드 미착수.** 설계 근거·전체 그림은 `src/CLAUDE.md` "에러 핸들링". 아래는 그 규칙을 코드로 옮기는 작업 단위.

확정된 7개 결정:
1. 클라이언트-facing 에러는 단일 `ErrorPayload { 분류, message, fieldErrors? }` — 채널 A 리턴(`{ success:false, error: ErrorPayload }`)·채널 B body가 공유.
2. 민감분류(INTERNAL/EXTERNAL_SERVICE) message 일반화는 **서버 공용 핸들러**에서(원문은 로그만) — 클라에서 가리면 이미 네트워크로 노출됨. `분류→안전문구` lookup map을 A/B가 공유.
3. 클라이언트 field/message/silent 판단로직 **제거** — 폼은 `useActionState` state, GET은 `useSWR` error 직접 렌더. 서버 핸들러는 유지.
4. `requireAuth` → `AppError(UNAUTHENTICATED)` throw, `HTTPError` **제거**.
5. 조회형 `null`=미존재만 — DB 인프라 에러는 `AppError(INTERNAL)` throw(삼켜서 오분류 금지).
6. `apiRequest`·채널 D·데이터접근표 row4 **삭제** — 브라우저 mutation 전부 Server Action.
7. `DISABLED` HTTP status `501 → 503`.

> **B1 실행 중 발견한 스코프 갭(2026-07-26)**: `HTTPError` 참조 파일이 26개 — B2~B5가 이름으로 명시한 범위보다 훨씬 넓음. 특히 `src/server/lib/jose/decrypt.ts`, `src/server/lib/cloudinary/upload.ts`(어느 B에도 안 적혀 있었음), route.ts 자체 검증 throw(services 안 거치는 것들: `guestbook`, `subway/[station]`, `couple-info`, `products/[id]/like`, `upload/signature`, `auth/entry`), action 9개의 `if (e instanceof HTTPError)` catch 블록, `page.tsx` 2개(`couple-info`, `order/edit`)까지 전부 전환 대상. **결정: `HTTPError`는 B1에서 삭제하지 않고 `AppError`와 병행 — 모든 참조가 사라진 뒤 별도 마무리 단계(B6)에서 삭제.** 이유: 26개 파일을 한 커밋에 다 바꾸지 않는 한 Phase별 독립 브랜치가 컴파일 안 되는 상태로 쪼개져야 함 — 기존 "Phase당 독립 브랜치+PR" 전략과 충돌하기 때문.

## Phase B1 — 에러 타입/계약 정의 (`src/shared/types/error.ts`)

**상태: 완료.**

- [x] `AppError`(앱 고유 분류만, HTTP status 모름) 정의 — `ERROR_CATEGORIES`/`ErrorCategory`/`ErrorPayload` 포함. `HTTPError`는 삭제하지 않고 유지(위 스코프 갭 참고, B6에서 삭제).
- 타입체크 통과 확인(`npx tsc --noEmit`, 에러 0건) — 기존 코드 변경 없음, 순수 추가라 회귀 리스크 없음.

## Phase B2 — 서버 공용 핸들러 (채널 A/B)

**상태: 완료.**

- [x] 채널 A 핸들러: `src/server/actions/handleActionError.ts` 신설 — `AppError` 캐치 → 로깅 + 민감분류 일반화 + `ErrorPayload` 리턴. 15개 action 파일 전부(`createCoupleInfo`/`createGuestbook`/`createOrder`/`createPremiumFeature`/`createProduct`/`deleteGuestbook`/`deleteProduct`/`findUserEmail`/`loginUser`/`requestPasswordReset`/`signupUser`/`updateCoupleInfo`/`updatePremiumFeature`/`updateProduct`/`updateProductStatus`/`updateUserPassword`)가 이 핸들러로 통일 — 원래 스코프였던 9개 외에, 겉으로 `HTTPError`를 안 썼지만 zod 검증 실패를 `code` 리터럴로 직접 리턴하던 6개(`createGuestbook`/`createPremiumFeature`/`deleteGuestbook`/`loginUser`/`requestPasswordReset`/`signupUser`)도 wire 타입 변경으로 같이 걸림(아래 스코프 갭 참고).
- [x] 채널 B 핸들러(`response.ts`): `AppError` 캐치 → 로깅 + 민감분류 일반화 + `ERROR_STATUS_MAP`(분류→HTTP status) 매핑 + body에 `ErrorPayload`.
- [x] `분류→안전문구`(`ERROR_SAFE_MESSAGES`, `src/shared/constants/error.ts`) lookup map을 A/B가 공유. `분류→HTTP status`는 설계대로 `response.ts` 전용(채널 A는 HTTP 모름).
- [x] `order/create/route.ts:48`의 `throw new HTTPError(..., 501)` → `AppError("DISABLED", ...)`(매핑표에서 503).
- [x] route.ts 자체 검증 `HTTPError` throw 전환: `guestbook`, `subway/[station]`, `couple-info`, `products/[id]/like`, `upload/signature`, `auth/entry`. **(추가 발견)** `payment/complete`, `kakaomap`도 같은 패턴이라 같이 전환(원래 스코프 노트에 이름이 빠져있었음) — `kakaomap`은 외부 API의 원본 status를 그대로 전달하던 걸 `EXTERNAL_SERVICE`(고정 502)로 정규화, Kakao가 준 원본 status는 더 이상 그대로 노출 안 됨(의도된 정규화).
- [x] `page.tsx` 2개(`couple-info`, `order/edit`) 렌더링 시점 `HTTPError` throw → `AppError`.

> **B2 실행 중 발견한 스코프 갭 2건(2026-07-26)**:
> 1. **wire 타입 변경 범위**: `ErrorResponse.error`를 `{message,code,fieldErrors?}` → `ErrorPayload{category,...}`로 바꾸는 순간, `code` 리터럴을 쓰는 모든 곳이 즉시 타입에러 — action 15개 전부(원래 짐작한 9개보다 많음, HTTPError 안 쓰던 6개도 포함), `fetcher.ts`/`apiRequest.ts`(`body.error.code`로 `HTTPError` 생성), `handleClientError`(`switch(error.code)`)까지. **결정: 전부 이번 B2에서 같이 전환**(원래 B4/B5로 미뤄뒀던 `fetcher`/`apiRequest`/`handleClientError` 부분) — `src/client/CLAUDE.md`가 이미 fetcher 목표 상태로 "ErrorPayload로 정규화해서 throw"를 명시하고 있어서, 두 번 건드리는 것보다 한 번에 맞추는 게 나음(사용자 확인 받은 결정, 옵션 A).
> 2. **`signupUser`의 409 Conflict**: 7개 분류 taxonomy엔 Conflict가 없음 — "이미 존재하는 이메일" 케이스를 `VALIDATION`(400)으로 재분류(원래 409→400, 사소한 status 변경).
> 3. **`updateUserPassword`가 의존하던 `decrypt.ts`(JWT 만료)**: 원래 B3 스코프였지만, catch 블록을 공용 핸들러로 통일하면서 `decrypt`가 여전히 `HTTPError("ERR_JWT_EXPIRED", 401)`(비유저용 원문)를 던지면 그대로 클라에 노출되는 회귀가 생겨 이 파일만 먼저 전환(`AppError("UNAUTHENTICATED", "유효하지 않거나 만료된 토큰입니다. 다시 로그인해주세요.")`) — B3 남은 범위에서 이 파일은 빠짐.
> 4. **`fetcher`/`apiRequest`는 이제 `ErrorPayload`를 그대로 `throw`한다**(Error 인스턴스 아님, 위 결정 1 참고) — `useSWR`의 `error`/각 호출자의 `catch(e)`가 받는 게 plain `ErrorPayload` 객체.
> 타입체크(`npx tsc --noEmit`) 전체 통과 확인. `npx vitest run`은 이 세션 환경 자체의 `@rolldown/binding-linux-x64-gnu` 네이티브 바인딩 누락으로 실행 불가(내 변경과 무관한 사전 존재 이슈) — 실제 테스트 실행 검증은 못 함.

## Phase B3 — services 계층 정리

**상태: 완료.** `decrypt.ts`는 B2에서 먼저 전환됨(위 스코프 갭 3번 참고), 아래 범위에서 제외.

- [x] `requireAuth`: `HTTPError(401)` → `AppError("UNAUTHENTICATED")`.
- [x] 조회형(`getUser`/`getAuth`): 미존재만 `null` — 이미 이 계약을 지키고 있어 코드 변경 없음. DB 인프라 예외를 삼키는 `catch`는 없었다(`getAuth`의 `catch`는 토큰 검증 실패 폴백 전용).
- [x] 나머지 services 파일의 `HTTPError` throw 전체 `AppError`로 전환:
  - `user.service`: `getUserEmail`/`getUserById` 미존재 → `NOT_FOUND`(기존 404 유지).
  - `subway.service`: 서울 열린데이터 API 실패 → `EXTERNAL_SERVICE`(기존 502 유지).
  - `payment.service`: 주문 미존재 → `NOT_FOUND`(404 유지), 결제 검증 실패 → `VALIDATION`(400 유지), `mapPortOneStatus` 미지원 상태 2건 + `PortOneError` → `EXTERNAL_SERVICE`.
- [x] **(스코프 확장)** `src/server/lib/cloudinary/upload.ts`: Cloudinary 업로드 실패 2건 → `EXTERNAL_SERVICE`, 자체 서명 API(`/api/upload/signature`) 실패 → `INTERNAL`. `src/server/lib/jose/decrypt.ts`는 이미 B2에서 전환 완료.
- 타입체크(`npx tsc --noEmit`) 통과, `npx vitest run` 통과(3파일 20테스트) — B2에서 못 돌렸던 테스트 실행이 이번엔 됐다(아래 검증 환경 이슈 참고). `grep -rn "HTTPError" src` 결과 **throw 사이트 0건** — 남은 참조는 A/B 공용 핸들러의 레거시 catch 분기와 클래스 정의뿐(전부 B6 소관).

> **B3 실행 중 발견한 스코프 갭(2026-07-26)**:
> 1. **status 변경 3건**: `payment.service`가 외부 원인 에러를 400으로 내보내던 걸 `EXTERNAL_SERVICE`(502)로 재분류했다 — `mapPortOneStatus`가 보는 status와 `PortOneError`는 전부 PortOne 응답에서 오는 값이라, 클라이언트 입력 잘못을 뜻하는 400이 애초에 오분류였다. `cloudinary` 업로드 실패도 500 → 502. 셋 다 `EXTERNAL_SERVICE`라 원문 message는 로그만 남고 클라엔 안전문구가 나간다.
> 2. **`mapPortOneStatus`의 `console.error` 2줄 제거**: 공용 핸들러가 같은 내용을 이미 로깅하는데 원문 message가 `AppError`로 옮겨가면서 중복이 됐다. 대신 원문에만 있던 정보(`typeof status`)를 `AppError` message에 합쳤다.
> 3. **B6 선행조건 앞당겨짐**: 원래 "B2~B5 전부 완료 후"였지만, B4(`apiRequest` 삭제)·B5(클라 판단로직 제거)는 `HTTPError`를 더 이상 참조하지 않는다(B2에서 이미 정리됨). B3이 끝난 지금 참조가 레거시 catch 분기 2곳+정의뿐이라 **B6은 B4/B5와 무관하게 바로 착수 가능**하다.

## Phase B4 — `apiRequest` 삭제 + 호출자 Server Action 이관

**상태: 완료.**

- [x] 4개 Server Action 신설(`src/server/actions/`): `issueEntryToken`(entry 토큰, `useEntry`가 호출), `completePayment`(결제 검증, `usePortOnePayment`가 호출), `toggleProductLike`(좋아요 토글, `ProductLikeBadge`가 호출), `clearUserEmailCookie`(로그아웃 정리용 쿠키 삭제, change-pw `UpdatePasswordForm` 컨테이너가 호출). 전부 `handleActionError` 공용 핸들러 사용(`clearUserEmailCookie`는 리턴값이 없는 단순 정리 작업이라 대상 아님).
- [x] 4개 호출자 전환 + `src/CLAUDE.md` 데이터접근표 규칙대로 폼 밖 이벤트 핸들러(`useEntry`/`ProductLikeBadge`)는 `useTransition`으로 감싸 호출.
- [x] `apiRequest.ts` 삭제.
- [x] **(스코프 확장, 사용자 확인 받음)** 호출자가 사라져 고아가 된 route.ts 4개(`auth/entry`, `auth/cookie`, `products/[id]/like`, `payment/complete`)도 함께 삭제 — `payment/complete`는 PortOne 웹훅용으로 남을 가능성이 문서에 있었지만 실제 웹훅 구현이 코드에 전혀 없어 지금은 정리, 필요해지면 그때 새로 만들기로 결정. 빈 디렉토리(`products/[id]/`, `payment/`)도 같이 제거.
- [x] `src/app/api/CLAUDE.md`(Structure 트리, requireAuth 패턴 예시 목록), `src/client/CLAUDE.md`(apiRequest 제거 완료로 문구 갱신) 갱신.

> **B4 실행 중 발견한 스코프 갭(2026-07-26)**:
> 1. **TDD 게이트 최초 적용**: 직전 커밋(`4cc1903`)에서 fail-closed로 강화된 TDD 훅이 이번이 첫 실전 적용 대상이었다 — services/actions 테스트가 이 repo에 0개였고 hooks/route 컨테이너(`_components`) 테스트 컨벤션도 `TESTING_GUIDELINE.md`에 "아직 미작성"으로 명시돼 있었다. **사용자 확인 받고 이번에 처음 확립**: actions 테스트는 직접 협력자(`@/server/services`, `@/server/lib/jose`, `@/server/lib/cookies`)를 배럴 경로로 `vi.mock`하고 리턴값을 검증(서비스 자체의 DB 통합 테스트는 services 레이어 소관, actions는 그 위 얇은 오케스트레이션만 검증) — hooks는 `renderHook`(`@testing-library/react`), route 컨테이너는 일반 컴포넌트 테스트(`render`)로 작성. 8개 신규 테스트 파일(`issueEntryToken`/`completePayment`/`toggleProductLike`/`clearUserEmailCookie`.test.ts + `useEntry`/`usePortOnePayment`.test.ts + `ProductLikeBadge`/`UpdatePasswordForm`(change-pw).test.tsx), 41개 테스트, 전부 통과.
> 2. **`strict:false`에서 discriminated union narrowing 함정**: `if (!result.success)`(또는 `if (result.success) {...} else {...}`)는 이 프로젝트 tsconfig(`strict:false`)에서 `APIResponse<T>`(`success:true|false` 리터럴 판별) narrowing이 안 된다 — `result.success === false`로 명시 비교해야 `result.error` 접근이 타입체크를 통과한다. 기존 코드(`UpdatePasswordForm.tsx`의 `state.success === true`)가 이미 이 패턴을 쓰고 있었는데 그 이유를 몰랐다가 이번에 원인을 확인했다 — `APIResponse`를 다루는 클라이언트 코드는 앞으로 전부 `=== true`/`=== false` 명시 비교로 짓는다(`!x.success`/암묵적 truthy 금지).
> 3. **`syncPayment`/`payment.service.ts`는 여전히 테스트 0개**: B3이 "완료"로 기록됐지만 실제로는 이 서비스 자체의 DB 통합 테스트가 작성된 적이 없다(TDD 게이트가 그때는 느슨했다) — `completePayment` 액션 테스트는 `syncPayment`를 배럴 mock으로 대체했으므로 이 갭을 못 채운다. 후속 세션이 services 테스트 커버리지를 넓힐 때 `payment.service.ts`(PortOne SDK mock + Order/Product factory 필요)를 우선순위에 넣을 것.
> 타입체크(`npx tsc --noEmit`)·lint(`npx eslint .`)·전체 테스트(`npx vitest run --coverage`, 11 파일 41 테스트, 전 파일 line coverage 80%+)·`npm run build` 전부 통과 확인.

## Phase B5 — 클라이언트 판단로직 제거

**상태: 완료.**

- [x] `ProductLikeBadge`/`useEntry`는 B4에서 이미 처리 완료 — 남은 호출자는 `usePremiumFeatures.ts` 하나뿐이었다.
- [x] `usePremiumFeature`의 `handleClientError` 판단 분기 삭제 — `useSWR`이 준 `error`(`ErrorPayload`)의 `message`를 그대로 `toast.error(error.message)`로 렌더(서버가 이미 표시-안전하게 만든 message라 클라 판단 불필요).
- [x] `src/shared/utils/error.ts`에서 `handleClientError` + `ClientFieldErrors`/`ClientMessageError` 타입 삭제. **단, `getFieldError`/`hasFieldErrors`는 유지** — 서버가 채워준 `fieldErrors`를 그대로 읽기만 할 뿐 "무엇을 보여줄지" 판단하지 않아서 제거 대상이 아니었다(`src/shared/utils/CLAUDE.md`의 "파일째 삭제" 서술이 이 둘의 존재를 놓치고 있었던 부정확한 기록이라 정정).
- [x] `src/shared/utils/CLAUDE.md` Gotchas 정정.

> **B5 실행 중 발견한 스코프 갭(2026-07-26)**: `src/shared/utils/CLAUDE.md`가 "`utils/error.ts`는 마이그레이션에서 파일째 삭제"라고 적어뒀었는데, 실제로는 그 파일에 `getFieldError`/`hasFieldErrors`(폼 다수가 여전히 쓰는, 제거 대상이 아닌 유틸)가 같이 들어있어 파일 전체 삭제는 불가능했다 — `handleClientError`와 그 전용 타입 2개만 제거하고 파일은 남겼다. 문서를 실제 코드와 맞게 정정.
> `usePremiumFeatures.ts`도 TDD 게이트 대상이라 `usePremiumFeatures.test.ts`(swr 배럴 mock, `renderHook`)를 먼저 작성 — `src/shared/utils/error.ts`도 마찬가지로 `error.test.ts`(`getFieldError`/`hasFieldErrors` 케이스) 선작성.
> 타입체크·lint·전체 테스트(`npx vitest run --coverage`, 13 파일 51 테스트, 전 파일 line coverage 80%+)·`npm run build` 전부 통과 확인.

## Phase B6 — `HTTPError` 최종 삭제

**상태: 완료.** (B3 완료로 선행조건이 앞당겨져 B4/B5보다 먼저 착수 — B3 스코프 갭 3번 참고.)

- [x] `src/shared/types/error.ts`에서 `HTTPError` 클래스 삭제.
- [x] `src/server/response.ts`: 재export 목록·import에서 `HTTPError` 제거 + `apiFail`의 레거시 catch 분기 삭제.
- [x] `src/server/actions/handleActionError.ts`: import + 레거시 catch 분기 삭제.
- [x] `grep -rn "HTTPError" src` 참조 0건 확인. 타입체크·테스트 통과.

> **B6 실행 중 발견한 스코프 갭(2026-07-26)**: `docs/TESTING_GUIDELINE.md` 3곳이 `HTTPError`를 실제 assertion 대상으로 지시하고 있었다(`rejects.toThrow(HTTPError)` + `.toMatchObject({ code: 401 })`) — 클래스가 사라지면서 그대로 두면 따라 쓸 수 없는 문서가 된다. `AppError` + `category` 기준으로 갱신했고, "services는 HTTP status를 모르므로 status로 검증하지 않는다(status 매핑 검증은 `response.ts` 테스트 소관)"는 근거도 같이 명시했다. `src/CLAUDE.md`·`src/shared/types/CLAUDE.md`의 `HTTPError` 언급은 "이런 타입을 만들지 않는다"는 금지 규칙이라 그대로 둔다.

---

## 다음 세션 시작 지점

두 트랙 다 방향/규칙 확정, 코드 미착수. 트랙 A/B는 서로 독립 — 병행 가능.

**트랙 A**(Phase 1~3):
1. Phase 2 구현(`ErrorFallback` prop 리네임 + 기존 3개 error.tsx 시그니처 교체) — Phase 1의 `global-error.tsx`가 이 시그니처를 그대로 쓰므로 먼저.
2. Phase 1 구현(`global-error.tsx` 신규 작성, Phase 2 결과물 재사용).
3. Phase 3-1 → 3-2 → 3-3 — 위 둘과 의존관계 없어 아무 때나/병행 가능.

**트랙 B**(레이어 에러 계약): **B1~B6 전부 완료.** 레거시 `HTTPError`도, `apiRequest`도, 클라이언트 판단로직(`handleClientError`)도 전부 코드에서 사라졌다 — 새 계약(`AppError`/`ErrorPayload`)만 남았다.

다음 착수: 트랙 B는 종료, **트랙 A**(Phase 1~3)만 남았다 — 순서는 위 "트랙 A" 절 참고(Phase 2 → Phase 1 → Phase 3-1~3-3).

**TDD 게이트 관련 후속 세션 유의사항**: `4cc1903`부터 fail-closed TDD 훅이 Write/Edit/Bash 전부에 적용된다 — 새 파일이든 기존 파일 수정이든 콜로케이트 `.test.ts(x)`가 없으면 차단된다(예외는 `test-scope-exclude.json`뿐, 임의로 추가하지 말고 사용자에게 먼저 물을 것). 트랙 A(Phase 1~3)의 대상 파일(`error.tsx` 3개, 신규 `global-error.tsx`, `ErrorFallback.tsx`, `useNavigationGeo.ts`, `KakaoMap.tsx`)도 전부 이 게이트 대상이다 — 착수 전에 테스트 컨벤션부터 챙길 것.

**검증 환경 이슈(B2에서 테스트를 못 돌린 원인, B3에서 해소)**: `npx vitest run`을 막던 `@rolldown/binding-linux-x64-gnu` 누락은 코드 문제가 아니라 로컬 설치 문제였다 — `package-lock.json`엔 1.1.5로 잠겨 있는데 `node_modules/@rolldown/`엔 안 깔려 있었다(optional dep 설치 누락). `npm install @rolldown/binding-linux-x64-gnu@1.1.5 --no-save`로 채우면 실행된다(`--no-save`라 락파일 무변경, `node_modules`만 채움). **새 워크트리/클론에서 재발한다** — 테스트가 이 에러로 죽으면 이 명령부터 실행할 것.
