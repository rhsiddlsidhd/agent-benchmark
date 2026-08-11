# docs/TESTING_GUIDELINE.md

> Last updated: 2026-08-11
> vitest 설치 완료 — `vitest.config.ts`(루트), 공개 `test`/`test:unit`/`test:integration:*` 스크립트, `vite-tsconfig-paths`로 alias 해석. `mongodb-memory-server`도 설치·연동 완료(`src/test/setup/mongo-server.ts` globalSetup, `src/server/lib/mongodb/connect.ts`의 `MONGO_TEST_URI` 오버라이드) — 아래 Tooling/DB 테스트 섹션 참고. 팩토리는 `src/test/factories/`에 도메인당 1개씩 있다.

## Overview

이 문서는 `vitest` 테스트 작성 시 지켜야 할 이 프로젝트 고유 컨벤션을 다룬다. 폴더별 `CLAUDE.md`(services/actions/api/models 등)가 이미 정의한 아키텍처 계약을 전제로 하며, 그 계약과 충돌하지 않는다 — 오히려 그 계약(에러 처리 패턴, 배럴 import 등)을 테스트가 어떻게 검증해야 하는지를 다룬다.

## Tooling

- 테스트 러너: `vitest`
- DB: `mongodb-memory-server` — 인메모리 mongod를 띄워 mongoose 쿼리를 실제로 실행한다. mongoose model을 `vi.mock`으로 대체하지 않는다. `dbConnect()`(`src/server/lib/mongodb/connect.ts`)는 `process.env.MONGO_TEST_URI`가 설정돼 있으면 그 URI로, 없으면 기존 Atlas SRV URI로 연결한다 — 운영 코드 경로는 그대로 두고 테스트에서만 memory server로 리다이렉트하는 오버라이드다.
- path alias 해석: `vite-tsconfig-paths`
- 컴포넌트 상호작용 시뮬레이션: `@testing-library/user-event`
- 테스트-제품 소스 관계 분석: `scripts/test-scope/test-graph.mjs`가 TypeScript AST와 모듈 해석을 사용해 런타임 import의 전이 관계를 계산한다. TDD Guard와 mutation 범위가 이 그래프를 공유한다.

## Structure

```
src/
├── services/
│   ├── auth.service.ts
│   └── auth.service.integration.test.ts  # colocate. DB에 붙으므로 .integration
├── actions/
│   ├── createOrder.ts
│   └── createOrder.test.ts      # colocate — 대상 파일 옆에 .test.ts
├── schemas/request/
│   ├── login.schema.ts
│   └── login.schema.test.ts
└── test/                          # 테스트 전용 공용 지원 자산 — src/test/CLAUDE.md
    ├── index.ts                     # 배럴 — 테스트는 `@/test` 하나로만 import한다
    ├── db.ts                        # beforeEach에서 쓰는 컬렉션 clear 헬퍼
    ├── setup/                       # vitest.config.ts 전용 진입점(배럴에 넣지 않는다)
    │   ├── mongo-server.ts          # globalSetup — mongodb-memory-server 기동/종료
    │   └── jsdom-polyfill.ts        # setupFiles — jsdom 미구현 API 대체 + RTL cleanup
    └── factories/
        ├── index.ts
        ├── user.factory.ts          # buildUserInput(overrides?)
        ├── product.factory.ts
        └── ...                       # 모델당 파일 1개, src/server/models/ 구성과 1:1 대응
```

> 위 `services/`/`actions/`/`schemas/` 아래 파일들은 colocate 구조를 보여주기 위한 예시다.

- **`src/test/`에는 테스트 파일을 두지 않는다** — 테스트는 대상 파일 옆에 colocate하고, 이 폴더는 여러 테스트가 공유하는 지원 자산(실행 인프라·헬퍼·팩토리) 전용이다. 폴더 이름만 보고 "테스트 모음"으로 오해하기 쉬운 지점이다.

## Critical Convention

### 작성 순서 — Red 확인

