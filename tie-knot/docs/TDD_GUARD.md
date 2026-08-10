# TDD Guard

이 문서와 구현의 유일한 요구사항 기준은 구현 Handoff Prompt다.
`docs/TESTING_GUIDELINE.md`는 기존 체계를 파악하기 위한 감사 증거일 뿐, 이 Guard의
scope·proof·mutation·CI 정책 기준으로 사용하지 않는다.

공통 CLI `scripts/tdd-guard/cli.mjs`가 Claude Code와 Codex adapter, 로컬 명령,
CI의 단일 정책 구현이다. Hook은 편의용 조기 피드백이며 보안 경계가 아니다. 최종
경계는 branch protection의 `tdd-policy`와 각 테스트 job이다.

CI에서는 OS-local proof를 신뢰하거나 전달하지 않는다. `guard verify --ci`가 PR merge
base 이후 변경된 guarded 제품 파일마다 관련 테스트 존재와 AST 품질, 예외 만료를
fail-closed로 검사하고, 별도 required test/mutation jobs가 실행 결과를 증명한다. Git
history만으로 실제 Red 선행 시점을 완전하게 증명할 수 없다는 한계는 리뷰 대상이다.

상태는 `CLEAN → TEST_CHANGED → RED_PROVEN[scope] → IMPLEMENTING →
GREEN_PROVEN[scope] → MUTATION_PROVEN → VERIFIED` 순서다. proof는 프로젝트 파일이
아닌 `$XDG_STATE_HOME/tie-knot/` 또는 OS 임시 상태 디렉터리에 저장되고, session,
Git HEAD, 제품/테스트/config hash, scope, test ID, 허용 파일, 생성 시각을 현재 상태와
매번 대조한다. 동일 OS 사용자 권한을 가진 프로세스까지 방어하는 비밀 저장소는 아니며,
CI가 신뢰 경계인 이유도 이것이다.

주요 명령:

```text
npm run test:red -- --scope unit
npm run test:green -- --scope unit
npm run tdd:status
npm run test:mutation
npm run tdd:verify
```

AST 검사는 빈/0개/assertion 없는/상수 assertion/skip·todo/제품 미연결/snapshot-only
테스트를 막는다. 하지만 정적 분석은 assertion의 비즈니스 의미나 equivalent mutant를
완전히 판정할 수 없다. Vitest 결과와 mutation 결과, 사람의 리뷰가 함께 필요하다.

## 테스트 scope

- `unit`: Zod, 가격·할인·수량, Zustand, hook, component 공개 계약
- `integration-client`: 실제 UI/useSWR/Zustand/Zod와 MSW HTTP 경계
- `integration-server`: 실제 Server Action/Route Handler/service/Mongoose와
  mongodb-memory-server
- `e2e`: 실제 Next 애플리케이션을 실행하는 저장소 `e2e/**/*.spec.ts`

`requiredScopes`의 proof 단위는 공통 CLI 계약에 따라 `unit|integration` 배열이다.
모든 TypeScript 제품 계약은 unit 후보이며, 변경 파일과 그 로컬 의존 그래프에서
client 상태·HTTP, Server Action·Route Handler, Mongoose 또는 외부 adapter 실행 경계가
발견되면 integration을 추가하고 `reasons`에 근거를 기록한다. integration 테스트 실행은
실제 환경에 따라 `integration-client`, `integration-server` 프로젝트로 나뉜다.

atoms/molecules/organisms/templates는 코드 탐색 힌트일 뿐 scope나 품질 정책이 아니다.
component는 폴더 계층과 무관하게 동일하게 취급하며, 관련 테스트는 colocated 이름을 먼저
찾고 이후 import 의존 그래프를 탐색한다.

상품 `rate` 할인율의 사업 상한은 1(100%)로 확정한다. 0과 1은 허용하고 음수와 1 초과는
unit 경계 테스트와 mutation 대상으로 검증한다.

