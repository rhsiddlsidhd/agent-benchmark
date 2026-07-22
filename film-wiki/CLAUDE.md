> Git 전략의 범용 원칙(prefix taxonomy, 자동배포 브랜치 직접 push 금지 등)은 Global CLAUDE.md(`~/.claude/CLAUDE.md`, `~/.claude/docs/GIT.md`)에 있음. 이 프로젝트는 `main`이 Vercel 자동배포 대상이라, 그 원칙의 구체 구현으로 `dev`를 스테이징 브랜치로 둔다 — 브랜치 흐름: `<prefix>/*` → `dev` → `main`. `main`은 GitHub 브랜치 보호(ruleset `protect-main`)로 PR 없는 직접 push가 차단됨 — 로컬 스크립트 기반 릴리스 절차(`release-to-main.sh`)는 폐기.

> 파일/폴더 네이밍 규칙: `src/CLAUDE.md`(공통), 각 하위 폴더 `CLAUDE.md`(세부)

## Commands

```bash
npm run dev      # Next.js 개발 서버
npm run build     # 프로덕션 빌드
npm run start      # 빌드 결과 실행
npm run lint       # eslint
npm run format      # prettier --write .
```

# 폴더 배치 판단

- 파일을 새로 만들거나 옮길 때 네이밍 케이스만 맞추고 넘어가지 않는다 — 대상 폴더 `CLAUDE.md` 정의 문단과 성격이 맞는지 먼저 확인한다.
- 성격이 대상 폴더 정의와 안 맞으면 그대로 두지 않는다 — 후보가 될 다른 `src/*` 폴더들의 `CLAUDE.md` 정의와 비교해 가장 맞는 곳으로 옮긴다.
- 어느 폴더 정의와도 안 맞으면 기존 폴더에 임의로 끼워넣지 않는다 — 새 폴더를 만들거나 사용자에게 확인한다.
- 후보 폴더 `CLAUDE.md` 비교 시 키워드 grep 매칭 결과만으로 "관련 규정 없음"이라 결론짓지 않는다 — 규칙이 다른 표현(예: provider 대신 "외부 상태관리 라이브러리")으로 적혀 있을 수 있으니 후보 문서는 전체를 통독한다.

## 하네스: TMDB 탐색 웹앱 기능 개발

**목표:** PRD/Architecture/Design 문서 기반으로 기능을 계획→구현→점진적 QA까지 자동화.