- **소스를 쓰기 전에 관련 테스트를 먼저 쓰고 `npm run test:red -- --scope <scope>`로 새 실패를 증명한 뒤 소스에 들어간다.** Claude와 Codex의 편집 hook은 공통 TDD Guard proof를 확인하며, 편집 후 proof 상태를 갱신한다.
- 테스트 파일을 쓴 직후 **통과**가 나왔으면 소스가 아니라 테스트를 고친다 — 아직 없는 동작을 검사하고 있다면 통과할 수 없기 때문이다. assertion을 빠뜨렸거나 엉뚱한 걸 보고 있다는 신호다. 단 Refactor 단계에서 기존 테스트를 정리한 경우는 통과가 정상이다 — 훅은 두 단계를 구분하지 못하므로 판정은 사람/에이전트 몫이다.
- 실패했다고 바로 넘어가지 않는다 — `expected ... to be ...`(assertion 불일치)면 진짜 Red지만, `Cannot find module`/`Failed to resolve import`은 미구현이 아니라 경로 오류다.
- **이미 존재하는 동작에 뒤늦게 테스트를 붙일 땐 Red를 만들 수 없다** — 대신 소스를 일부러 깨뜨려 그 테스트가 빨개지는지 확인하고 되돌린다. 빨개지지 않으면 그 테스트는 아무것도 검증하지 않는다. 아래 Mutation Testing이 이 절차를 CI에서 기계적으로 하는 것이다.
- 기존 파일이라고 이 순서가 면제되지 않는다 — 단위는 파일이 아니라 **동작**이다. 기존 파일에 새 분기를 추가하거나 버그를 고칠 때는 그 동작의 테스트가 정상적으로 Red가 된다.

### 파일 네이밍 = 실행 묶음

- **테스트 파일명은 `*.test.ts(x)`가 기본이고, 실물 mongod(`mongodb-memory-server`)에 붙는 테스트만 `*.integration.test.ts(x)`로 짓는다.** 판정 기준은 이것 하나다 — mock을 얼마나 썼는지, RTL을 썼는지, 모듈 여러 개가 얽혔는지는 기준이 아니다. `grep -lE "dbConnect|clearCollections"`로 기계적으로 판정된다.
- **파일 안에 DB 테스트가 하나라도 있으면 그 파일 전체가 integration이다** — vitest의 실행 단위는 `it`이 아니라 파일이라, 파일 하나가 통째로 한 묶음에 들어간다.
- **실행을 가르지 않는 접미사는 붙이지 않는다.** `vitest.config.ts`의 projects가 접미사와 경로로 실행 환경을 나누므로 접미사가 곧 실행 셀렉터다 — 분류 설명용 라벨(`*.regression.test.ts` 등)을 새로 만들지 않는다.
- MSW나 `vi.mock`으로 네트워크만 가로챈 컴포넌트 테스트는 **unit 쪽**이다 — 테스트 분류 taxonomy가 아니라 "프로세스 밖 공유 자원을 쓰는가"가 기준이기 때문이다.

### 공개 실행 묶음

| 묶음 | 대상 | mongod | 파일 병렬 |
| --- | --- | --- | --- |
| `unit` | `*.test.ts(x)` (integration 제외) | 안 띄움 | 병렬 |
| `integration-client` | `tests/integration/client`, `src/client/**/*.integration.test.*` | 안 띄움 | 병렬 |
| `integration-server` | `src/server`, `src/app/api`, `tests/integration/server`의 integration | 띄움 | 순차 |
| `integration-rsc` | `src/app`의 API 외 integration | 띄움 | 순차 |

- 공개 명령은 `npm run test:unit`, `npm run test:integration:client`, `npm run test:integration:server`다. server 명령은 `integration-server`와 `integration-rsc` project를 함께 실행한다.
- **`connect.ts`의 URI 검증은 모듈 로드가 아니라 `dbConnect()` 호출 시점에 건다** — 지키려는 불변조건이 "테스트가 프로덕션 DB에 연결하지 않는다"라 검증도 연결 시점에 있어야 한다. 로드 시점에 두면 `unit` 묶음(mongod 없음)의 테스트가 배럴 캐스케이드로 그 모듈을 로드하는 것만으로 터진다.
- 공통 TDD Guard 그래프는 `*.test.ts(x)`와 `*.integration.test.ts(x)`를 모두 제품 코드에 연결한다. 파일명 역산이 아니라 런타임 import 전이 관계로 관련 테스트를 찾는다.

### 범위/순서

- 1차 커버 범위는 순수 로직(`schemas/`의 zod 스키마, `utils/`)부터 시작한다 — DB 셋업 없이 vitest 자체(config, alias 해석)부터 검증할 수 있어서다. 그 다음 `services/`+`actions/`(결제 금액 검증, 소유권 재검증 등 리스크가 큰 로직)로 확장한다.
- `app/api/`의 `route.ts`는 후순위로 둔다 — `services/`+`actions/`가 이미 커버되면 그 위 얇은 wrapper라 테스트 내용이 중복된다.
- **`src/server/models/`는 선언적 스키마만 검증하려는 별도 테스트를 만들지 않는다.** `services/` 통합 테스트가 실제 DB로 스키마 계약을 간접 검증한다. 커스텀 validator처럼 제품 로직이 있으면 그 로직을 사용하는 서비스 테스트에서 검증한다. mutation 대상은 수동 제외 목록이 아니라 실제 테스트의 런타임 import 그래프로 결정된다.

