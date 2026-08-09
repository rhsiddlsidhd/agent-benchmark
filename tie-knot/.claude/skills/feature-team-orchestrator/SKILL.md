---
name: feature-team-orchestrator
description: "이 프로젝트(tie-knot)에서 TODO.md '새 피처' 섹션급 풀스택 신규 기능을 처음부터 끝까지(API 설계→UI 설계→DB 설계→구현→경계면 검증→통합 테스트→PR) 구현할 때 반드시 사용. '~기능 만들어줘/추가해줘/구현해줘' 같은 신규 기능 요청뿐 아니라, 이미 이 스킬로 진행 중이던 기능의 재실행·부분 수정·보완·설계 변경·다시 시작·이전 결과 개선 요청에도 사용한다. 새 엔드포인트·새 화면·새 데이터모델이 동시에 얽리는 `feat` 성격 작업 전용이다 — 단순 버그 수정(`fix`), 성능 개선, 프레젠테이션만 바꾸는 UI 수정에는 쓰지 않는다(설계 팬아웃 자체가 무의미해서 오버킬)."
---

# Feature Team Orchestrator

풀스택 신규 기능(`feat`) 구현을 위해 API/UI/DB 설계자 팀 → 백엔드/프론트 구현자+경계면 검증자 팀 → 통합 테스트 → PR로 이어지는 5-Phase 파이프라인을 조율한다. 이 스킬 자체가 PM 역할이다 — 별도 PM 에이전트를 스폰하지 않고, 이 스킬을 실행하는 주체(리더)가 요구사항 분해·브랜치/워크트리 관리·Phase 게이트·통합 리포트·PR 생성을 직접 담당한다.

**스코프:** `feat` prefix 작업만. `{domain}`은 `docs/GIT.md` 브랜치 prefix(사실상 `feat` 고정), `{name}`은 브랜치 슬러그다 — `_workspace/{domain}/{name}/`은 브랜치명 `{domain}/{name}`을 그대로 미러한다(비즈니스 영역 그룹핑 아님).

**진행 방식:** 기본은 순차 — 한 번의 실행은 피처 하나(`{domain}/{name}`)를 Phase 0부터 Phase 5(또는 사람 개입이 필요한 블로킹 지점)까지 완주하고 종료한다. 완료 후 다음 피처로 자동 이어가지 않는다.

**선행 조건(별도 작업, 이 스킬 밖):** 이 프로젝트의 pre-commit 훅(`npm run test:coverage`, 파일당 line coverage 80% 강제)이 기존 9개 파일(예: `src/server/actions/signupUser.ts` 등)에서 이미 미달 상태다. 하네스가 새로 건드리지 않는 파일이라도 훅이 전체 스코프로 돌면 커밋이 막힐 수 있다 — 이 부채 해소(또는 pre-commit을 diff-scope로 바꾸는 툴링)는 이 하네스의 책임이 아니라 별도 선행 작업이다. 실행 전 확인할 것.

## 실행 모드: 하이브리드

| Phase | 모드 | 이유 |
|-------|------|------|
| Phase 0 | 리더 단독 | 요구사항 분해·브랜치 확정은 조율 대상이 없음 |
| Phase 1 (설계 팬아웃) | 에이전트 팀 | api-designer의 응답 shape이 ui-designer의 상태설계·db-migrator의 필드명에 직접 영향 |
| Phase 2+3 (구현+검증 루프) | 에이전트 팀 (+워크트리 격리) | backend-impl/frontend-impl이 동시에 파일을 쓴다 — git 레이스(같은 index/워킹트리 공유) 방지가 비용보다 중요해서 워크트리로 격리 |
| Phase 4 (통합+테스트) | 서브 에이전트 | test-suite 1명, 이미 Phase2/3에서 교차검증 끝난 상태라 팀 통신 불필요 |

## 에이전트 구성