Playwright CLI는 Claude 전역
`/home/rhsiddlsidhd/.claude/skills/playwright-cli/SKILL.md`와 Codex 전역
`/home/rhsiddlsidhd/.agents/skills/playwright-cli/SKILL.md`에 있다. 현재 프로젝트의
`.claude/skills/`에는 복사본이 없고 Codex는 전역 `.agents` 스킬을 참조할 수 있다.
CLI의 탐색·실행 기록은 proof가 아니며, 저장소 `e2e/**/*.spec.ts`를 `playwright test`로
실행한 구조화 결과만 E2E proof로 인정한다.

예외는 `tdd-exceptions.json`에 owner/reason/expiresAt(현재부터 최대 30일)과 최소 path
glob을 기록한다. 만료 또는 잘못된 schema는 fail-closed다.

Codex는 `.codex/hooks.json` 변경 뒤 `/hooks`에서 hash와 명령을 신뢰 검토해야 한다.
현재 설치된 Codex 런타임은 Pre/PostToolUse를 shell 명령에만 호출하므로 `apply_patch`
matcher는 미래/adapter 호환용이며 실제 apply_patch 차단 경계로 신뢰하면 안 된다.

Branch protection required checks:

- `static`
- `unit`
- `integration-client`
- `integration-server`
- `e2e-core`
- `mutation-changed`
- `tdd-policy`

`unit`은 server/client/app/shared를 실행 비용에 따라 나눈 matrix 결과를
집계하는 required check다. 개별 shard 이름을 branch protection에 등록하지 않아도 새
shard 추가/실패가 aggregate에서 차단된다.

CI 실행 시간은 성공 조건이나 차단 기준이 아니다. 변경량과 영향 scope가 커지면 필요한
검증과 실행 시간이 함께 늘어나는 것을 허용하며, 시간을 줄이기 위해 필수 테스트나
mutation 범위를 축소하지 않는다. job별 실행 시간은 병목과 인프라 회귀를 찾기 위한
관측 지표로만 기록한다.

workflow `timeout-minutes`는 비정상 정지와 무한 대기를 끊는 안전 상한이다. cold runner,
dependency/cache miss, 대규모 변경을 수용하도록 static/tdd-policy 10분, unit shard와
client integration 15분, server integration과 E2E 20분, changed mutation 30분으로 둔다.
시간 초과는 제품 품질 실패가 아니라 CI 비정상 종료로 분류해 원인을 조사한다. 전체
전체 mutation은 nightly/manual로, PortOne 실제 테스트 결제는 manual로 분리한다.

## PortOne KG이니시스 smoke

결제 채널은 KG이니시스 `inicis_v2` 테스트 채널로 확정한다. PR의 `e2e-core`는 외부
장애와 카드사 본인 인증에 의존하지 않도록 PortOne 브라우저/서버 경계만 stub하고 실제
Next.js, Server Action, Mongoose transaction과 상태 전이를 검증한다.

실제 결제는 사람이 카드사 인증에 참여해야 하므로 required check나 일반 GitHub-hosted
runner에서 실행하지 않는다. 화면 접근이 가능한 로컬 환경에서는 다음 세 환경 변수를
설정하고 `npm run test:e2e:portone`을 실행한다.

```text
PORTONE_STORE_ID
PORTONE_CHANNEL_KEY
PORTONE_API_SECRET
```

GitHub의 `PortOne KG Inicis Manual Smoke` workflow는 `portone-smoke` label과 GUI
`DISPLAY`가 준비된 self-hosted Linux runner에서만 수동 실행한다. GitHub Environment
`portone-test`에 다음 repository/environment secrets를 등록한다.

```text
PORTONE_STORE_ID
PORTONE_INICIS_V2_CHANNEL_KEY
PORTONE_V2_API_SECRET
```

Store ID와 channel key는 결제 호출에 브라우저로 전달되는 식별자지만 환경별 설정을 한
곳에서 보호하기 위해 secrets로 관리한다. `PORTONE_V2_API_SECRET`은 서버 전용 비밀이며
절대 `NEXT_PUBLIC_` 이름이나 클라이언트 코드에 넣지 않는다. smoke는 실제 PAID 응답의
payment ID, 12,000원, TEST 채널과 store를 검증하고 assertion 실패 시에도 `finally`에서
전액 취소를 요청한 뒤 `CANCELLED`를 재조회한다.
