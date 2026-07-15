---
name: tennis-pulse-orchestrator
description: tennis-pulse 프로젝트에서 기능 추가/수정/버그수정 요청이 들어오면 반드시 이 스킬로 오케스트레이션한다. intake→planner→api-spec→backend/frontend→qa 6개 에이전트를 도메인 단위로 게이팅·스폰·종합 보고한다. 크롤러, 서버리스 함수, API 엔드포인트, 프론트 컴포넌트/훅 등 backend/frontend/api 어디든 손대는 요청이면 트리거. 후속 작업도 이 스킬 사용: 이 도메인만 다시, 방금 결과 수정, API 스펙 갱신, 이전 계획 기반으로 계속, QA 다시 돌려줘.
---

# tennis-pulse-orchestrator

tennis-pulse의 intake/planner/api-spec/backend/frontend/qa 6개 에이전트를 조율해 기능 요청을 완료까지 이끄는 오케스트레이터. 각 에이전트 지시문은 `.claude/agents/{name}.md`.

## 실행 모드: 하이브리드 (도메인별 동적 결정)

| phase 유형 | 모드 | 이유 |
|-----------|------|------|
| intake | 서브 에이전트 | 요구사항 명확화 판단, 팀 통신 불필요 — 단 `pending` 있으면 오케스트레이터가 재스폰(반복 가능, 1회성 아님) |
| planner | 서브 에이전트 | 1회성 판단, 팀 통신 불필요 |
| api-spec | 서브 에이전트 | 단독 문서 작성, 조율 대상 없음 |
| backend/frontend | **조건부** — 같은 domain에 둘 다 있으면 팀, 하나만 있으면 서브 | 팀원 산출물(스펙 이탈)이 서로의 작업 방향에 영향을 줄 때만 팀모드 승격 비용이 정당화됨 |
| qa | 서브 에이전트(`general-purpose` 타입 고정) | 독립 검증, 조율 불필요 — 단 Explore로는 Grep/스크립트 실행 불가하므로 general-purpose 필수 |

고정된 하이브리드(Phase별 모드 표)가 아니라 **도메인 그룹마다 backend+frontend 동시존재 여부로 매번 판단**하는 동적 하이브리드다.

## 에이전트 구성

| 에이전트 | subagent_type | model | 스킬 | 출력 |
|---------|--------------|-------|------|------|
| intake | `intake`(커스텀 정의 파일 프롬프트로 포함, 실제 스폰은 `general-purpose`) | opus | 없음(판단 전용) | `_workspace/00_request.yaml` |
| planner | 위와 동일 방식 | opus | 없음(판단 전용) | `_workspace/01_plan.yaml` |
| api-spec | 위와 동일 방식 | opus | `write-api-spec` | `docs/api/{domain}.md` |
| backend | 위와 동일 방식 | sonnet | `script-impl` 또는 `api-impl`(agent가 `path`의 CLAUDE.md Convention 보고 흐름 선택, 언어는 각 스킬이 내부에서 스스로 확인) | 구현 코드 + 완료보고서 |
| frontend | 위와 동일 방식 | sonnet | `frontend-impl` | 구현 코드 + 완료보고서 |
| qa | 위와 동일 방식 | opus | 없음(검증 전용) | 검증 리포트 |

**공통:** 이 프로젝트의 6개 에이전트는 전부 `Agent` 도구 호출 시 `subagent_type: "general-purpose"`로 스폰한다(Explore는 Write/Bash 불가, Plan은 설계 전용이라 구현 산출물을 못 냄 — general-purpose가 6개 역할 전부에 필요한 최소공통 툴셋). 역할 차이는 `.claude/agents/{name}.md` 내용을 프롬프트에 포함시켜서 만든다.

## Worktree 전략

**격리 단위: domain.** phase(agent) 단위로 쪼개지 않는다 — 팀모드(backend+frontend 동시)일 때 backend가 SendMessage로 보내는 `type_source`는 파일 경로 참조이지 내용 전송이 아니라서, 두 agent가 별도 worktree에 있으면 frontend가 그 파일에 물리적으로 접근할 수 없다. domain 안의 api-spec/backend/frontend/qa phase는 전부 같은 worktree를 공유한다.