**트리거:** 기능 추가/구현/수정/QA 요청 시 `dev-orchestrator` 스킬을 사용하라. 단순 질문은 직접 응답 가능.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-07-05 | 초기 구성 (planner/implementer/qa + dev-orchestrator) | 전체 | 초기 개발 단계, 기능 개발 파이프라인 재사용형으로 구축 |
| 2026-07-09 | 하네스 재구축 (planner/implementer/qa + dev-orchestrator, 도메인 3스킬) | .claude/agents/*, .claude/skills/* | 이전 하네스가 작업트리에서 삭제된 채 미커밋 상태로 방치되어 있어 재구축. dev-orchestrator의 팀 구성 방식을 `TeamCreate`/`TeamDelete`(현재 환경에 없는 도구)에서 `Agent` 유휴 스폰 + id 릴레이 + 개별 `SendMessage` 종료 요청 방식으로 교체. planner/feature-spec-decomposer는 입력 요청 문서가 매번 고정 형식이 아님(TODO 문서·PRD 발췌·대화 텍스트 등)을 명시하고 출력(`01_planner_tasks.md`)만 고정 형식으로 정규화하도록 수정, "미정 사항" 섹션 신설 |
| 2026-07-10 | 하네스 삭제 (.claude/agents, .claude/skills 전체 제거) | .claude 디렉토리 | 사용자가 기존 하네스 작업트리 삭제. 미커밋 상태였어서 git 이력엔 안 남음, 재구축 필요 시 이 표 참고 |
| 2026-07-10 | 하네스 재구축 (planner/implementer/qa + dev-orchestrator, 도메인 3스킬: feature-planning/feature-implementation/boundary-qa) | .claude/agents/*, .claude/skills/* | `/grilling` 세션으로 실행모드·재작업 흐름·워크트리 전략을 사전 확정 후 구축. 실행모드는 서브 에이전트로 고정(팀모드 안 씀) — planner→implementer→qa가 순차 파이프라인이라 팀원 간 실시간 조율 불필요 판단. 태스크 분할 기준은 모듈이 아니라 의존성 유무로 명시(모듈은 참고 힌트일 뿐). 배치 내 독립 태스크는 `Agent(isolation:"worktree")`로 병렬 fan-out, 배치 전원 완료 시 QA 1회 fan-in, **다음 배치 시작 전 merge-back 완료를 필수 게이트로 설정**(건너뛰면 다음 배치가 stale 브랜치에서 시작하는 문제 있어 명시). QA 리젝트는 구현이슈(같은 implementer 재호출, 최대 2회)/분해이슈(planner 부분 재호출, 영향 배치만 — 전체 재시작 안 함)로 분류해 라우팅. planner는 `00_PRD.md`+`01_ARCHITECTURE.md`+`02_ADR.md`를 매번 전체 통독(선별 안 함), `03_DESIGN.md`는 최초 base 스냅샷이라 제외(디자인 토큰은 `globals.css`로 대체됨). 진행상태는 `_workspace/<브랜치명>/02_progress_state.md` 단일 파일(오케스트레이터 단독 writer)로 관리 — 세션 중단(토큰소진/크래시) 대비 재개 지점 추적용 |
| 2026-07-12 | worktree 프로비저닝 방식 전환 (`Agent(isolation:"worktree")` 자동 생성 → 오케스트레이터가 `git worktree add -b`로 수동 생성 후 격리 없이 Agent 스폰) | .claude/skills/dev-orchestrator/SKILL.md(3-1/3-2/에러 핸들링 표), .claude/skills/feature-implementation/SKILL.md(절차 0번 신설) | `feat/adult-content-gate` 기능 개발 중 발견: `isolation:"worktree"`가 지정한 브랜치를 무시하고 매번 동일한 stale 커밋(`20260703/` 프로젝트 재배치 이전 시점)에서 worktree를 프로비저닝하는 문제가 배치1·2의 implementer 6개 전원에서 재현됨(그중 1개는 완전 실패까지 감). 근본 원인은 하네스 내부(레포 밖)라 직접 수정 불가 판단 — 대신 `AGENTS.md`에 이미 있었지만 이 파이프라인에서 실제로는 안 쓰이던("도구가 자동 생성"에 위임돼 죽어있던) 수동 worktree 생성 규칙을 오케스트레이터가 직접 실행하는 방식으로 우회. feature-implementation 절차 0번(작업 디렉토리 존재 확인 + `git merge --ff-only` 자체복구)은 안전망으로 유지(이중 방어, 배타적 선택 아님) |
| 2026-07-13 | planner의 "요구사항분석" 책임을 신규 agent `analyst`로 분리(analyst→planner→implementer→qa). 신규: `.claude/agents/analyst.md`, `.claude/skills/feature-analysis/SKILL.md`. 수정: `.claude/agents/planner.md`(PRD 통독 제거, model opus→sonnet), `.claude/skills/feature-planning/SKILL.md`(요청대조 절차 삭제, 입력을 analyst 산출물로 변경), `.claude/skills/dev-orchestrator/SKILL.md`(Phase 2를 2-0 분석/2-1 계획으로 분리, QA 판정에 적합성이슈 유형 추가, Phase 0 재개로직을 `01_planner_tasks.md` 존재여부 기준으로 수정), `.claude/skills/boundary-qa/SKILL.md`+`.claude/agents/qa.md`(적합성 위반 검증 항목 및 적합성이슈 리젝트 유형 추가) | 전체 | `docs/00_PRD.md`+`01_ARCHITECTURE.md`+`02_ADR.md`를 planner가 매번 전체 통독하던 구조에서 "요구사항이 타당한가"(PRD 대조)와 "어떻게 쪼갤까"(ARCH/ADR 기반 분해)가 한 에이전트에 뭉쳐 있어 책임이 불분명했음. 실제 문서 대조 결과 ARCH/ADR은 PRD의 Non-Goals을 인용만 할 뿐 독자적 제약을 만들지 않아 "PRD=analyst, ARCH/ADR=planner" 분담이 문서 구조상 깔끔히 갈림을 확인 후 분리 결정. 적합성 판정(`pass`/`reject`)은 QA 판정 필드와 명명을 맞추되, 재시도로 해소되지 않는다는 점에서 QA의 리젝트와 의미가 다름을 각 문서에 명시 |

