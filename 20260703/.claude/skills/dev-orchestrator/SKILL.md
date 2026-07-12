---
name: dev-orchestrator
description: "TMDB 탐색 웹앱 기능 개발을 분석→계획→구현→검증까지 자동화하는 오케스트레이터. 기능 추가/구현/수정/QA 요청, 버그 수정, PRD 기반 신규 기능 개발 시 반드시 이 스킬을 사용. 요구사항이 PRD상 타당한지, 모호한 부분이 없는지 확인하는 단계(analyst)부터 시작한다. 후속 작업(이전 배치 재실행, 특정 태스크만 다시, QA 리젝트 재작업, 진행 중이던 기능 이어서 진행)도 이 스킬로 처리한다. 단순 질문·설명 요청에는 사용하지 않는다."
---

# Dev Orchestrator

TMDB 탐색 웹앱의 analyst→planner→implementer→qa 파이프라인을 조율한다.

## 실행 모드: 서브 에이전트

팀 모드(SendMessage 직접 통신)를 쓰지 않는다. analyst→planner→implementer→qa는 순차 파이프라인이고, 배치 내 병렬 fan-out은 오케스트레이터가 한 메시지에 여러 `Agent` 호출로 직접 처리하며, 배치 fan-in QA도 오케스트레이터가 순차 호출한다 — 팀원 간 실시간 조율이 필요한 지점이 없다. 대신 상태 연속성은 `02_progress_state.md`(오케스트레이터 단독 writer)로 유지한다.

## 에이전트 구성

| 에이전트 | subagent_type | model | 역할 | 스킬 | 출력 |
|---------|--------------|-------|------|------|------|
| analyst | `analyst` | opus | 적합성판단+모호성해소(PRD 통독) | `feature-analysis` | `00_analysis_result.md` |
| planner | `planner` | sonnet | 배치/의존성 산출(ARCH/ADR 통독) | `feature-planning` | `01_planner_tasks.md` |
| implementer | `implementer` | sonnet | 태스크 1건 구현 | `feature-implementation` | 반환값(상태+비고) |
| qa | `general-purpose` (에이전트 정의는 `qa`) | opus | 배치 단위 경계면 교차비교 | `boundary-qa` | 반환값(판정+유형+상세) |

## 워크플로우

### Phase 0: 컨텍스트 확인 (후속 작업 지원)

1. 현재 브랜치 확인 (`git branch --show-current`)
2. `_workspace/<브랜치명>/` 존재 여부 확인
3. 분기:
   - **미존재** → 초기 실행. Phase 1로
   - **존재 + 사용자가 특정 배치/태스크 재작업 요청** → 부분 재실행. `02_progress_state.md`를 읽어 해당 배치부터 재개(Phase 3의 해당 배치로 바로 진입, 이전 배치는 건드리지 않음)
   - **존재 + 세션이 끊겼다가 재개(크래시/토큰소진 등)** → 어느 Phase까지 끝났는지는 버전 필드가 아니라 **산출물 존재 여부**로 판단한다(마이그레이션 스크립트 불필요, 구버전 세션도 자동으로 맞물림):
     - `01_planner_tasks.md` 있음 → analyst 단계는 지난 것으로 본다(analyst 도입 전 세션이거나 이미 완료된 세션). `02_progress_state.md`를 읽어 마지막으로 완료 표시된 지점 파악, 미완료 태스크부터 Phase 3 재개
     - `01_planner_tasks.md` 없음 + `00_analysis_result.md` 있음 → analyst는 끝났으나 planner가 아직 → Phase 2-1(계획)부터 재개
     - 둘 다 없음 → Phase 2-0(분석)부터 재개
   - **존재 + 완전히 새로운 요청** → 기존 `_workspace/<브랜치명>/`를 `_workspace/<브랜치명>_prev_{YYYYMMDD_HHMMSS}/`로 이동 후 Phase 1

### Phase 1: 준비

