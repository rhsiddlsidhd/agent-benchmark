---
name: dev-orchestrator
description: "TMDB 탐색 웹앱(Next.js App Router)의 기능 개발 팀(Planner+Implementer+QA)을 조율하는 오케스트레이터. '기능 추가해줘', '이 PRD 구현해줘', '~ 페이지/컴포넌트 만들어줘', '검색 기능 붙여줘' 등 초기 구현 요청뿐 아니라, 'QA만 다시 돌려줘', '이 기능 수정해줘', '구현 보완해줘', '이전 결과 기반으로 개선', '다시 실행' 같은 후속 요청에도 반드시 이 스킬을 사용한다. 요청은 TODO 문서·PRD 발췌·대화 텍스트 등 매번 형식이 다를 수 있다 — 형식과 무관하게 이 스킬을 트리거한다. 이 프로젝트는 초기 개발 단계라 최초 구현에도 동일하게 적용된다."
---

# Dev Orchestrator

TMDB 탐색 웹앱의 기능 개발을 Planner → Implementer/QA(점진적 검증) 흐름으로 조율한다.

## 실행 모드: 에이전트 팀

3명(Planner, Implementer, QA)을 `Agent` 도구로 유휴 스폰한 뒤 id 릴레이로 서로 연결하고, 이후 `SendMessage`/`TaskCreate`로 직접 조율한다. **팀 생성 전용 도구는 없다** — 오케스트레이터가 스폰 결과에서 각 팀원의 id를 확보해 SendMessage로 중계해야 통신이 배선된다. QA→Implementer 피드백 루프가 실시간으로 필요해 팀 모드가 서브 에이전트보다 적합하다.

## 에이전트 구성

| 팀원 | 에이전트 정의 | 역할 | 스킬 | 산출물 |
|------|-------------|------|------|--------|
| planner | `.claude/agents/planner.md` | 요청 정규화·태스크 분해, 브랜치/ADR 판단 | feature-spec-decomposer | `_workspace/01_planner_tasks.md` |
| implementer | `.claude/agents/implementer.md` | 코드 구현 | tmdb-feature-implementer | `src/` 코드 + `_workspace/02_implementer_{task}.md` |
| qa | `.claude/agents/qa.md`(`general-purpose` 타입) | 점진적 통합 정합성 검증 | boundary-qa-checker | `_workspace/03_qa_{task}.md` |

모든 `Agent` 호출에 `model: "opus"`를 명시한다.

## 워크플로우

### Phase 0: 컨텍스트 확인

1. `_workspace/` 존재 여부 확인.
2. 분기:
   - **미존재** → 초기 실행. Phase 1로.
   - **존재 + 사용자가 부분 수정/QA 재실행 요청** → 부분 재실행. 해당 태스크만 해당 에이전트에게 재배정 (예: "QA만 다시" → qa에게 기존 구현 재검증만 요청, planner/implementer 재호출 없음).
   - **존재 + 새 기능 요청** → 새 실행. 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동 후 새 `_workspace/` 생성.
3. 부분 재실행 시 이전 산출물 경로를 해당 에이전트 프롬프트에 포함해, 기존 결과를 읽고 피드백만 반영하도록 지시한다.

### Phase 1: 준비

1. 사용자의 기능 요청을 원문 그대로(요약·재구성 없이) 확보한다 — 문서 경로일 수도, 대화 텍스트일 수도 있다. 형식을 이 단계에서 정규화하지 않는다 — 정규화는 planner의 책임이다(PRD가 placeholder이므로 요청 원문 자체가 요구사항의 1차 소스일 수 있음).
2. `_workspace/`를 생성하고 요청 원문(또는 문서 경로 + 핵심 인용)을 `_workspace/00_request.md`에 기록한다.

### Phase 2: 팀 구성 — 유휴 스폰 + id 릴레이