### DB 테스트

- DB가 걸린 로직은 `mongodb-memory-server`로 실제 mongoose 쿼리를 실행해 검증한다 — mongoose model을 `vi.mock`으로 대체하지 않는다. 이유: mock은 쿼리 정확성(필터 조건, `.lean()`/`.toJSON()` 결과 shape)을 검증하지 못하고, 구현 디테일에 묶인 mock은 리팩터마다 재작성해야 한다 — 계약(입출력)만 보는 통합 테스트가 리팩터에 더 강하다.
- `mongodb-memory-server` 인스턴스는 vitest `globalSetup`(`src/test/setup/mongo-server.ts`)에서 테스트 스위트 전체당 1개만 띄운다 — 테스트 파일마다 새 인스턴스를 만들지 않는다. 이유: 파일마다 기동하면 스위트 전체 시간이 선형으로 늘어난다. 테스트 간 격리는 각 `beforeEach`에서 관련 컬렉션을 `deleteMany`로 비워 확보한다(`clearCollections`, `src/test/db.ts`).
- **mongod 버전은 `mongo-server.ts`의 `MONGOD_VERSION`으로 고정한다** — 생략하면 `mongodb-memory-server` 패키지가 정한 기본 버전을 쓰므로, 패키지를 올릴 때 테스트가 도는 mongod 버전이 조용히 바뀐다. 운영(Atlas) 클러스터 버전을 올릴 때 이 값도 같이 맞춘다.
- **이 격리는 테스트 파일들이 순차 실행될 때만 유효하다.** `integration-server`와 `integration-rsc`에 `fileParallelism: false`를 설정한다. 여러 파일이 같은 DB를 공유하므로 한 파일의 `beforeEach`가 다른 파일의 데이터를 지우는 레이스를 막기 위한 제약이며, DB를 쓰지 않는 unit/client에는 적용하지 않는다.
- mongoose 테스트 데이터는 `src/test/factories/{도메인}.factory.ts`의 팩토리 함수(`buildUserInput(overrides?)` 등)로 만든다 — 매 테스트 파일에 객체 리터럴을 인라인으로 반복하지 않는다. 이유: 모델 스키마에 필수 필드가 추가되면 인라인 방식은 테스트 파일 전부 고쳐야 하지만 팩토리는 한 곳만 고치면 된다.
- 팩토리와 헬퍼는 배럴 `@/test` 하나로만 import한다 — `@/test/db`나 `@/test/factories/product.factory` 같은 개별 경로로 찌르지 않는다(`src/CLAUDE.md` 배럴 전용 import 원칙).

### 목킹 정책

- 네트워크를 타는 외부 연동(`lib/cloudinary`, `lib/nodemailer`, `lib/kakao`, PortOne SDK)은 반드시 `vi.mock`한다 — 실제로 호출하지 않는다. 이유: 실제 이메일 발송/결제 API 호출은 재현 불가능하고 부작용·비용이 발생한다.
- `lib/bcrypt`, `lib/jose`는 mock하지 않고 실제로 실행한다. 이유: 둘 다 외부 I/O 없는 순수 로컬 연산이라, mock하면 해싱/토큰 검증 로직 자체가 걸러지지 않고 통과한다.
- `vi.mock`은 배럴 경로(예: `@/lib/nodemailer`)를 대상으로 한다 — 구체 파일 경로(`@/lib/nodemailer/send`)를 mock하지 않는다. 이유: `src/CLAUDE.md`의 배럴 전용 import 원칙상 실제 코드는 배럴을 통해서만 import하므로, mock도 그 경로와 일치해야 실제로 가로채진다. 배럴이 `export *`뿐이라 원본 파일 경로를 mock해도 배럴 재수출 지점에서 안 걸린다.

### assertion 패턴