1. 현재 브랜치가 `dev`/`main`이면 `AGENTS.md`의 prefix 컨벤션(`feat/`,`fix/`,`docs/`,`refactor/`,`chore/`,`test/`)에 맞는 새 브랜치를 `dev`에서 분기해 생성한다. 이미 적절한 작업 브랜치면 그대로 사용.
2. `_workspace/<브랜치명>/` 생성 — 브랜치명을 그대로 경로에 미러링한다(별도 네이밍 규칙 안 만듦).

### Phase 2-0: 분석

`Agent(subagent_type: "analyst", model: "opus", prompt: "사용자 요청 원문 그대로 + docs/00_PRD.md 경로 전달. feature-analysis 스킬 절차를 따르라.")`

오케스트레이터는 요청 원문을 사전 필터링하지 않고 그대로 analyst에게 전달한다 — 오케스트레이터는 PRD를 읽지 않으므로 판단 근거가 없고, 필터링하면 analyst와 같은 문서를 중복 판독하게 된다.

산출물을 `_workspace/<브랜치명>/00_analysis_result.md`로 저장. 적합성 판정을 확인한다:
- **pass** → Phase 2-1로 진행
- **reject** → 상세(어떤 Non-Goals/Constraints와 충돌했는지)를 사용자에게 보여주고 진행 여부를 확인받는다. 승인 없이는 Phase 2-1로 넘어가지 않는다(스코프 조정 후 재요청 또는 중단)

### Phase 2-1: 계획

`Agent(subagent_type: "planner", model: "sonnet", prompt: "00_analysis_result.md 경로 + docs/01_ARCHITECTURE.md, 02_ADR.md 경로 전달. feature-planning 스킬 절차를 따르라.")`

산출물을 `_workspace/<브랜치명>/01_planner_tasks.md`로 저장. "미정 사항"이 비어있지 않으면 사용자에게 먼저 확인받는다 — 임의로 배치 진행하지 않는다.

### Phase 3: 배치 실행 (반복)

`01_planner_tasks.md`의 배치를 순서대로 처리한다. **다음 배치는 현재 배치의 merge-back이 완전히 끝난 뒤에만 시작한다** — 이 게이트를 건너뛰면 다음 배치가 이전 배치의 변경사항이 반영 안 된 stale한 브랜치에서 시작하게 된다.

#### 3-1. worktree 수동 생성 + 병렬 fan-out

`Agent(isolation:"worktree")`의 자동 프로비저닝은 **쓰지 않는다** — 알려진 문제로, 지정한 브랜치를 무시하고 stale한 고정 커밋(이 환경에서 재현된 사례: `20260703/` 프로젝트 재배치 이전, 즉 서브디렉토리 구조 자체가 없던 시점)에서 worktree를 만드는 경우가 재현 확인됐다. 대신 오케스트레이터가 `AGENTS.md`의 worktree 생성 규칙을 직접 실행해 기준을 보장한다.

배치 내 태스크마다:

1. **오케스트레이터가 레포 루트에서 worktree를 직접 만든다**(현재 작업 브랜치 기준, `AGENTS.md` "Worktree 생성" 규칙 그대로):
   ```bash
   git worktree add -b worktree/{태스크슬러그} .claude/worktrees/{태스크슬러그} {현재 작업 브랜치}
   ```
2. **Agent를 `isolation` 없이 호출**, 작업 디렉토리를 프롬프트에 명시:
   ```
   Agent(subagent_type: "implementer", model: "sonnet",
         prompt: "작업 디렉토리: {worktree 경로}/20260703 — 반드시 이 안에서만 작업, 다른 경로는 건드리지 마라.
                  node_modules 없으면 새로 설치하지 말고 메인 체크아웃 것을 심볼릭 링크로 연결한다
                  (package-lock.json 동일함을 먼저 확인한 뒤).
                  작업 완료 후 이 worktree 안에서 직접 커밋까지 한다(add+commit, conventional 메시지) —
                  merge-back은 오케스트레이터가 이 커밋을 기준으로 처리한다.
                  태스크: {작업+근거}. feature-implementation 스킬 절차를 따르라.")
   ```

**한 메시지에 병렬**로 여러 Agent 호출.

