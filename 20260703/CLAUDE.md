@AGENTS.md

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