1. 3명을 한 메시지에 병렬로 유휴 스폰한다(추가 지시 대기 상태로만 띄운다):
   ```
   Agent(description: "planner 대기", subagent_type: "general-purpose", model: "opus",
         prompt: ".claude/agents/planner.md 정의를 읽고 그 역할을 맡아라. 지금은 아무것도 하지 말고 추가 지시를 대기하라.")
   Agent(description: "implementer 대기", subagent_type: "general-purpose", model: "opus",
         prompt: ".claude/agents/implementer.md 정의를 읽고 그 역할을 맡아라. 지금은 아무것도 하지 말고 추가 지시를 대기하라.")
   Agent(description: "qa 대기", subagent_type: "general-purpose", model: "opus",
         prompt: ".claude/agents/qa.md 정의를 읽고 그 역할을 맡아라. 지금은 아무것도 하지 말고 추가 지시를 대기하라.")
   ```
2. 각 스폰 결과에서 planner_id / implementer_id / qa_id를 확보한다.
3. 각 팀원에게 SendMessage로 kickoff한다 — 동료 id(정확한 문자열 그대로), 임무, 배경, 통신 규칙, 종료조건을 모두 포함한다:
   ```
   SendMessage(to: planner_id, message:
     "동료 id — implementer: {implementer_id}, qa: {qa_id} (정확한 문자열 그대로 사용).
      임무: `_workspace/00_request.md`의 요청을 feature-spec-decomposer 스킬 절차대로 처리해
      `_workspace/01_planner_tasks.md`에 저장하고 TaskCreate로 태스크(assignee: implementer) 등록.
      태스크 등록 후 implementer에게 SendMessage로 시작을 알려라.
      일반 텍스트 출력은 동료에게 보이지 않는다 — 전달하려면 반드시 SendMessage를 호출하라.
      동료의 메시지는 자동으로 전달된다 — 새 지시로 취급해 처리하라.
      종료조건: 태스크 등록 + implementer 알림 완료 시 1회 나에게(오케스트레이터) 완료 보고 후 대기. 이후 implementer/qa의 스펙 질문에만 응답, 먼저 나서서 추가 발신 금지.")

   SendMessage(to: implementer_id, message:
     "동료 id — planner: {planner_id}, qa: {qa_id}.
      임무: planner의 시작 알림을 받으면 `_workspace/01_planner_tasks.md`의 태스크를 순서대로 구현.
      태스크 하나 끝날 때마다(전체 완료를 기다리지 말고) qa에게 SendMessage로 점검 요청 — 이것이 점진적 QA다.
      일반 텍스트 출력은 동료에게 안 보인다 — SendMessage로만 전달. 동료 메시지는 자동 전달되니 새 지시로 처리하라.
      종료조건: 모든 태스크가 PASS 또는 '미해결'로 종결되면 나에게 완료 보고 후 대기. QA 재수정은 태스크당 최대 1회, 그 이상 FIX/REDO면 재시도하지 말고 '미해결'로 두고 다음 태스크로.")

   SendMessage(to: qa_id, message:
     "동료 id — planner: {planner_id}, implementer: {implementer_id}.
      임무: implementer가 태스크 완료를 알리면 boundary-qa-checker 스킬 절차대로 즉시 해당 태스크만 검증,
      `_workspace/03_qa_{task-id}.md`에 판정(PASS/FIX/REDO) 저장. FIX/REDO면 implementer에게
      SendMessage로 file:line + 수정 방향 직접 전달.
      일반 텍스트 출력은 동료에게 안 보인다 — SendMessage로만 전달.
      종료조건: implementer 재수정 후에도 FIX/REDO면 강제 통과시키지 말고 그대로 두고 나에게 보고,
      추가 재시도 요청하지 말 것. 모든 태스크 판정 완료 시 나에게 요약 보고 후 대기.")
   ```
4. 필요 시 리더 진행 관리용 `TaskCreate`/`TaskUpdate`를 사용한다 — 이는 팀원이 아닌 리더 전용 도구다.

### Phase 3: 계획 → 점진적 구현·검증

**실행 방식**: 팀원들이 kickoff 메시지에 따라 자체 조율. 리더(오케스트레이터)는 완료 알림을 모니터링하고 막힌 지점에만 개입한다.

1. planner가 태스크를 등록하고 implementer에게 시작을 알린다.
2. implementer가 태스크를 순서대로 구현하며, 태스크 하나가 끝날 때마다 qa에게 즉시 점검을 요청한다.
3. qa가 판정한다.
   - PASS → `TaskUpdate`로 완료 처리(리더가 확인 시), implementer는 다음 태스크로.
   - FIX/REDO → implementer가 1회 수정 후 재제출. 재수정 후에도 FIX/REDO면 "미해결"로 두고 다음 태스크로(전체 파이프라인을 막지 않음).