- `services/` 함수는 성격에 따라 assertion 방식을 나눈다(`src/server/services/CLAUDE.md` Critical Convention의 조회형/확인형 구분과 대응):
  - 조회/판별형(없는 게 정상 흐름 — `getUser`/`getAuth` 등) → `expect(await fn(...)).toBeNull()`
  - 필수 존재/인가 확인형(없으면 요청 자체가 잘못됨 — `getUserById`/`getUserEmail`/`requireAuth` 등) → `await expect(fn(...)).rejects.toThrow(AppError)`에 더해 분류까지 구체적으로 검증한다(`.rejects.toMatchObject({ category: "UNAUTHENTICATED" })`). 이유: `instanceof`/`toThrow(AppError)`만 보면 `UNAUTHENTICATED`가 나와야 할 자리에 `FORBIDDEN`이 나와도 테스트가 그린으로 남는다 — 인증/권한이 이 프로젝트 리스크가 큰 축이라 분류 자체가 계약이다. services는 HTTP status를 모르므로(`src/CLAUDE.md` 에러 핸들링) status로 검증하지 않는다 — status 매핑 검증은 route.ts 경계(`src/server/boundary.ts`의 `routeError`) 테스트 소관이다.
- `actions/` 함수는 throw를 기대하지 않는다 — 리턴값을 검증한다: `const result = await action(...); expect(result).toEqual({ success: false, ... })`. 이유: Server Action은 예상 가능한 실패를 리턴값으로 모델링하는 게 공식 계약(`src/server/actions/CLAUDE.md` 근거)이라, 여기서 throw를 기대하는 테스트를 쓰면 실제 계약과 어긋난 케이스를 검증하게 된다. 단, 서비스 레이어가 이미 던진 `AppError`를 공용 핸들러(`src/server/boundary.ts`의 `actionError`)가 받아 리턴값으로 번역하는 케이스(`src/server/actions/CLAUDE.md` Gotchas)는 액션 자체는 여전히 throw하지 않으므로 이 규칙 그대로 적용한다 — 리턴값 안의 `ErrorPayload`(`category`/`message`/`fieldErrors`)를 검증한다.

### 컴포넌트 테스트

- 스코프는 `components/molecules/`·`components/organisms/`로 한정한다 — `src/app/**/_components/`(라우트 전용 컨테이너)는 `useActionState`/Zustand 스토어/`router` 등 도메인 의존이 있어 이 섹션의 "순수 컴포넌트" 전제가 안 맞는다, 별도 컨벤션 대상이다(아직 미작성).
- `molecules`(단일 책임)와 `organisms`(여러 책임 조합) 경계는 `src/client/components/CLAUDE.md` 핵심 원칙 3을 그대로 쓴다 — 계층을 잘못 판단하면 폴더 위치뿐 아니라 아래 테스트 범위도 잘못 적용된다.
- `molecules`는 렌더링(props→출력)과 **단일 상호작용 지점**(이벤트 1번 → handler prop 1번 호출)까지 검증한다. `organisms`는 여기에 더해 **여러 상호작용이 로컬 UI 상태를 거쳐 조합되는 흐름**(스텝 이동, 조건부 활성화 등)까지 검증한다 — 두 계층 다 도메인 로직 검증은 대상이 아니다(컨테이너 소관, `src/client/components/CLAUDE.md` 핵심 원칙 1).
- 하위 컴포넌트를 `vi.mock`하지 않는다 — 항상 full render한다. 이유: RTL 공식 철학("The more your tests resemble the way your software is used, the more confidence they can give you")과 어긋나고, shadcn/Radix 하위 요소는 접근성 속성(`role`/`aria-*`)에 의존해 쿼리하는 경우가 많아 mock하면 그 구조가 사라져 오히려 실제와 멀어진다.
- 쿼리는 RTL 공식 우선순위(`getByRole` > `getByLabelText` > `getByPlaceholderText` > `getByText` > `getByDisplayValue`/`getByAltText`/`getByTitle` > `getByTestId`)를 따른다 — `data-testid`는 다른 쿼리로 못 찾을 때만 최후 수단으로 쓴다.
- 상호작용 시뮬레이션은 `fireEvent` 대신 `@testing-library/user-event`를 쓴다. 이유: `fireEvent`는 단일 DOM 이벤트만 발생시키지만 `user-event`는 실제 클릭 시 브라우저가 발생시키는 이벤트 시퀀스(`pointerdown`→`mousedown`→`focus`→`pointerup`→`mouseup`→`click`) 전체를 재현해, `onFocus` 등에 의존하는 동작을 `fireEvent`로는 못 잡는다.

### 컴포넌트 테스트 인프라 셋업