**격리 조건: domain이 2개 이상일 때만.** 서로 다른 domain이 병렬로 진행될 가능성이 있을 때만 격리 비용을 지불한다. `01_plan.yaml`의 domain이 1개뿐이면 worktree 없이 현재 작업 브랜치에서 직접 진행한다.

**브랜치 네이밍: 작업 브랜치 접미사 결합 (nest 아님 — dry-run에서 git 자체 제약으로 실패 확인됨).** 최초 설계는 `{작업 브랜치}/{domain}`(하위 nest)이었으나, `feat/search-and-dark-mode` 브랜치가 이미 존재하는 상태에서 `feat/search-and-dark-mode/backend-posts`를 만들면 git이 거부한다 — git ref는 파일시스템처럼 동작해 `refs/heads/feat/search-and-dark-mode`가 이미 리프(파일)로 존재하면 그 밑을 디렉토리로 쓸 수 없다(`cannot lock ref ...: ... exists`, 실측 확인됨). 대신 `{작업 브랜치}-{domain}`(예: `feat/search-and-dark-mode-backend-posts`) — 기존 prefix(`feat/`) 디렉토리 안의 형제 리프로 생성되므로 충돌이 없다. Global CLAUDE.md의 prefix 컨벤션 표에 없는 새 prefix(`worktree/` 등)를 발명하지 않는다는 원칙은 그대로 지켜진다(맨 앞 prefix는 안 바뀜, 접미사만 늘어남).

**생성 (오케스트레이터가 Phase 3-0에서 직접 실행, `-b` 플래그 필수 — Global CLAUDE.md 규칙):**
```
git worktree add -b {작업 브랜치}-{domain} .claude/worktrees/{작업브랜치를 -로 이은 것}-{domain} {작업 브랜치}
```
디렉토리명은 브랜치명을 그대로 반영하되 슬래시를 `-`로 이어붙인다(Global CLAUDE.md 예시와 동일 관례). `path`(planner가 결정한 물리 경로)의 해석 방식은 바뀌지 않는다 — worktree 자체가 레포 전체의 완전한 체크아웃이라 그 루트 기준 상대경로 그대로 유효하다.

**주의(실측 확인됨): git 레포 루트 ≠ tennis-pulse 프로젝트 루트.** 이 레포는 `tennis-pulse`/`film-wiki` 등 여러 프로젝트를 함께 담은 모노레포라, 레포 루트는 tennis-pulse 상위 디렉토리다. worktree는 항상 레포 전체를 체크아웃하므로, 생성된 worktree 경로 바로 밑에는 `frontend/`, `backend/`가 아니라 `tennis-pulse/`(그리고 다른 프로젝트 폴더들)가 있다. 그래서 phase agent에게 전달하는 **"작업 디렉토리"는 `{worktree 경로}/tennis-pulse`**여야 한다(worktree 경로 자체가 아님) — 이 안에서만 `path`(`frontend/api/` 등)가 그대로 풀린다. node_modules/`.venv` 심볼릭 링크도 이 하위(`{worktree 경로}/tennis-pulse/frontend/node_modules` 등)에 건다. `git worktree remove`/`branch -d` 대상은 여전히 worktree 최상위 경로다(레포 단위 명령이라 프로젝트 서브경로와 무관).

**주의(실측 확인됨): `_workspace/`는 worktree 안에 없다.** `00_request.yaml`/`01_plan.yaml`은 커밋된 적 없는 untracked 파일이라, worktree(커밋 히스토리 기준 체크아웃)엔 애초에 안 나타난다. 그래서 phase agent에게 `request_path`를 넘길 땐 worktree 기준 상대경로가 아니라 **메인 체크아웃의 절대경로**(`{메인 체크아웃 경로}/_workspace/00_request.yaml`)로 전달한다 — agent는 파일시스템 전체에 접근 가능하므로 절대경로면 worktree 안에서도 그대로 읽힌다. `docs/api/{domain}.md`(spec_path)는 반대로 각 worktree 안에서 새로 커밋되는 파일이라 이 문제가 없다.

**merge-back 시점: QA 통과 후에만.** QA가 위반을 발견한 상태에서 작업 브랜치로 병합하지 않는다 — 검증 안 된 코드가 먼저 섞이는 것을 막기 위함. 재작업은 같은 worktree 안에서 이어가고(새 worktree 재생성 안 함), 재검증 통과 후 병합한다.