| 팀원 | 활성 Phase | model | 스킬 |
|------|-----------|-------|------|
| api-designer | 1 | opus | — (docs 직접 참조) |
| ui-designer | 1 | opus | — |
| db-migrator | 1 | opus | — |
| backend-impl | 2+3 | sonnet | — |
| frontend-impl | 2+3 | sonnet | — |
| boundary-verifier | 2+3 (상주) | opus | boundary-verify |
| test-suite | 4 | sonnet | — |
| (리더 = 이 스킬 실행 주체) | 0~5 | — | 이 스킬 자체 |

## 워크플로우

### Phase 0: 브랜치 확정 + 요구사항 분석

1. 기능 슬러그(`{name}`)를 사용자 요청에서 도출(kebab-case, 영문). `{domain}`은 `feat`. 애매하면 사용자에게 짧게 확인.
2. 브랜치 상태 확인 (리더의 메인 작업 디렉토리에서 — 워크트리 아님):
   - 로컬 브랜치 `feat/{name}` 이미 존재 → **재개**. `git checkout feat/{name}`
   - 존재하지 않음 → **초기 실행**. `dev`를 최신화(`git checkout dev && git pull`)하고 `git checkout -b feat/{name} dev`
3. `_workspace/feat/{name}/` 존재 여부로 세분화:
   - **미존재** → 신규. 디렉토리 생성 후 4번으로
   - **존재 + 부분 수정/재실행 요청** → 기존 산출물을 읽고, 어느 Phase까지 끝났는지(`00_requirements.json`의 `passes`, `03_boundary/`, `04_*` 존재 여부) 판단해 **해당 Phase부터만** 재개
   - **존재 + 완전히 새 요구사항** → 기존 `_workspace/feat/{name}/`을 `_workspace/feat/{name}_{YYYYMMDD_HHMMSS}/`로 이동 후 새로 생성
4. 요구사항을 분해해 `_workspace/feat/{name}/00_requirements.json` 작성 (리더 단독):
   ```json
   {
     "branch": "feat/{name}",
     "summary": "기능 한줄 요약",
     "items": [
       { "id": "REQ-1", "description": "...", "acceptance": "...", "passes": false }
     ]
   }
   ```
5. **`passes` 플래그는 리더만 갱신한다** — Phase4에서 acceptance 충족을 리더가 직접 판단했을 때만 `true`. 팀원이 이 파일을 쓰지 않도록 kickoff 메시지에서 명시.

### Phase 1: 설계 팬아웃 (에이전트 팀)

1. 유휴 스폰 (한 메시지 병렬): api-designer/ui-designer/db-migrator (model: opus) → 3개 id 확보
2. kickoff SendMessage 공통: 동료 2명의 id, `_workspace/feat/{name}/00_requirements.json` 경로+배경, "일반 텍스트는 동료에게 안 보임 — SendMessage만 유효", "동료 메시지는 자동전달, 새 지시로 처리", **종료조건**(산출물 완료+피드백 반영 시 리더에게 알림, **동일 쟁점 3라운드 초과 시 현재 안 확정+"미해결 쟁점" 표시, 추가 왕복 금지**)
3. 3명이 병렬로 `01_api_contract.md` / `01_ui_flow.md` / `01_db_schema.md` 작성, SendMessage로 조율
4. 완료 알림 → 리더가 3개 산출물 Read → **PM 검토 사이클**(최대 3회): 문제 발견 시 SendMessage로 구체 코멘트 → 수정 → 재검토. 3회 후 미승인이면 Phase 전환 **차단**, 쟁점 요약해 사용자에게 보고 후 대기
5. 승인되면 3명에게 종료 요청

### Phase 2+3: 구현 + 생성-검증 루프 (에이전트 팀, 워크트리 격리, 상주 QA)

Phase2("구현")와 Phase3("검증 루프")는 별도 팀 재구성 없이 **하나의 연속 세션**으로 운영한다.

