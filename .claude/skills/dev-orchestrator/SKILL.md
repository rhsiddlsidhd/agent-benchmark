---
name: dev-orchestrator
description: "TMDB 탐색 웹앱(Next.js App Router)의 기능 개발 팀(Planner+Implementer+QA)을 조율하는 오케스트레이터. '기능 추가해줘', '이 PRD 구현해줘', '~ 페이지/컴포넌트 만들어줘', '검색 기능 붙여줘' 등 초기 구현 요청뿐 아니라, 'QA만 다시 돌려줘', '이 기능 수정해줘', '구현 보완해줘', '이전 결과 기반으로 개선', '다시 실행' 같은 후속 요청에도 반드시 이 스킬을 사용한다. 이 프로젝트는 초기 개발 단계라 최초 구현에도 동일하게 적용된다."
---

# Dev Orchestrator

TMDB 탐색 웹앱의 기능 개발을 Planner → Implementer/QA(점진적 검증) 흐름으로 조율한다.

## 실행 모드: 에이전트 팀

3명(Planner, Implementer, QA)이 `TeamCreate`로 구성되어 `SendMessage`/`TaskCreate`로 직접 조율한다. QA→Implementer 피드백 루프가 실시간으로 필요해 팀 모드가 서브 에이전트보다 적합하다.

## 에이전트 구성

| 팀원 | 에이전트 타입 | 역할 | 스킬 | 산출물 |
|------|-------------|------|------|--------|
| planner | planner (커스텀) | 태스크 분해, 브랜치/ADR 판단 | feature-spec-decomposer | `_workspace/01_planner_tasks.md` |
| implementer | implementer (커스텀) | 코드 구현 | tmdb-feature-implementer | `src/` 코드 + `_workspace/02_implementer_{task}.md` |
| qa | qa (커스텀) | 점진적 통합 정합성 검증 | boundary-qa-checker | `_workspace/03_qa_{task}.md` |

모든 `TeamCreate`/`Agent` 호출에 `model: "opus"`를 명시한다.

## 워크플로우

### Phase 0: 컨텍스트 확인

1. `_workspace/` 존재 여부 확인.
2. 분기:
   - **미존재** → 초기 실행. Phase 1로.
   - **존재 + 사용자가 부분 수정/QA 재실행 요청** → 부분 재실행. 해당 태스크만 해당 에이전트에게 재배정 (예: "QA만 다시" → qa에게 기존 구현 재검증만 요청, planner/implementer 재호출 없음).
   - **존재 + 새 기능 요청** → 새 실행. 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동 후 새 `_workspace/` 생성.
3. 부분 재실행 시 이전 산출물 경로를 해당 에이전트 프롬프트에 포함해, 기존 결과를 읽고 피드백만 반영하도록 지시한다.

### Phase 1: 준비

1. 사용자의 기능 요청 내용을 정리한다 (무엇을, 왜 — PRD가 placeholder이므로 사용자 요청 자체가 요구사항의 원천일 수 있음).
2. `_workspace/`를 생성하고 사용자 요청을 `_workspace/00_request.md`에 기록한다.

### Phase 2: 팀 구성

```
TeamCreate(
  team_name: "tmdb-dev-team",
  members: [
    { name: "planner", agent_type: "planner", model: "opus", prompt: "docs/00_PRD.md·01_ARCHITECTURE.md·03_DESIGN.md·02_ADR.md를 읽고 다음 기능 요청을 태스크로 분해: {요청 내용}. _workspace/01_planner_tasks.md에 저장 후 TaskCreate로 태스크 등록." },
    { name: "implementer", agent_type: "implementer", model: "opus", prompt: "planner가 _workspace/01_planner_tasks.md에 등록한 태스크를 받아 순서대로 구현. 태스크 완료마다 qa에게 즉시 SendMessage로 점검 요청." },
    { name: "qa", agent_type: "qa", model: "opus", prompt: "implementer가 완료 알림을 보내는 태스크마다 즉시 통합 정합성 검증. 실패 시 file:line과 수정 방향을 implementer에게 SendMessage로 직접 전달." }
  ]
)
```

### Phase 3: 계획 → 점진적 구현·검증

**실행 방식**: 팀원들이 자체 조율. 리더(오케스트레이터)는 모니터링만 한다.