**정리 절차의 전제 차이 (문서 대조 주의):** Global CLAUDE.md의 worktree 정리 절차(`remove → branch -d`)는 "PR 머지 완료"를 전제로 서술돼 있다. 하지만 domain 브랜치는 PR 대상이 된 적 없는, 작업 브랜치 내부의 임시 분기다 — 여기서는 **"로컬 merge-back 완료"**를 정리 트리거로 삼는다. 명령어 자체는 동일하게 재사용하되, 전제는 다르다는 점을 명시해 문서-구현 불일치를 방지한다.

**merge-back 직렬화:** 여러 domain이 동시에 QA를 통과해도, merge-back(작업 브랜치로의 `git merge`)은 오케스트레이터가 한 번에 하나씩 순차 수행한다 — 전부 같은 작업 브랜치를 대상으로 하는 git 명령이라 동시 실행 시 경합 위험이 있다.

## 워크플로우

### Phase 0: 컨텍스트 확인 (후속 작업 지원)

1. `_workspace/00_request.yaml`, `_workspace/01_plan.yaml` 존재 여부 확인
2. 실행 모드 결정:
   - **둘 다 미존재** → 초기 실행. Phase 1로
   - **`00_request.yaml`만 존재(`01_plan.yaml` 미존재)** → Phase 1 중간에 끊긴 상태(인터뷰 도중 세션 종료 등). `pending` 확인해서 남아있으면 이어서 사용자에게 질문, 없으면 바로 Phase 2로 재개
   - **`01_plan.yaml` 존재 + 사용자가 특정 domain/phase 재실행·수정 요청** → 부분 재실행. 해당 domain의 phase만 `status: pending`으로 되돌려 재스폰(다른 domain은 건드리지 않음), intake/planner는 다시 안 돌림
   - **`01_plan.yaml` 존재 + 사용자가 새 기능 요청(기존과 무관)** → 새 실행. 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동 후 Phase 1
3. 부분 재실행 시: 재스폰 대상 에이전트 프롬프트에 이전 산출물 경로(구현 코드/QA 리포트)를 포함해, 기존 결과를 읽고 피드백 반영하도록 지시
4. `git worktree list`로 `.claude/worktrees/` 잔존 여부 확인 — 이전 세션이 중단(크래시/토큰소진)돼 merge-back 전에 끊긴 domain worktree가 남아있을 수 있다. 이번 요청과 같은 domain이면 3-0에서 재사용, 무관한 domain이면 임의 삭제하지 않고 사용자에게 알려 처리 여부 확인

### Phase 1: 브랜치 준비 및 요구사항 명확화

1. **브랜치 준비** — 현재 브랜치가 `dev`/`main`이면 Global CLAUDE.md의 prefix 컨벤션(`feat/`,`fix/`,`docs/`,`refactor/`,`chore/`,`test/`)에 맞는 새 브랜치를 `dev`에서 분기해 생성한다(요청 성격에 맞는 prefix 선택 + 요청 요약을 kebab-case로 붙임). 이미 적절한 작업 브랜치면 그대로 사용. 이 브랜치가 이후 모든 domain worktree의 기준점(base)이 된다.
2. `intake` 스폰(서브 에이전트, model: opus):
```
Agent(subagent_type: "general-purpose", model: "opus",
      prompt: ".claude/agents/intake.md 전문 + 사용자 요청 원문 전달")
```
3. 완료 알림에서 `_workspace/00_request.yaml` 확보, `pending` 배열 확인:
   - **비어있음** → Phase 2로
   - **항목 있음** → 각 id의 `requirements.{id}.question` 텍스트를 모아 **평문으로 사용자에게 직접 질문**(구조화 질문 도구 안 씀 — 개방형 사실확인이라 선택지형 도구는 안 맞음) → 답변 받으면 원본 요청 + 이번 답변을 묶어 `intake` 재스폰(이전 항목 id 유지 지시 포함) → `_workspace/00_request.yaml` 갱신 → 다시 `pending` 확인(비워질 때까지 반복, 상한 없음 — 사용자가 직접 관여하는 루프라 에이전트간 협의 폭주 리스크와 성격이 다름)
