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

## Phase B1 — 에러 타입/계약 정의 (`src/shared/types/error.ts`)

**상태: 규칙 확정, 코드 미착수. 나머지 B 전부 이 타입에 의존 — 선행 필수.**

- `AppError`(앱 고유 분류만, HTTP status 모름) 정의, `HTTPError` 제거.
- 분류 taxonomy(전체 표는 `src/CLAUDE.md`) + `ErrorPayload { 분류, message, fieldErrors? }` 정의.

## Phase B2 — 서버 공용 핸들러 (채널 A/B)

**상태: 규칙 확정, 코드 미착수. B1 선행.**

- 채널 A 핸들러: `AppError` 캐치 → 로깅 + 민감분류 일반화 + `ErrorPayload` 리턴.
- 채널 B 핸들러(`response.ts`): `AppError` 캐치 → 로깅 + 민감분류 일반화 + `분류→HTTP status` 매핑 + body에 `ErrorPayload`.
- `분류→안전문구`·`분류→HTTP status` lookup map을 A/B가 공유(데이터라 중복 아님).
- `order/create/route.ts:48`의 `throw new HTTPError(..., 501)` → `AppError(DISABLED)`(매핑표에서 503).

## Phase B3 — services 계층 정리

**상태: 규칙 확정, 코드 미착수. B1 선행.**

- `requireAuth`: `HTTPError(401)` → `AppError(UNAUTHENTICATED)`.
- 조회형(`getUser`/`getAuth`): 미존재만 `null`, DB 인프라 예외는 `AppError(INTERNAL)` throw로 구분.

## Phase B4 — `apiRequest` 삭제 + 호출자 Server Action 이관

**상태: 규칙 확정, 코드 미착수. B1·B2 선행(리턴 타입 확정 후).**

- 4개 호출자 → Server Action: `usePortOnePayment`(결제 검증 `/api/payment/complete` → `completePayment`), `useEntry`(entry 토큰), `ProductLikeBadge`(좋아요 토글), `UpdatePasswordForm`(로그아웃 쿠키 DELETE).
- 결제: 브라우저 SDK(`PortOne.requestPayment`)는 클라 유지, 그 뒤 검증 POST만 Server Action. route.ts 엔드포인트는 PortOne 웹훅(서버→서버, 채널 B)용으로 남을 수 있음.
- `apiRequest.ts` 삭제.

## Phase B5 — 클라이언트 판단로직 제거

**상태: 규칙 확정, 코드 미착수. B1·B2 선행(서버가 표시-안전 payload 생산해야 함).**

- `utils/error.ts`(field/message/silent 판단) + `handleClientError` 삭제.
- 폼은 `useActionState` state(`ErrorPayload`) 직접 렌더(fieldErrors→input, message→전역), GET은 `useSWR` `error` 직접 렌더.

---

## 다음 세션 시작 지점

두 트랙 다 방향/규칙 확정, 코드 미착수. 트랙 A/B는 서로 독립 — 병행 가능.

**트랙 A**(Phase 1~3):
1. Phase 2 구현(`ErrorFallback` prop 리네임 + 기존 3개 error.tsx 시그니처 교체) — Phase 1의 `global-error.tsx`가 이 시그니처를 그대로 쓰므로 먼저.
2. Phase 1 구현(`global-error.tsx` 신규 작성, Phase 2 결과물 재사용).
3. Phase 3-1 → 3-2 → 3-3 — 위 둘과 의존관계 없어 아무 때나/병행 가능.

**트랙 B**(레이어 에러 계약): **B1 → (B2·B3 병행) → (B4·B5)**. B1(타입 정의)이 모든 것의 기반이라 선행 필수. B4/B5는 B2 완료(서버가 `ErrorPayload` 생산) 후.