배치가 태스크 1개뿐이면(예: 최초 배치의 `tmdb-client`처럼 아직 병렬 대상이 없음) worktree 없이 현재 브랜치에서 직접 처리해도 무방하다 — 격리는 "동시에 같은 디렉토리를 건드리는" 경우에만 필요하다.

각 결과(상태+비고)를 받아 `02_progress_state.md`에 태스크별로 즉시 append한다(배치 전체를 기다리지 않고 하나 끝날 때마다).

#### 3-2. merge-back

각 implementer worktree의 커밋(`worktree/{태스크슬러그}`)을 이번 배치의 기준 브랜치(직전 상태의 작업 브랜치)로 `git merge`한다. 전원 완료된 것을 확인한 뒤 진행하며, worktree/브랜치는 `AGENTS.md`의 기존 정리 절차(worktree remove → branch -d)로 정리한다.

#### 3-3. QA fan-in

merge-back이 끝난 뒤 배치당 QA **1회** 호출:

```
Agent(subagent_type: "general-purpose", model: "opus",
      prompt: "이 배치({배치명}, 태스크 목록)를 검증하라. 브랜치: {merge 완료된 브랜치}.
               이전 이력: _workspace/<브랜치명>/02_progress_state.md 참고.
               boundary-qa 스킬 절차를 따르라. qa 에이전트 정의(.claude/agents/qa.md) 역할로 행동하라.")
```

결과를 `02_progress_state.md`에 append.

#### 3-4. 판정 분기

- **통과** → 다음 배치로 진행(Phase 3 반복). 더 없으면 Phase 4.
- **리젝트 + 구현이슈** → 해당 태스크의 implementer를 QA 지적사항과 함께 재호출(3-1 방식 재사용, 같은 스코프만). 이 배치 안에서 최대 2회까지 재시도. 3번째도 실패하면 사용자에게 에스컬레이션(무엇이 계속 실패하는지 + QA 지적사항 요약) — 자동 재시도 중단.
- **리젝트 + 분해이슈** → planner를 재호출하되, **영향받은 배치만** 재분해 요청(이전에 QA 통과한 배치는 전달하지 않음, 전체 재시작 안 함). 재분해 결과로 3-1부터 재개.
- **리젝트 + 적합성이슈** → analyst를 재호출하지 않는다(같은 PRD를 다시 읽어도 판정이 바뀌지 않는다). 오케스트레이터가 즉시 사용자에게 에스컬레이션(어떤 Non-Goals/Constraints와 충돌했는지 + 지금까지 진행된 배치 현황). 구현이슈/분해이슈와 달리 자동 재시도 없음.

### Phase 4: 정리

1. 모든 배치 완료 후 `_workspace/<브랜치명>/`는 보존(감사 추적용, 삭제하지 않음)
2. 사용자에게 결과 요약 보고 — 완료된 배치, 발견됐던 이슈, 최종 브랜치 상태
3. 후속 피드백 요청(개선할 점, 워크플로우 변경 희망 여부) — 강요하지 않되 기회는 제공

## 데이터 흐름

```
[오케스트레이터]
  ├─ Agent(analyst) → 00_analysis_result.md (적합성 reject면 사용자 확인 게이트)
  ├─ Agent(planner) → 01_planner_tasks.md
  ├─ 배치N:
  │   ├─ [오케스트레이터가 worktree 수동 생성] → Agent(implementer×M) ── 병렬 ──┐
  │   │                                                      ↓
  │   │                                          02_progress_state.md (태스크별 append)
  │   ├─ merge-back (전원 완료 확인 후)
  │   ├─ Agent(qa) → 판정+유형+상세 → 02_progress_state.md append
  │   └─ 분기: 통과(다음 배치) / 구현이슈(implementer 재호출≤2) / 분해이슈(planner 부분 재호출) / 적합성이슈(재시도 없이 사용자 에스컬레이션)
  └─ 전 배치 완료 → 정리+보고
```

## 에러 핸들링