4. 정상 포맷 예시: `references/00-request-example.yaml`

### Phase 2: 계획 수립

`planner` 스폰(서브 에이전트, model: opus):
```
Agent(subagent_type: "general-purpose", model: "opus",
      prompt: ".claude/agents/planner.md 전문 + _workspace/00_request.yaml 경로 전달")
```
완료 알림에서 `_workspace/01_plan.yaml` 확보. 파일이 없거나 스키마가 어긋나면(도메인 그룹 구조가 아니거나 `agent` 값이 `api-spec|backend|frontend|qa` 밖이면) 1회 재스폰, 재실패 시 사용자에게 원문 노출하고 수동 확인 요청. 정상 포맷 예시: `references/01-plan-example.yaml`.

### Phase 3: 도메인별 게이팅 및 스폰

`_workspace/01_plan.yaml`의 `domains[]`를 순회한다. **서로 다른 domain은 완전 독립 — 한 메시지에 병렬로 게이팅 진행 가능**(같은 domain 내부만 depends_on으로 순서 강제).

#### 3-0. domain worktree 생성

domain이 2개 이상이면 각 domain마다 "Worktree 전략"(위 섹션)에 따라 worktree를 만든다(여러 domain을 한 메시지에 순차 Bash 호출 — 각각 독립 경로/브랜치라 경합 없음). domain이 1개뿐이면 이 단계를 생략하고 현재 작업 브랜치에서 직접 진행한다.

부분 재실행(Phase 0)으로 재진입한 domain은 `git worktree list`로 해당 domain 브랜치의 worktree가 이미 있는지 먼저 확인한다 — 있으면 재생성하지 않고 그대로 재사용(`-b`로 이미 존재하는 브랜치를 다시 만들면 에러, Global CLAUDE.md의 동일 브랜치 동시 체크아웃 금지 규칙과도 충돌), 없으면(이전에 merge-back까지 끝나 정리된 경우) 새로 생성한다.

worktree가 생성된 domain은, 아래 phase들의 프롬프트에 **"작업 디렉토리: {worktree 경로}/tennis-pulse — 반드시 이 안에서만 작업, 다른 경로는 건드리지 마라"**를 필수로 포함한다(`/tennis-pulse` 필수 — 위 "주의" 참고, 레포 루트와 프로젝트 루트가 다르다). node_modules/`.venv` 등 설치 자산은 각 worktree에서 lockfile/requirements.txt 기준으로 새로 설치한다(`npm install` / `pip install -r requirements.txt`) — Global CLAUDE.md 규칙, 메인 체크아웃 심볼릭 링크 금지(untracked 판정으로 `git worktree remove`가 막힘).

**주의: `package.json`이 바뀐 domain은 merge-back 후 메인 체크아웃에서 재설치 필요.** worktree마다 `node_modules`를 독립적으로 설치하므로, merge-back 시 `package.json`/lockfile 텍스트는 병합되지만 실제 설치된 패키지 파일은 메인 체크아웃에 자동으로 안 딸려온다("Cannot find module" 에러로 나중에 드러남). 그래서 **`package.json`이 바뀐 domain을 merge-back한 직후엔 메인 체크아웃에서 `npm install`(또는 해당 언어의 동등 명령)을 한 번 더 돌려 실제 설치 상태를 동기화**한다.

#### 3-1. phase 게이팅 및 스폰

각 domain 안에서, phase를 `depends_on`이 전부 `status: complete`인 것만 스폰 대상으로 추린다:

