# CLAUDE.md — tennis-pulse

## 하네스: tennis-pulse 개발 오케스트레이션

**목표:** backend·frontend 기능 요청을 intake→planner→api-spec→backend/frontend→qa 6개 에이전트로 도메인 단위 게이팅하며 계약 어긋남 없이 완료한다.

**트리거:** backend/frontend/api 어디든 손대는 기능 추가·수정·버그수정 요청 시 `tennis-pulse-orchestrator` 스킬을 사용하라. 단순 질문(코드 설명, 파일 조회 등)은 직접 응답 가능.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-07-13 | 초기 구성 (5에이전트 + 4스킬 + 오케스트레이터) | 전체 | HARNESS.md 설계 검토 완료 후 최초 구축 |
| 2026-07-14 | intake 에이전트 추가(6에이전트 체제), `00_request.yaml`→`01_plan.yaml` 파이프라인 도입, `source_requests`를 `source_request_ids` 참조 방식으로 전환 | 전체 | 원본 요청의 모호함이 planner 이후 단계까지 전파되던 구멍 발견 — 명확화 전담 단계 분리 |
| 2026-07-14 | `01_plan.yaml`의 `language` 필드를 `path`(물리경로)로 대체 — planner가 Layer 성격/Convention 대조로 경로까지 결정, 언어는 backend agent가 진입 후 스스로 확인. `py-impl`/`ts-impl`(언어별)을 `script-impl`/`api-impl`(흐름별, 언어 무관)로 재구성 | planner.md, backend.md, frontend.md, SKILL.md, script-impl/, api-impl/ | 절차를 가르는 진짜 축은 언어가 아니라 흐름(스크립트/API)이라는 설계 오류 발견 — 언어는 각 흐름 내 문법 디테일로 재배치 |
| 2026-07-14 | API 계약 문서 경로(`spec_path`) 취득 방식을 "오케스트레이터가 네이밍 규칙으로 계산"에서 "api-spec agent가 완료보고에 실제 경로 명시 → 오케스트레이터가 그대로 기록"으로 변경. `frontend/src/CLAUDE.md`의 잘못된 대안 경로(`../api/docs`)도 제거해 `docs/api/*.md`로 통일 | planner.md, api-spec.md, SKILL.md, 01-plan-example.yaml, frontend/src/CLAUDE.md | 오케스트레이터가 경로를 추측하면 `output_path` 커스텀 지정 시 실제 파일과 어긋날 수 있음 — "판단 로직 없음" 원칙에도 위배 |
| 2026-07-14 | 루트 `HARNESS.md`와 `references/`(초안 자료) 삭제 — 전부 실제 `.claude/agents/`, `.claude/skills/`로 대체 완료. `SKILL.md`의 "외부설정 체크리스트 취합 규칙" 섹션도 삭제 — Vercel Root Directory 등 1회성 프로젝트 부트스트랩 항목은 오케스트레이터가 매 요청마다 추적할 일이 아니라 사용자가 사전에 처리하는 전제조건으로 재정의, Phase4의 기존 "외부설정 필요사항 취합" 한 줄로 충분 | HARNESS.md(삭제), references/(삭제), SKILL.md | 초안 참조 파일들이 실제 구현으로 완전 대체됨. 체크리스트 취합 규칙은 상태추적 장치까지 설계하다 과설계로 판단해 축소 |