4. planner는 진행 중 요구사항 질문에 답하고, 답할 수 없으면(요청 자체가 불명확) SendMessage로 오케스트레이터에게 알려 사용자 확인을 받는다.
5. 브랜치가 필요하다고 planner가 판단했으면, 실제 생성 전에 사용자 승인을 받는다 — 이건 팀원이 아니라 리더가 사용자에게 직접 확인한다.
6. 완료 알림에서 예상 밖의 왕복(같은 팀원이 종료조건 없이 계속 발신)이 보이면 SendMessage로 개입해 중단시킨다.

### Phase 4: 통합 및 정리

1. 모든 태스크의 `_workspace/03_qa_{task}.md`를 `Read`로 수집한다.
2. PASS/미해결 태스크를 구분해 최종 보고서를 작성한다.
3. 팀원 각각에게 개별 SendMessage로 종료를 요청한다(팀 삭제 전용 도구는 없다 — 종료 요청만으로 정리한다).
4. `_workspace/`는 보존한다(사후 검증·감사 추적용).
5. 사용자에게 결과 요약 + 미해결 태스크(있다면) + 다음 커밋/PR은 사용자 요청 시에만 진행됨을 안내한다.

## 데이터 흐름

```
[오케스트레이터] → Agent 유휴 스폰×3 + id 릴레이 kickoff → [planner] --태스크 등록--> TaskCreate
                                                                  │
                                                                  ▼ SendMessage(시작 알림)
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
| planner가 요구사항을 확정 못함 (PRD placeholder거나 요청 원문이 모호) | 오케스트레이터가 사용자에게 직접 질문, 팀 대기 |
| 팀원 1명 유휴/중지 | 리더가 유휴 알림 수신 → SendMessage로 상태 확인 → 필요 시 재시작(재스폰 + id 재배포) |
| 브랜치 생성 필요하나 사용자 미승인 | 현재 브랜치에서 작업 계속, 승인 후 브랜치 이동 |
| ADR 초안 필요하나 사용자 미승인 | `_workspace/`에만 초안 보관, `02_ADR.md`는 수정하지 않음 |
| 팀원이 종료조건 없이 왕복을 이어감 | 리더가 완료 알림에서 감지 → SendMessage로 개입해 중단 지시 |

## 테스트 시나리오

### 정상 흐름
1. 사용자: "인기 영화 목록 홈 화면에 붙여줘"
2. Phase 0: `_workspace/` 없음 → 초기 실행
3. Phase 2: 3명 유휴 스폰 + id 릴레이 kickoff
4. Phase 3: planner가 태스크 1개(T1: home 모듈 — tmdb-client `getTrending()` + Server Component 렌더) 등록 → implementer 구현 → qa 즉시 검증 → PASS
5. Phase 4: 보고서 생성, 팀원 종료 요청
6. 예상 결과: `src/app/page.tsx` 등 변경 + `_workspace/`에 3단계 산출물 보존

### 에러 흐름
1. 사용자: "TODO.md의 인기 드라마/예능/영화 세션 API 개선 반영해줘" (자유 형식 요청 문서)
2. planner가 TODO.md를 읽고 [확정] 표기된 3개 세션을 각각 태스크로 분해, "레이아웃 세로 배치 순서"는 미정 사항으로 별도 표기
3. implementer가 Route Handler 구현 후 응답을 `{ results: [...] }`로 반환했는데 훅은 배열을 직접 기대하도록 구현
4. qa가 API↔훅 shape 불일치 발견 → FIX 판정, SendMessage로 file:line 전달
5. implementer가 unwrap 로직 추가해 재제출 → qa 재검증 → PASS
6. 만약 재검증도 FIX였다면: 해당 태스크 "미해결"로 표시, 최종 보고서에 원인과 함께 기록, 나머지 태스크는 계속 진행
7. 오케스트레이터가 최종 보고 시 "미정 사항"(세로 배치 순서)을 사용자에게 별도 확인 요청