1. **api-spec phase** — 대상이면 서브 에이전트로 스폰(model: opus, `.claude/agents/api-spec.md` + `write-api-spec` 스킬 내용 프롬프트에 포함, **`target`(해당 domain명) + `source_request_ids`(그 domain의 `01_plan.yaml` 값 그대로) + `request_path`(`_workspace/00_request.yaml`) 필수 전달** — agent가 그 경로에서 해당 id들의 내용을 직접 읽음). 완료 시 `status: complete` 갱신 + **agent의 완료보고에 담긴 실제 저장 경로를 그대로 받아** 그 domain에 `spec_path`로 기록(오케스트레이터가 경로를 계산·추측하지 않는다 — `output_path` 기본값이 항상 지켜진다는 보장이 없어서 agent 보고값만 신뢰)
2. **backend/frontend phase** — 같은 domain에 이 둘이 **동시에** 대상이면 팀모드로 승격(둘 다 같은 domain worktree를 공유 — 위 "Worktree 전략" 참고, `type_source`가 파일 경로 참조라 물리적 공유 없이는 동작 안 함):
   - backend phase의 `path`(planner가 `01_plan.yaml`에 이미 결정해둔 값)에 CLAUDE.md 컨벤션(`types/` 서브경로) 적용해 `type_source`도 함께 산출 — 오케스트레이터는 `path` 자체를 재판단 안 함, planner 값 그대로 relay
   - 둘 다 유휴 스폰(한 메시지에 병렬 `Agent` 호출, "추가 지시 대기") → 스폰 결과에서 각 id 확보. 이때 프롬프트에 `source_request_ids` + `request_path`(`_workspace/00_request.yaml`)도 포함 — `spec_path` 유무와 무관하게 항상 전달(계약변경 없는 domain은 `spec_path` 자체가 없어서 이게 유일한 요구사항 출처)
   - 서로에게 SendMessage로 kickoff: 상대 id + 임무(backend: `path`/spec_path, frontend: `path`/spec_path/`type_source`) — `path`는 각자 phase의 `01_plan.yaml` `path` 필드 값을 그대로 전달(오케스트레이터가 재판단 안 함, planner가 이미 결정). **`language`는 전달하지 않는다** — 각 agent가 자기 `path` 진입 후 스스로 확인(backend.md 작업원칙 참고) + 배경(계약 내용 요약) + 통신규칙("일반 텍스트는 안 보임, SendMessage로만") + **종료조건**(스펙 이탈 협의 최대 2왕복, frontend ack 1회로 종료, ack 후 backend 추가발신 금지) — **type 완료 신호는 이 종료조건(왕복 카운트)과 별개**, backend/frontend 각 agent 정의(`backend.md`/`frontend.md`)의 팀 통신 프로토콜에 따라 자율 처리
   - 하나만 대상이면 서브 에이전트로 단독 스폰(id 릴레이 불필요) — 프롬프트에 `target`, `path`(각자 phase의 `01_plan.yaml` 값 그대로), `source_request_ids` + `request_path`(항상 전달), `spec_path`(있으면), `type_source`(frontend 한정, 기존 backend 타입 참조 필요한 경우만 — 오케스트레이터가 정적 경로로 직접 전달, SendMessage 아님) 전달 — `language`는 전달하지 않음
3. **qa phase** — 그 domain의 backend/frontend phase가 전부 `status: complete`면 서브 에이전트로 스폰(model: opus, `subagent_type: "general-purpose"` 필수, `.claude/agents/qa.md` 프롬프트 포함, `domain`+`impl_paths`+`spec_path`(있으면) 전달) — worktree가 있으면 QA도 그 안에서 검증(별도 병합 없이 최신 상태 그대로 존재)

worktree가 있는 domain은, 각 phase(agent) 완료 시 그 worktree 안에서 agent가 직접 커밋한다(add+commit, conventional 메시지) — merge-back은 오케스트레이터가 처리(3-2 참고).

각 phase 완료 알림마다 `_workspace/01_plan.yaml`의 해당 `status`를 갱신(파일 재작성). 이 갱신이 다음 게이팅 판단의 근거가 된다.

#### 3-2. merge-back 및 정리 (domain worktree 사용 시)

그 domain의 qa phase가 `status: complete`(위반 없음 또는 검증대상 없음)로 끝나면, 오케스트레이터가 작업 브랜치를 체크아웃한 상태에서 domain 브랜치를 병합한다:
```
git merge -m "feat: {domain} 도메인 merge-back (worktree)" {작업 브랜치}-{domain}
```
**`-m` 필수(실측 확인됨)**: fast-forward가 안 되는 상황(이미 다른 domain이 먼저 merge-back돼 작업 브랜치가 앞서있는 경우 등)에서 git이 기본으로 만드는 병합 커밋 메시지("Merge branch ...")는 이 프로젝트의 commit-msg 훅(prefix 컨벤션 검증)에 걸려 거부된다 — `-m`으로 conventional 메시지를 직접 지정해야 병합 커밋이 통과한다. QA가 리젝트 상태면 병합하지 않는다(위 "Worktree 전략" 참고 — 재작업은 같은 worktree에서 이어감). 여러 domain이 동시에 QA를 통과해도 병합은 오케스트레이터가 순차 수행한다(경합 방지).