**표준 브랜치 `feat/{name}`은 TODO.md/GIT.md가 말하는 "작업 1개 = 브랜치 1개"의 그 브랜치다.** 아래 backend/frontend 서브 워크트리는 그 안에서 두 에이전트의 동시 쓰기(git 레이스)를 막는 **내부 임시 메커니즘**일 뿐이고, Phase 종료 시 표준 브랜치로 전부 합쳐진 뒤 제거된다 — PR/dev 시점에서 보면 여전히 "1 작업 = 1 브랜치 = 1 PR" 그대로다.

1. 워크트리 생성 (리더가 표준 브랜치 위에서):
   ```
   git worktree add -b feat/{name}--backend  ../tie-knot--{name}-backend  feat/{name}
   git worktree add -b feat/{name}--frontend ../tie-knot--{name}-frontend feat/{name}
   ```
   각 워크트리에서 `npm install` 새로 (node_modules 심볼릭 금지)
2. 유휴 스폰 (한 메시지 병렬): backend-impl(sonnet), frontend-impl(sonnet), boundary-verifier(opus, `boundary-verify` 스킬 사용 지시 포함) → id 확보. backend-impl/frontend-impl에게 각자 워크트리 절대경로를 작업 위치로 명시
3. kickoff SendMessage 공통:
   - 동료 2명의 id
   - `01_api_contract.md`/`01_ui_flow.md`/`01_db_schema.md` 경로(표준 브랜치 쪽 `_workspace/`, 워크트리 안이 아님)
   - "표준 브랜치는 TODO.md/GIT.md의 '작업 1개=브랜치 1개' 그 자체다. 지금 워크트리는 병렬 쓰기 충돌을 막는 내부 메커니즘이고 이 Phase 끝나면 사라진다"
   - frontend-impl에게: "backend 완성 기다리지 말고 계약 shape 그대로 mock부터 만들어 전부 연결하라(mock-first)"
   - backend-impl/frontend-impl에게: "유닛(엔드포인트/화면) 하나 끝나면 자기 워크트리 브랜치에 GIT.md 포맷(`feat: ...`)으로 커밋 → boundary-verifier에게 검증 요청 → PASS 받으면 그 즉시 리더에게 병합 요청 SendMessage(브랜치명+커밋 확인 포함) — 다 끝날 때까지 몰아두지 말 것"
   - boundary-verifier에게: "완성 알림마다 즉시 판정, 두 워크트리 절대경로를 동시에 Read해서 교차비교, REDO 카운터는 `_workspace/feat/{name}/03_boundary/{endpoint-slug}.json`에 기록"
   - 종료조건: 모든 유닛이 PASS(또는 강제 PASS) 되면 각자 리더에게 완료 알림
4. **로컬 merge는 리더만 수행한다.** 구현자로부터 "유닛 X PASS, 병합 요청" SendMessage를 받으면, 리더가 표준 브랜치에서 `git merge feat/{name}--backend`(또는 `--frontend`)를 그 즉시 실행 — 몰아두지 않는다.
   - 병합 충돌 시 강제 해결 금지. 리더가 양쪽 diff 확인 후 자명하면 직접 resolve+재검증 요청, 애매하면 사용자 에스컬레이션
   - **pre-commit 훅과 boundary-verifier 판정은 별개 축이다.** FIX/REDO 반영 재커밋도 pre-commit(lint+coverage80%+typecheck)을 다시 통과해야 한다 — 이건 구현자가 원인 해결 후 재시도하는 정상 루프. **같은 유닛에서 pre-commit이 연속 3회 막히면** 구현자가 리더에게 에스컬레이션(이 카운트는 파일 저장 없이 구현자 세션 내 계산으로 충분 — REDO 카운터와는 별개)
   - `[MANUAL_INTERVENTION_REQUIRED]`로 강제 PASS된 유닛도 pre-commit은 그대로 통과해야 커밋된다 — 커밋 메시지에 `[MANUAL_INTERVENTION_REQUIRED]` 표기를 남겨 이력에서 식별되게 한다