| 상황 | 전략 |
|------|------|
| analyst 적합성 판정 reject | 충돌 상세를 사용자에게 보여주고 진행 여부 확인, 미승인 시 Phase 2-1로 넘어가지 않고 중단(브랜치/`_workspace`는 보존) |
| implementer 1개 실패(상태:실패) | 비고 확인 후 원인이 명확하면 1회 자체 재호출, 불명확하면 사용자에게 즉시 보고 |
| QA 리젝트(구현이슈) | 같은 implementer 재호출, 배치당 최대 2회, 3회째 실패 시 사용자 에스컬레이션 |
| QA 리젝트(분해이슈) | planner 부분 재호출(영향 배치만), 전체 재시작 금지 |
| QA 리젝트(적합성이슈) | analyst 재호출 안 함(재시도 대상 아님) — 오케스트레이터가 즉시 사용자에게 에스컬레이션 |
| merge-back 충돌 | 배치 내 태스크가 실제로는 파일이 겹쳤다는 신호 — 분해이슈로 간주, planner에게 이 사실과 함께 재호출 |
| implementer가 "대상 파일이 없다"고 보고(worktree provisioning 문제) | 3-1을 오케스트레이터 수동 생성 방식으로 전환한 뒤로는 원칙적으로 발생하지 않아야 함 — 그래도 발생하면 오케스트레이터가 만든 worktree 경로가 실제로 맞는지(`git -C {경로} log --oneline -1`) 먼저 확인 |
| 세션 중단(토큰소진/크래시) | 재개 시 Phase 0에서 `02_progress_state.md` 읽어 마지막 완료 지점부터 재개 |

## 테스트 시나리오

### 정상 흐름
1. 사용자가 "히어로 캐러셀 기능 추가해줘" 요청
2. Phase 0: `_workspace/` 없음 → 초기 실행
3. Phase 1: `feat/hero-carousel` 브랜치 생성, `_workspace/feat/hero-carousel/` 생성
4. Phase 2-0: analyst 호출 → PRD 대조 결과 적합성 pass, 모호성 없어 인터뷰 생략 → `00_analysis_result.md` 산출
5. Phase 2-1: planner 호출 → 배치1(tmdb-client), 배치2(home) 산출
6. Phase 3: 배치1 단일 태스크 처리+QA 통과 → merge-back → 배치2 처리+QA 통과 → merge-back
7. Phase 4: 정리 및 보고

### 에러 흐름 (구현이슈)
1. 배치2(home/search/detail 병렬)에서 QA가 "home↔ui ScrollRail 사용법 불일치"로 리젝트, 유형: 구현이슈
2. 오케스트레이터가 home 담당 implementer만 QA 지적사항과 함께 재호출
3. 재작업 결과 QA 재검증 → 통과 → 다음 배치 진행
4. (만약 2회 재작업 후에도 리젝트라면) 오케스트레이터가 사용자에게 에스컬레이션하고 자동 진행 중단

### 에러 흐름 (적합성이슈, Phase 2-0)
1. 사용자가 "찜하기 기능도 추가해줘" 요청
2. Phase 2-0: analyst가 PRD §2 Non-Goals("찜하기/리뷰 작성/평점 부여 등 개인화 기능")와 충돌 확인 → 적합성 판정 `reject`
3. 오케스트레이터가 충돌 상세를 사용자에게 보여주고 진행 여부 확인
4. 사용자가 스코프에서 찜하기를 제외하기로 결정 → 남은 요청으로 analyst 재호출(또는 사용자가 중단 결정 시 여기서 종료)

### 에러 흐름 (적합성이슈, QA 단계)
1. 배치 구현 결과, implementer가 사용자별 검색 기록을 남기기 위해 로컬 스토리지가 아닌 서버 저장 구조로 구현
2. QA가 "PRD Non-Goals(개인화 기능) 및 ADR-0002(DB 미사용) 위반"으로 리젝트, 유형: 적합성이슈
3. 오케스트레이터가 analyst를 재호출하지 않고 즉시 사용자에게 에스컬레이션 — 자동 재시도 없음