병합 완료 후: `git worktree remove {경로}` → `git branch -d {작업 브랜치}-{domain}`. 정리 트리거는 "로컬 merge-back 완료"다(Global CLAUDE.md의 "PR 머지 완료" 전제와 다름 — 위 "Worktree 전략" 참고). 3-0에서 각 worktree에 새로 설치한 `node_modules`/`.venv`는 실제 디렉토리라 `.gitignore`에 정상 매칭되므로, plain `git worktree remove`(force 불필요)로 깨끗하게 제거된다.

**병합 충돌은 두 종류로 나뉜다(실측 확인됨) — 전부 planner 재실행감은 아니다:**
- **기계적 충돌** — 서로 다른 domain이 같은 공유 파일(예: 앱 진입점 `App.tsx`)에 각자 자기 것만 "추가"해서 생기는 흔한 충돌. 양쪽 diff를 보면 서로 겹치지 않고 나란히 합칠 수 있는 게 명백하다. Global CLAUDE.md가 "충돌 해결은 feat/* → dev 단계에서 한다"고 명시한 게 정확히 이 지점이므로, 오케스트레이터가 그 자리에서 두 변경을 합쳐 직접 해결하고 커밋한다(재시도·재계획 불필요). 해결 후 실제 빌드/타입체크(예: `tsc -b --noEmit`)로 정합성 재확인.
- **의미적 충돌** — 같은 파일의 같은 로직(같은 함수/같은 라인 범위)을 서로 다르게 정의해서 "합치기"가 불가능한 진짜 충돌. 이건 이 domain의 `path`가 다른 domain과 실제로 겹쳤다는 신호이므로 재시도하지 않고 planner 도메인 분리 판단 오류로 간주해 사용자에게 보고(에러 핸들링 표 참고).

### Phase 4: 종합 및 보고

1. 모든 domain의 모든 phase가 `complete` 또는 `error`가 될 때까지 Phase 3 반복
2. 각 에이전트 완료보고서에서 "외부설정 필요사항" 섹션 취합(키 이름/용도/발급처, 중복 제거)
3. **`.env.example` 갱신** — 2번에서 취합한 키를, 그 키를 보고한 agent의 `path`가 속한 레이어 기준으로 나눠 반영한다: `path`가 `backend/` 하위면 `backend/.env.example`, `frontend/` 하위(서버리스 함수 포함)면 `frontend/.env.example`. 기존 파일 있으면 Read 후 없는 키만 추가(값은 항상 빈 문자열 — 실제 값 채우기는 사용자 몫). `frontend/.env.example` 상단엔 "서버 전용(`frontend/api/**`), `VITE_` 접두사 절대 금지 — 붙이면 클라이언트 번들에 노출됨" 주석을 고정으로 넣는다. **env var가 아닌 외부설정 항목**(예: DB 테이블 사전 생성, 콘솔에서 API 사용 설정 활성화 등)도 빠뜨리지 않는다 — 해당 키 바로 위에 주석으로 붙인다(예: `SUPABASE_URL=` 위에 "사전에 posts 테이블 생성 필요: {스키마}") — 새 키만 추가가 아니라 완료보고서의 "외부설정 필요사항" 전체를 훑어 env var 형태가 아닌 것까지 반영했는지 확인한다. **주의**: 전역 CLAUDE.md 보안 훅이 `.env*` 파일 Read/Write/Edit를 기본 차단한다 — `.env.example`만 예외 처리돼 있어야 이 단계가 동작한다(예외 미설정이면 이 단계에서 막힌 사실을 사용자에게 보고하고 넘어간다, 억지로 우회 안 함).
4. 모든 qa 리포트(도메인별로 이미 incremental 실행되어 누적된 상태) 종합 — 여기서 QA를 새로 트리거하지 않는다
5. 최종 보고서 구성: planner 계획 대비 완료 요약 + QA 정적검증 결과(도메인별) + 외부설정 체크리스트(갱신된 `.env.example` 경로 명시) + 런타임 QA 필요 여부 안내(외부설정 완료 후 별도 요청 시에만 수행한다고 명시)

