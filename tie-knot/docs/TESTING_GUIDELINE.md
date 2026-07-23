# docs/TESTING_GUIDELINE.md

> Last updated: 2026-07-23
> vitest 설치 완료 — `vitest.config.ts`(루트), `test`/`test:watch`/`test:coverage` 스크립트, `vite-tsconfig-paths`로 alias 해석. `mongodb-memory-server`는 아직 미설치(DB 테스트 착수 시 별도 설치 필요).

## Overview

이 문서는 `vitest` 테스트 작성 시 지켜야 할 이 프로젝트 고유 컨벤션을 다룬다. 폴더별 `CLAUDE.md`(services/actions/api/models 등)가 이미 정의한 아키텍처 계약을 전제로 하며, 그 계약과 충돌하지 않는다 — 오히려 그 계약(에러 처리 패턴, 배럴 import 등)을 테스트가 어떻게 검증해야 하는지를 다룬다.

## Tooling

- 테스트 러너: `vitest`
- DB: `mongodb-memory-server` — 인메모리 mongod를 띄워 mongoose 쿼리를 실제로 실행한다. mongoose model을 `vi.mock`으로 대체하지 않는다.
- path alias 해석: `vite-tsconfig-paths`

## Structure

```
src/
├── services/
│   ├── auth.service.ts
│   └── auth.service.test.ts     # colocate — 대상 파일 옆에 .test.ts
├── actions/
│   ├── createOrder.ts
│   └── createOrder.test.ts
├── schemas/request/
│   ├── login.schema.ts
│   └── login.schema.test.ts
└── test/                          # 배럴 예외(src/app/과 동일 성격) — 테스트 전용 공용 인프라
    ├── setup.ts                     # vitest globalSetup — mongodb-memory-server 기동/종료
    ├── db.ts                        # beforeEach에서 쓰는 컬렉션 clear 헬퍼
    └── factories/
        ├── user.factory.ts          # buildUser(overrides?)
        ├── product.factory.ts
        └── ...                       # 모델당 파일 1개, src/models/ 구성과 1:1 대응
```

## Critical Convention

### 범위/순서

- 1차 커버 범위는 순수 로직(`schemas/`의 zod 스키마, `utils/`)부터 시작한다 — DB 셋업 없이 vitest 자체(config, alias 해석)부터 검증할 수 있어서다. 그 다음 `services/`+`actions/`(결제 금액 검증, 소유권 재검증 등 리스크가 큰 로직)로 확장한다.
- `app/api/`의 `route.ts`는 후순위로 둔다 — `services/`+`actions/`가 이미 커버되면 그 위 얇은 wrapper라 테스트 내용이 중복된다.

### DB 테스트

- DB가 걸린 로직은 `mongodb-memory-server`로 실제 mongoose 쿼리를 실행해 검증한다 — mongoose model을 `vi.mock`으로 대체하지 않는다. 이유: mock은 쿼리 정확성(필터 조건, `.lean()`/`.toJSON()` 결과 shape)을 검증하지 못하고, `services/`는 계획된 리팩터(`doc.md` 트레이드오프 정리) 대상이라 구현 디테일에 묶인 mock은 리팩터마다 재작성해야 한다 — 계약(입출력)만 보는 통합 테스트가 리팩터에 더 강하다.
- `mongodb-memory-server` 인스턴스는 vitest `globalSetup`(`src/test/setup.ts`)에서 테스트 스위트 전체당 1개만 띄운다 — 테스트 파일마다 새 인스턴스를 만들지 않는다. 이유: 파일마다 기동하면 스위트 전체 시간이 선형으로 늘어난다. 테스트 간 격리는 각 `beforeEach`에서 관련 컬렉션을 `deleteMany`로 비워 확보한다(`src/test/db.ts`).
- mongoose 테스트 데이터는 `src/test/factories/{도메인}.factory.ts`의 팩토리 함수(`buildUser(overrides?)` 등)로 만든다 — 매 테스트 파일에 객체 리터럴을 인라인으로 반복하지 않는다. 이유: 모델 스키마에 필수 필드가 추가되면 인라인 방식은 테스트 파일 전부 고쳐야 하지만 팩토리는 한 곳만 고치면 된다.

### 목킹 정책

- 네트워크를 타는 외부 연동(`lib/cloudinary`, `lib/nodemailer`, `lib/kakao`, PortOne SDK)은 반드시 `vi.mock`한다 — 실제로 호출하지 않는다. 이유: 실제 이메일 발송/결제 API 호출은 재현 불가능하고 부작용·비용이 발생한다.
- `lib/bcrypt`, `lib/jose`는 mock하지 않고 실제로 실행한다. 이유: 둘 다 외부 I/O 없는 순수 로컬 연산이라, mock하면 해싱/토큰 검증 로직 자체가 걸러지지 않고 통과한다.
- `vi.mock`은 배럴 경로(예: `@/lib/nodemailer`)를 대상으로 한다 — 구체 파일 경로(`@/lib/nodemailer/send`)를 mock하지 않는다. 이유: `src/CLAUDE.md`의 배럴 전용 import 원칙상 실제 코드는 배럴을 통해서만 import하므로, mock도 그 경로와 일치해야 실제로 가로채진다. 배럴이 `export *`뿐이라 원본 파일 경로를 mock해도 배럴 재수출 지점에서 안 걸린다.

### assertion 패턴