- `.env`는 vitest가 Next.js처럼 자동으로 읽지 않는다 — `vitest.config.ts`에서 `@next/env`(Next 내장, 별도 설치 불필요)의 `loadEnvConfig(process.cwd())`를 `defineConfig` 호출 이전에 실행해 로드한다. 이거 없으면 배럴 import를 타고 들어온 무관한 모듈(예: 인증 코드)이 환경변수 누락으로 테스트를 깨뜨릴 수 있다.
- RTL의 자동 `afterEach(cleanup)`은 이 프로젝트의 `globals: false` 설정에서는 안 걸린다 — `src/test/setup/jsdom-polyfill.ts`에 `afterEach(cleanup)`을 명시적으로 등록해뒀다. 이거 없으면 이전 테스트가 렌더한 DOM이 안 지워진 채 다음 테스트로 넘어가 쿼리가 여러 개 매칭되는 식으로 깨진다.
- jsdom은 Pointer Events API(`hasPointerCapture`/`setPointerCapture`/`releasePointerCapture`)와 `scrollIntoView`를 구현하지 않는다 — Radix UI(Select/Dialog 등) 컴포넌트가 이 메서드들을 호출해서 폴리필 없으면 상호작용 테스트가 런타임에 터진다. `src/test/setup/jsdom-polyfill.ts`에 폴리필을 이미 등록해뒀다.
- jsdom은 `ResizeObserver`도 구현하지 않는다 — `@radix-ui/react-use-size`가 Select 트리거 크기 측정에 쓰는데, Select를 2개 이상 동시에 렌더링하는 폼(`ProductRegistrationForm` 테스트 작성 중 처음 발견)에서 마운트 즉시 던진다. `src/test/setup/jsdom-polyfill.ts`에 mock 등록.
- jsdom은 `DataTransfer`도 구현하지 않고, `HTMLInputElement.files` setter는 진짜 `FileList` 브랜드 체크를 한다 — `new DataTransfer() → input.files = dataTransfer.files` 패턴(파일 업로드 폼이 hidden input에 프로그래밍적으로 파일을 채울 때 흔한 방식)을 그대로 실행하면 던진다. `src/test/setup/jsdom-polyfill.ts`에서 `DataTransfer`를 mock하고 `HTMLInputElement.prototype.files`의 setter/getter를 테스트 환경 한정으로 느슨하게 재정의해뒀다 — `user-event.upload()`가 쓰는 인스턴스 전용 대입과는 간섭하지 않는다.

### 스타일

- `describe`/`it` 타이틀은 한국어로 쓴다. 이유: 이 프로젝트 컨벤션 문서·커밋 전부 한국어 우선이라 통일한다.
- `describe`/`it`/`expect`/`vi` 등은 전역으로 쓰지 않는다 — 매 파일 `import { describe, it, expect, vi } from "vitest"`로 명시한다(vitest config `globals: false`). 이유: `src/CLAUDE.md`가 암묵적 전역(배럴도 `export *`만, `export default` 금지)을 배제하는 스타일이라 테스트만 전역 주입을 쓰면 어긋난다.
- path alias(`@/*`)는 vitest config에서 `vite-tsconfig-paths` 플러그인으로 해석한다 — `resolve.alias`를 수동으로 중복 정의하지 않는다. 이유: tsconfig가 바뀔 때마다 두 곳을 수동 동기화하지 않아도 된다.

## Mutation Testing

- Stryker Mutator(`@stryker-mutator/core` + `@stryker-mutator/vitest-runner`) 사용. coverage(실행 여부)만으로 못 잡는 부실 assertion(예: 값 검증 없이 `toBeDefined()`/`toBeTruthy()`만 쓰는 경우)을 survived mutant로 검출한다.
- mutate 대상은 `scripts/test-scope/test-graph.mjs`가 찾은 제품 소스다. 테스트의 직접·간접 런타임 import를 포함하고 `import type`은 제외한다. 로컬 import를 해석하지 못하면 범위를 조용히 누락하지 않고 실패한다.
- threshold(`stryker.config.mjs` `thresholds`): high 80 / low 60 / break 60 — score가 60 미만이면 CI 실패.
- `npm run test:mutation`은 `dev` merge-base 이후 변경된 제품 줄과 공통 그래프의 관련 테스트만 실행하는 PR/로컬 명령이다. static mutant를 포함하며 mutant가 없으면 N/A다.
- `npm run test:mutation:full`은 전체 제품 범위를 incremental mode로 실행한다. 로컬 baseline/report는 XDG state에 유지하고, CI는 매주 토요일 최신 `dev` 결과를 cache·artifact·Dashboard에 남긴다.
- mutation은 편집 hook이 아니라 CI의 required `mutation-changed`가 최종 차단한다. 전체 mutation은 장기 추세 관측용이며 PR required check가 아니다.