### Phase 5: 정리

1. 팀모드로 스폰됐던 backend/frontend에 종료 요청(SendMessage, 개별 전송) — 이미 phase 완료로 알아서 멈췄다면 생략
2. domain worktree는 각 domain의 merge-back 시점(Phase 3-2)에 이미 정리됨 — 여기선 재확인만: `git worktree list`에 `.claude/worktrees/`가 남아있으면(QA `error`로 미병합 상태) 임의 삭제하지 않고 사용자에게 알려 보존
3. `_workspace/` 보존(사후 감사·재실행 대비)
4. 사용자에게 결과 요약 보고, 개선 피드백 요청

## 데이터 흐름

```
사용자 요청
   │
   ▼
[intake] (sub) → _workspace/00_request.yaml (R1, R2... + pending)
   │  pending 있으면 오케스트레이터가 사용자에게 직접 질문 → intake 재스폰(반복)
   ▼
[planner] (sub) → _workspace/01_plan.yaml (domains[] 그룹, source_request_ids로 참조)
   │
   ├─ domain A ─────────────────────────────┐   ├─ domain B (독립, 병렬) ──┐
   │  [api-spec](sub) → docs/api/A.md       │   │  [frontend](sub, api없음)│
   │        │                               │   │        │                │
   │        ▼                               │   │        ▼                │
   │  [backend]◄──SendMessage(팀)──►[frontend]  │  완료                    │
   │        └──────────┬──────────┘         │   │        │                │
   │                    ▼                   │   │        ▼                │
   │              [qa](sub, general-purpose)│   │  [qa](sub) 또는 검증대상없음 │
   └─────────────────────────────────────────┘   └──────────────────────────┘
                    │                                       │
                    └───────────────┬───────────────────────┘
                                    ▼
                          [오케스트레이터: 종합 최종보고]
```

## 에러 핸들링

| 상황 | 전략 |
|------|------|
| intake의 `pending` 항목 | 에러 아님(정상 흐름) — 오케스트레이터가 사용자에게 직접 질문 후 intake 재스폰, 비워질 때까지 반복(상한 없음) |
| intake 산출물 스키마 어긋남(`pending`/`requirements` 구조가 아님) | 1회 재스폰, 재실패 시 사용자에게 원문 노출하고 수동 확인 요청 |
| planner 산출물 스키마 어긋남 | 1회 재스폰, 재실패 시 사용자에게 수동 확인 요청 |
| 서브 에이전트(api-spec/단독 backend·frontend/qa) 실패 | 1회 재시도, 재실패 시 해당 결과 없이 진행 + 최종보고서에 누락 명시 |
| 팀모드 backend/frontend 중 1명 실패·중지 | SendMessage로 상태 확인 → 재스폰(id 릴레이 재배선). 재실패 시 남은 한쪽 결과만으로 진행, 누락 명시 |
| backend↔frontend 협의 2왕복 초과 | 자동으로 해당 phase `status: error`, 오케스트레이터가 SendMessage로 개입해 상황 파악 후 사용자에게 에스컬레이션 |
| qa가 위반사항 발견 | 코드 수정은 안 함(QA는 검증만) — 리포트를 최종보고서에 포함, 필요 시 사용자 확인 후 해당 backend/frontend agent 재스폰해서 수정(같은 domain worktree 재사용, 새로 안 만듦). merge-back은 재검증 통과 후로 보류 |
| domain worktree merge-back 충돌(기계적 — 공유 파일에 각자 추가만 함) | 오케스트레이터가 그 자리에서 직접 합쳐 해결 + 빌드/타입체크 재확인 후 커밋(위 "Worktree 전략" 참고) — 재시도·에스컬레이션 불필요 |
| domain worktree merge-back 충돌(의미적 — 같은 로직을 다르게 정의) | 재시도하지 않음 — 이 domain의 `path`가 다른 domain과 실제로 겹쳤다는 신호이므로 planner 도메인 분리 판단 오류로 간주, planner 재실행 필요 사용자 보고 |
| 도메인 간 데이터 충돌 | 발생 안 함(도메인 간 계약 공유 없음이 설계 전제) — 만약 발견되면(merge-back 충돌 포함) planner의 도메인 분리 판단 오류이므로 planner 재실행 필요 |