- `services/` 함수는 성격에 따라 assertion 방식을 나눈다(`src/services/CLAUDE.md` Critical Convention의 조회형/확인형 구분과 대응):
  - 조회/판별형(없는 게 정상 흐름 — `getUser`/`getAuth` 등) → `expect(await fn(...)).toBeNull()`
  - 필수 존재/인가 확인형(없으면 요청 자체가 잘못됨 — `getUserById`/`getUserEmail`/`requireAuth` 등) → `await expect(fn(...)).rejects.toThrow(HTTPError)`에 더해 status code까지 구체적으로 검증한다(`.rejects.toMatchObject({ code: 401 })`). 이유: `instanceof`/`toThrow(HTTPError)`만 보면 401이 나와야 할 자리에 403이 나와도 테스트가 그린으로 남는다 — 인증/권한이 이 프로젝트 리스크가 큰 축이라 status code 자체가 계약이다.
- `actions/` 함수는 throw를 기대하지 않는다 — 리턴값을 검증한다: `const result = await action(...); expect(result).toEqual({ success: false, ... })`. 이유: Server Action은 예상 가능한 실패를 리턴값으로 모델링하는 게 공식 계약(`src/actions/CLAUDE.md` 근거)이라, 여기서 throw를 기대하는 테스트를 쓰면 실제 계약과 어긋난 케이스를 검증하게 된다. 단, 서비스 레이어가 이미 던진 `HTTPError`를 액션이 받아 리턴값으로 번역하는 케이스(`src/actions/CLAUDE.md` Gotchas)는 액션 자체는 여전히 throw하지 않으므로 이 규칙 그대로 적용한다 — 리턴값 안의 번역된 message/code를 검증한다.

### 스타일

- `describe`/`it` 타이틀은 한국어로 쓴다. 이유: 이 프로젝트 컨벤션 문서·커밋 전부 한국어 우선이라 통일한다.
- `describe`/`it`/`expect`/`vi` 등은 전역으로 쓰지 않는다 — 매 파일 `import { describe, it, expect, vi } from "vitest"`로 명시한다(vitest config `globals: false`). 이유: `src/CLAUDE.md`가 암묵적 전역(배럴도 `export *`만, `export default` 금지)을 배제하는 스타일이라 테스트만 전역 주입을 쓰면 어긋난다.
- path alias(`@/*`)는 vitest config에서 `vite-tsconfig-paths` 플러그인으로 해석한다 — `resolve.alias`를 수동으로 중복 정의하지 않는다. 이유: tsconfig가 바뀔 때마다 두 곳을 수동 동기화하지 않아도 된다.

## Gotchas

- `mongodb-memory-server`는 아직 설치되지 않았다 — DB가 걸린 `services/`·`actions/` 테스트에 착수할 때 설치하고, 이 섹션의 DB 테스트 컨벤션이 실제로 동작하는지 검증해야 한다.
- `.claude/hooks/pre-commit-check.sh`가 lint → `test:coverage` → build 순서로 커밋을 막는다. `test:coverage`는 `vitest.config.ts`의 `coverage.thresholds`(`perFile: true, lines: 80`)로 **테스트가 존재하는 파일 각각**의 line coverage 80% 미만이면 실패한다 — git diff로 이번 커밋에서 건드린 파일만 보는 게 아니라, 테스트가 붙어있는 파일 전체가 대상이다(단 `coverage.all`이 `false`라 테스트가 아예 없는 레거시 파일은 리포트에 안 잡혀 전면 락은 안 걸린다). 커버리지 %는 "테스트가 있다"는 사실만 강제하는 Write/Edit 훅과 별개로 "그 테스트가 실제로 로직을 타는가"를 걸러내는 2차 게이트다 — 단, branch coverage는 아직 안 본다(line만), assertion이 의미있는지는 여전히 사람 리뷰 몫이다.
- 컴포넌트/UI 테스트 셋업(`environment: jsdom`, `@testing-library/react`, `@testing-library/jest-dom`)은 이미 설치·설정됐다(Write/Edit 시점 TDD 강제 훅이 `molecules/`·`organisms/`도 대상으로 삼아서 선행 설치됨) — 다만 이 문서엔 아직 컴포넌트 테스트 작성 컨벤션(assertion 패턴, mock 범위)이 없다, 실제로 작성하며 후속 개정 대상.
- `services/` 함수의 조회형/확인형 에러 처리 이분법은 프로젝트 자체 규칙이 아니라 Next.js 공식 문서 두 곳(`node_modules/next/dist/docs/01-app/02-guides/authentication.md`의 `dal.ts` 예제, `data-security.md`의 `deletePost` 예제)에 각각 근거가 있다 — `HTTPError` 클래스와 401/404 같은 status code 매핑만 공식 문서에 없는 프로젝트 고유 확장이다(`src/services/CLAUDE.md` 참고). 이 구분을 무시하고 모든 services 함수를 한 가지 패턴으로 테스트하지 않는다.

## 관련 문서

- 서비스 레이어 에러 처리 계약: `src/services/CLAUDE.md`
- Server Action 에러 처리 계약: `src/actions/CLAUDE.md`
- Route Handler 응답 계약: `src/app/api/CLAUDE.md`, `src/api/CLAUDE.md`
- 배럴/import 원칙: `src/CLAUDE.md`
- `.lean()`/`.toJSON()` 트레이드오프: `src/services/doc.md`