### survived mutant 대응 흐름

1. `mutation-changed` 로그에서 survived mutant를 확인한다. 주간 전체 결과는 `full-mutation-<run-id>` artifact 또는 Stryker Dashboard에서 확인한다.
2. survived mutant가 가리키는 라인의 assertion을 보강한다 — 값 자체를 검증하지 않고 존재만 확인하는 패턴(`toBeDefined`/`toBeTruthy`)이 대표적이다, `toBe`/`toEqual`/`toMatchObject`로 구체화한다.
3. 고친 제품 줄이 killed로 바뀌는지는 `npm run test:mutation`으로 확인한다. 범위는 명령이 merge-base와 변경 줄에서 자동 계산하므로 `--mutate` 수동 범위를 받지 않는다.

## Gotchas

- `mongodb-memory-server`는 설치·연동 완료됐고 `connect.integration.test.ts`로 실제 연결까지 검증했다. `coupleInfo`/`product`/`guestbook` service 테스트를 실제로 추가하며 `beforeEach`의 `clearCollections` 격리와 팩토리 패턴을 검증했는데, 이 과정에서 크로스파일 오염 문제가 드러나 `fileParallelism: false`로 고쳤다(위 "DB 테스트" 섹션 참고) — 파일 단독 실행은 통과하는데 전체 스위트 실행에서만 랜덤 실패하는 증상이었다.
- TDD Guard와 mutation 설정은 같은 테스트-소스 그래프를 사용한다. 배럴과 동적 import를 포함한 전이 의존성을 추적하므로 파일명만 역산할 때 생기던 범위 누락을 피한다.
- 제거된 `test:coverage`와 과거 `test:coverage:diff`는 현재 공개 검증 계약이 아니다. 빠른 피드백은 관련 Vitest 실행과 TDD Guard가, assertion 강도 검증은 mutation testing이 담당한다.
- 컴포넌트 테스트 컨벤션(위 "컴포넌트 테스트"/"컴포넌트 테스트 인프라 셋업" 섹션)은 `src/client/components/molecules/BaseSelect.tsx`(Radix Select 조합, 이 프로젝트 molecule 대표 사례)로 렌더링+상호작용 테스트를 실제로 작성해보며 검증했다 — `.env` 미로딩/cleanup 누락/jsdom Pointer Events 미구현 3가지를 실제로 겪고 고쳤다. 다만 `organisms`(여러 상호작용의 로컬 상태 오케스트레이션) 쪽은 아직 실제 작성된 테스트가 없어 그 부분 컨벤션은 미검증이다.
- `services/` 함수의 조회형/확인형 에러 처리 이분법은 프로젝트 자체 규칙이 아니라 Next.js 공식 문서 두 곳(`node_modules/next/dist/docs/01-app/02-guides/authentication.md`의 `dal.ts` 예제, `data-security.md`의 `deletePost` 예제)에 각각 근거가 있다 — `AppError` 클래스와 분류 taxonomy(`UNAUTHENTICATED`/`NOT_FOUND` 등)만 공식 문서에 없는 프로젝트 고유 확장이다(`src/server/services/CLAUDE.md` 참고). 이 구분을 무시하고 모든 services 함수를 한 가지 패턴으로 테스트하지 않는다.

## 관련 문서

- 서비스 레이어 에러 처리 계약: `src/server/services/CLAUDE.md`
- Server Action 에러 처리 계약: `src/server/actions/CLAUDE.md`
- Route Handler 응답 계약: `src/app/api/CLAUDE.md`, `src/server/CLAUDE.md`
- 배럴/import 원칙: `src/CLAUDE.md`
- `.lean()`/`.toJSON()` 트레이드오프: `src/server/services/doc.md`
- 컴포넌트 계층(atoms/molecules/organisms/templates) 분류 기준, 순수성 원칙: `src/client/components/CLAUDE.md`
- mutation testing 설정: `stryker.config.mjs`, `stryker.changed.config.mjs`; CI workflow: `.github/workflows/tdd.yml`, `.github/workflows/full-mutation.yml`
- molecules 세부 정의/예시: `src/client/components/molecules/CLAUDE.md`