5. 진행 중 리더 역할:
   - `[MANUAL_INTERVENTION_REQUIRED]` 에스컬레이션(2회 REDO 초과) 수신 시, 설계 재검토가 필요하면 api-designer를 단독 재스폰해 해당 부분만 재설계. **재설계 결과는 리더가 backend-impl/frontend-impl 양쪽에 직접 SendMessage로 재전달한다**(재스폰된 api-designer는 이미 종료된 frontend-impl의 id를 모르므로 직접 통신 불가 — 반드시 리더 경유)
   - 완료 알림에서 예상 밖으로 왕복이 길어지는 팀원이 보이면 SendMessage로 개입
6. 3명 모두 완료 알림 → 리더가 `03_boundary/`의 모든 판정 파일 Read해서 전체 상태 확인 → 3명에게 종료 요청
7. **워크트리 정리**: 두 워크트리의 커밋이 모두 표준 브랜치에 병합됐는지 확인(`git log feat/{name}--backend..feat/{name}`이 비어있어야 함, frontend도 동일) 후 `git worktree remove` + 서브 브랜치 로컬 삭제. 표준 브랜치만 남긴다.

### Phase 4: 통합 + 테스트 (서브 에이전트)

워크트리가 이미 정리됐으므로 표준 브랜치(리더의 메인 작업 디렉토리) 위에서 진행한다.

1. 리더가 `_workspace/feat/{name}/04_integration_report.md` 작성: Phase1~3 산출물 요약, `03_boundary/MANUAL_INTERVENTION_REQUIRED.md`에 남은 항목(있다면) 명시, `00_requirements.json`의 각 item acceptance 충족 여부 판단 → 충족된 item만 `passes:true`
2. `Agent(subagent_type:"test-suite", model:"sonnet", ...)` 단독 호출 — `04_integration_report.md` 경로 + 전체 `_workspace/feat/{name}/` 경로 전달, 골든패스/에러흐름 통합 테스트 작성 지시
3. 반환값 + `04_test_report.md` 수집. 최종 커밋(테스트 추가분)도 표준 브랜치에 직접

### Phase 5: 정리 + PR

1. `_workspace/feat/{name}/` 보존(삭제하지 않음 — 브랜치는 나중에 머지되면 삭제돼도 이 디렉토리는 남는다. 재실행 시 Phase0 3번 분기가 처리)
2. **모든 REQ의 acceptance가 충족됐다면(Phase4 통과), 확인질문 없이 `gh pr create --base dev`로 PR을 생성한다.** PR 본문에 `04_integration_report.md` 요약과 `MANUAL_INTERVENTION_REQUIRED` 항목(있다면 반드시)을 포함시킨다. **Merge는 항상 사람이 직접 한다** — 하네스는 merge를 실행하지 않고, auto-merge 설정도 걸지 않는다.
3. TODO.md 체크박스는 건드리지 않는다(TODO.md 자체가 "체크리스트 갱신은 dev 브랜치에서 진행"이라고 명시 — 아직 머지 전이라 시점이 안 맞음). 대신 최종 보고에 "머지 후 TODO.md 체크박스 갱신 필요"를 리마인드로 남긴다.
4. 사용자에게 요약 보고: 완료된 REQ 항목, 남은 `MANUAL_INTERVENTION_REQUIRED` 항목(있다면 강조), PR 링크, TODO.md 리마인드, 생성/수정된 주요 파일 목록

## 데이터 흐름

```
[리더] Phase0: dev → checkout -b feat/{name} → 00_requirements.json
  │
  ▼ (팀 스폰 + id릴레이, 표준 브랜치 위에서)
[api-designer]⇄[ui-designer]⇄[db-migrator]  → 01_api_contract.md / 01_ui_flow.md / 01_db_schema.md
  │ (리더 검토 최대 3회, 승인 후 팀 종료)
  ▼ (표준 브랜치에서 서브 워크트리 2개 분기 + 팀 재구성)
[backend-impl @ worktree--backend] ⇄ [frontend-impl @ worktree--frontend] ⇄ [boundary-verifier(상주, 양쪽 교차Read)]
  │  유닛 PASS마다: 서브브랜치 커밋 → 구현자가 리더에게 병합요청 → 리더가 표준 브랜치로 merge → 03_boundary/{endpoint}.json 갱신
  ▼ (전체 PASS → 워크트리 제거 → 팀 종료 → 서브 호출)
[test-suite] → 04_test_report.md + 실제 테스트 코드 (표준 브랜치에 직접 커밋)
  ▼
[리더] 04_integration_report.md, 00_requirements.json passes 갱신 → PR 생성(`gh pr create --base dev`) → 사용자 보고
```