1. planner가 `_workspace/01_planner_tasks.md`를 완성하고 `TaskCreate`로 태스크(태스크당 assignee: implementer)를 등록한다.
2. implementer가 태스크를 순서대로 claim해 구현한다. **태스크 하나가 끝날 때마다** (전체 완료를 기다리지 않고) qa에게 `SendMessage`로 점검을 요청한다 — 이것이 점진적 QA다.
3. qa는 즉시 해당 태스크만 검증하고 판정(PASS/FIX/REDO)한다.
   - PASS → `TaskUpdate`로 완료 처리, implementer는 다음 태스크로.
   - FIX/REDO → implementer에게 `SendMessage`로 구체적 file:line + 수정 방향 전달. implementer가 1회 수정 후 재제출.
   - 재수정 후에도 FIX/REDO → 강제 통과시키지 않는다. 해당 태스크는 "미해결"로 표시하고 다음 태스크로 넘어간다(전체 파이프라인을 막지 않음).
4. planner는 태스크 진행 중 요구사항 질문을 받으면 답하고, 답할 수 없으면(PRD 자체가 불명확) 오케스트레이터를 통해 사용자에게 확인한다.
5. 브랜치가 필요하다고 planner가 판단했으면, 실제 생성 전에 사용자 승인을 받는다 — 이건 팀원이 아니라 리더가 사용자에게 직접 확인한다.

### Phase 4: 통합 및 정리

1. 모든 태스크의 `_workspace/03_qa_{task}.md`를 `Read`로 수집한다.
2. PASS/미해결 태스크를 구분해 최종 보고서를 작성한다.
3. 팀원들에게 종료 요청 (`SendMessage`) 후 `TeamDelete`로 팀 정리.
4. `_workspace/`는 보존한다(사후 검증·감사 추적용).
5. 사용자에게 결과 요약 + 미해결 태스크(있다면) + 다음 커밋/PR은 사용자 요청 시에만 진행됨을 안내한다.

## 데이터 흐름

```
[오케스트레이터] → TeamCreate → [planner] --태스크 등록--> TaskCreate
                                     │
                                     ▼
                              [implementer] --완료 알림(태스크 단위)--> [qa]
                                     ▲                                  │
                                     └──────── FIX/REDO 피드백 ─────────┘
                                     │
                                     ▼ (PASS)
                          _workspace/03_qa_{task}.md
                                     │
                                     ▼
                          [오케스트레이터: 통합·보고]
```

## 에러 핸들링

| 상황 | 전략 |
|------|------|
| implementer가 1회 수정 후에도 QA 실패 | 강제 통과시키지 않음. 해당 태스크 "미해결" 표시, 최종 보고서에 명시, 다음 태스크는 계속 진행 |
| planner가 요구사항을 확정 못함 (PRD placeholder) | 오케스트레이터가 사용자에게 직접 질문, 팀 대기 |
| 팀원 1명 유휴/중지 | 리더가 유휴 알림 수신 → SendMessage로 상태 확인 → 필요 시 재시작 |
| 브랜치 생성 필요하나 사용자 미승인 | 현재 브랜치에서 작업 계속, 승인 후 브랜치 이동 |
| ADR 초안 필요하나 사용자 미승인 | `_workspace/`에만 초안 보관, `02_ADR.md`는 수정하지 않음 |

## 테스트 시나리오

### 정상 흐름
1. 사용자: "인기 영화 목록 홈 화면에 붙여줘"
2. Phase 0: `_workspace/` 없음 → 초기 실행
3. Phase 2: 3명 팀 구성
4. Phase 3: planner가 태스크 1개(T1: home 모듈 — tmdb-client `getTrending()` + Server Component 렌더) 등록 → implementer 구현 → qa 즉시 검증 → PASS
5. Phase 4: 보고서 생성, 팀 정리
6. 예상 결과: `src/app/page.tsx` 등 변경 + `_workspace/`에 3단계 산출물 보존

### 에러 흐름
1. 사용자: "검색 결과 무한스크롤 붙여줘"
2. implementer가 Route Handler 구현 후 응답을 `{ results: [...] }`로 반환했는데 훅은 배열을 직접 기대하도록 구현
3. qa가 API↔훅 shape 불일치 발견 → FIX 판정, `SendMessage`로 file:line 전달
4. implementer가 unwrap 로직 추가해 재제출
5. qa 재검증 → PASS
6. 만약 재검증도 FIX였다면: 해당 태스크 "미해결"로 표시, 최종 보고서에 원인과 함께 기록, 나머지 태스크는 계속 진행
