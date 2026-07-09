@AGENTS.md

## 하네스: TMDB 탐색 웹앱 기능 개발

**목표:** PRD/Architecture/Design 문서 기반으로 기능을 계획→구현→점진적 QA까지 자동화.

**트리거:** 기능 추가/구현/수정/QA 요청 시 `dev-orchestrator` 스킬을 사용하라. 단순 질문은 직접 응답 가능.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-07-05 | 초기 구성 (planner/implementer/qa + dev-orchestrator) | 전체 | 초기 개발 단계, 기능 개발 파이프라인 재사용형으로 구축 |
| 2026-07-08 | src/app, src/components, src/lib CLAUDE.md 신설, src/context/src/hooks CLAUDE.md 신설, AGENTS.md 네이밍 컨벤션 추가, 컴포넌트 Props/타입 규칙을 docs/COMPONENT_TYPES.md로 분리 | src/app/CLAUDE.md, src/components/CLAUDE.md, src/lib/CLAUDE.md, src/context/CLAUDE.md, src/hooks/CLAUDE.md, AGENTS.md, docs/COMPONENT_TYPES.md | features 폴더 해체를 앞두고 도메인별 배치 규칙 정비 + Context/공유 훅 배치 규칙 신설 필요, 신설된 5개 CLAUDE.md가 공통 참조할 네이밍 컨벤션(AGENTS.md)·컴포넌트 Props/타입 규칙(COMPONENT_TYPES.md)을 중복 없이 별도 문서로 분리 |
| 2026-07-08 | src/app/api CLAUDE.md 신설, src/app/CLAUDE.md "작성 예정" 표기 제거 | src/app/api/CLAUDE.md, src/app/CLAUDE.md | api 폴더 규칙 문서 작성 완료에 맞춰 참조 링크 정리 |
| 2026-07-08 | "폴더 배치 판단" 섹션 신설(파일 신규/이동 시 대상 폴더 CLAUDE.md 정의와 성격 일치 확인, 불일치 시 후보 폴더 비교 후 이동, 매칭 안 되면 신규 폴더/사용자 확인 강제) | AGENTS.md | 네이밍 케이스만 맞고 폴더 성격이 안 맞는 배치 실수 방지 |
| 2026-07-08 | 소개 문단 폴더 참조 오기 수정(`ui/` → `components/`) | src/components/CLAUDE.md | 실제 상위 폴더명과 불일치하던 표기 정정 |
| 2026-07-09 | 하네스 재구축 (planner/implementer/qa + dev-orchestrator, 도메인 3스킬) | .claude/agents/*, .claude/skills/* | 이전 하네스가 작업트리에서 삭제된 채 미커밋 상태로 방치되어 있어 재구축. dev-orchestrator의 팀 구성 방식을 `TeamCreate`/`TeamDelete`(현재 환경에 없는 도구)에서 `Agent` 유휴 스폰 + id 릴레이 + 개별 `SendMessage` 종료 요청 방식으로 교체. planner/feature-spec-decomposer는 입력 요청 문서가 매번 고정 형식이 아님(TODO 문서·PRD 발췌·대화 텍스트 등)을 명시하고 출력(`01_planner_tasks.md`)만 고정 형식으로 정규화하도록 수정, "미정 사항" 섹션 신설 |