## 에러 핸들링

| 상황 | 전략 |
|------|------|
| Phase1 팀원 1명 실패/중지 | SendMessage 상태 확인 → 재시작. 재실패 시 해당 역할만 재스폰(산출물은 파일로 존재, 새 스폰이 Read해서 이어감) |
| Phase1 3회 검토 후 미승인 | Phase 전환 차단, 쟁점 요약해 사용자에게 보고 후 대기 |
| Phase2+3 팀원 1명 실패/중지 | SendMessage 상태 확인 → 재시작. 실제 코드가 워크트리에 파일로 존재하므로 새 스폰이 같은 워크트리 경로를 이어받기 쉬움 |
| pre-commit 훅이 lint/coverage/typecheck로 커밋 차단 | boundary-verifier PASS와 별개의 기계적 게이트 — 구현자가 원인 해결 후 재커밋. 같은 유닛에서 연속 3회 실패하면 리더에게 에스컬레이션 |
| 표준 브랜치 로컬 merge 충돌 | 강제 해결 금지. 리더가 양쪽 diff 확인 후 자명하면 직접 resolve+재검증 요청, 애매하면 사용자 에스컬레이션 |
| boundary-verifier가 같은 경계면 2회 REDO | 강제 PASS + `MANUAL_INTERVENTION_REQUIRED` 플래그(커밋 메시지에도 표기), 리더에게 즉시 에스컬레이션. 최종 보고서에 반드시 명시 |
| Phase2+3 응답 없음 장기화 | SendMessage 상태 확인 시도 → 무응답 지속 시 현재까지 파일 산출물로 부분 진행, 미완료 항목은 보고서에 명시 |

## 테스트 시나리오

### 정상 흐름
1. 사용자: "답례품 주문에 배송지 메모 기능 추가해줘" 요청
2. Phase0: `name="delivery-memo"` → `dev`에서 `feat/delivery-memo` 분기 → `_workspace/feat/delivery-memo/00_requirements.json` 작성
3. Phase1: 3명 팀 구성 → 3개 설계 산출물 → 리더 1회 검토 후 승인
4. Phase2+3: 워크트리 2개 분기 → backend가 필드 추가+API 반영 → PASS → 커밋 → 리더에게 병합요청 → 리더가 표준 브랜치로 merge → frontend가 폼에 입력란 추가+연동 → PASS → 커밋 → 병합요청 → merge → 전체 PASS → 워크트리 제거
5. Phase4: test-suite가 주문 생성 골든패스 테스트 작성, 통과, 표준 브랜치에 커밋
6. Phase5: `00_requirements.json` REQ 전부 `passes:true` → `gh pr create --base dev` 자동 생성 → 사용자에게 PR 링크+TODO.md 리마인드와 함께 보고

### 에러 흐름
1. Phase2+3에서 `/api/order/create` 응답 shape을 boundary-verifier가 REDO 판정 (설계상 memo 필드 위치가 요청 스키마와 실제 필요가 어긋남)
2. 1차 수정 후에도 REDO(2회째) → `redoCount:2` 기록, 강제 PASS + `MANUAL_INTERVENTION_REQUIRED.md` 기록 + 커밋 메시지 표기, 리더에게 에스컬레이션
3. 리더가 api-designer 단독 재스폰해 해당 필드 설계만 재검토 → 수정안을 리더가 backend-impl/frontend-impl 양쪽에 직접 SendMessage로 전달
4. Phase4 통합 리포트에 "memo 필드 설계 1회 재검토됨" 명시, Phase5 PR 본문과 최종 보고에서도 강조