## 테스트 시나리오

### 정상 흐름
1. 사용자: "게시글 목록에 제목 검색 필터 추가"
2. Phase 1: intake가 `R1: 게시글 목록 조회 시 제목 기준 검색 필터 추가`로 명확화, `pending` 없음 → 바로 Phase 2
3. Phase 2: planner가 `domain: backend-posts`, `contract_change_required: true`, `source_request_ids: [R1]`로 판단, phase 4개(contract/backend-impl/frontend-impl/qa) 산출
4. Phase 3: api-spec 서브 스폰 → `docs/api/backend-posts.md` 완료 → backend+frontend 팀모드 스폰(id 릴레이) → 병렬 구현, 스펙 이탈 없이 각자 완료 → qa 서브 스폰 → 경계면(API↔훅) 대조 후 "위반 없음" 리포트
5. Phase 4: 최종보고서에 완료 요약 + QA 통과 + 외부설정 없음(이미 계약 확정된 도메인이라 신규 키 불필요) 명시
6. 예상 결과: 4개 phase 전부 `status: complete`, 사용자에게 요약 보고

### 에러 흐름
1. 사용자: "대시보드 그 페이지 좀 손봐줘"
2. Phase 1: intake가 명확화 실패 → `R1`을 `pending`으로 표시(`question`: "어느 화면을 말씀하시는 건가요? 어떤 부분을 어떻게 바꾸고 싶으신가요?") → 오케스트레이터가 사용자에게 평문으로 질문 → 사용자 답변("대시보드 차트 다크모드 지원") → intake 재스폰 → `R1: 대시보드 차트 다크모드 테마 지원`로 확정, `pending` 빔 → Phase 2로
3. Phase 2: planner가 `domain: frontend-chart`, `contract_change_required: false`, `source_request_ids: [R1]`, phase 2개(frontend-dark-mode/qa) 산출
4. Phase 3: frontend 서브 스폰(팀모드 아님 — backend phase 없음) → 구현 완료 → qa 서브 스폰 → 경계면 탐색 결과 "검증대상 없음"(순수 스타일링)으로 즉시 종료
5. 중간에 frontend가 CSS 변수 충돌로 실패 → 1회 재시도 → 재실패 → 오케스트레이터가 해당 phase 없이 진행, 최종보고서에 "frontend-dark-mode 미완료, 원인: CSS 변수 충돌" 명시
6. 예상 결과: qa phase는 "검증대상 없음"으로 complete, frontend phase는 error로 남고 사용자에게 재작업 필요 안내

### 병렬 다중도메인 흐름 (worktree)
1. 사용자: "검색 필터 추가하고 대시보드 다크모드도 같이"
2. Phase 1: 브랜치 준비 — 현재 `dev`라 `feat/search-and-dark-mode` 생성
3. Phase 2: planner가 `domain: backend-posts`(`contract_change_required: true`), `domain: frontend-chart`(`contract_change_required: false`) 2개 산출
4. Phase 3-0: domain이 2개라 각각 worktree 생성 — `feat/search-and-dark-mode-backend-posts`, `feat/search-and-dark-mode-frontend-chart`를 `.claude/worktrees/`에 병렬 생성
5. Phase 3: 두 domain 병렬 게이팅 — `backend-posts`는 api-spec → 팀모드(backend+frontend, 같은 worktree 공유) → qa, `frontend-chart`는 frontend 단독 → qa. 각 agent는 자기 domain worktree 안에서 커밋
6. Phase 3-2: `backend-posts` qa 통과 → merge-back + 정리. `frontend-chart` qa도 거의 동시에 통과했지만 오케스트레이터가 순차 처리하므로 그 다음에 merge-back + 정리
7. Phase 4: 최종보고서 종합
8. 예상 결과: 두 domain 모두 `complete`, `.claude/worktrees/`는 비어있음(전부 정리됨), `feat/search-and-dark-mode` 브랜치에 두 domain 변경사항 모두 반영
