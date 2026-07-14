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

## 워크플로우

### Phase 0: 컨텍스트 확인 (후속 작업 지원)

1. `_workspace/00_request.yaml`, `_workspace/01_plan.yaml` 존재 여부 확인
2. 실행 모드 결정:
   - **둘 다 미존재** → 초기 실행. Phase 1로
   - **`00_request.yaml`만 존재(`01_plan.yaml` 미존재)** → Phase 1 중간에 끊긴 상태(인터뷰 도중 세션 종료 등). `pending` 확인해서 남아있으면 이어서 사용자에게 질문, 없으면 바로 Phase 2로 재개
   - **`01_plan.yaml` 존재 + 사용자가 특정 domain/phase 재실행·수정 요청** → 부분 재실행. 해당 domain의 phase만 `status: pending`으로 되돌려 재스폰(다른 domain은 건드리지 않음), intake/planner는 다시 안 돌림
   - **`01_plan.yaml` 존재 + 사용자가 새 기능 요청(기존과 무관)** → 새 실행. 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동 후 Phase 1
3. 부분 재실행 시: 재스폰 대상 에이전트 프롬프트에 이전 산출물 경로(구현 코드/QA 리포트)를 포함해, 기존 결과를 읽고 피드백 반영하도록 지시

### Phase 1: 요구사항 명확화

1. `intake` 스폰(서브 에이전트, model: opus):
```
Agent(subagent_type: "general-purpose", model: "opus",
      prompt: ".claude/agents/intake.md 전문 + 사용자 요청 원문 전달")
```
2. 완료 알림에서 `_workspace/00_request.yaml` 확보, `pending` 배열 확인:
   - **비어있음** → Phase 2로
   - **항목 있음** → 각 id의 `requirements.{id}.question` 텍스트를 모아 **평문으로 사용자에게 직접 질문**(구조화 질문 도구 안 씀 — 개방형 사실확인이라 선택지형 도구는 안 맞음) → 답변 받으면 원본 요청 + 이번 답변을 묶어 `intake` 재스폰(이전 항목 id 유지 지시 포함) → `_workspace/00_request.yaml` 갱신 → 다시 `pending` 확인(비워질 때까지 반복, 상한 없음 — 사용자가 직접 관여하는 루프라 에이전트간 협의 폭주 리스크와 성격이 다름)
3. 정상 포맷 예시: `references/00-request-example.yaml`

### Phase 2: 계획 수립

`planner` 스폰(서브 에이전트, model: opus):
```
Agent(subagent_type: "general-purpose", model: "opus",
      prompt: ".claude/agents/planner.md 전문 + _workspace/00_request.yaml 경로 전달")
```
완료 알림에서 `_workspace/01_plan.yaml` 확보. 파일이 없거나 스키마가 어긋나면(도메인 그룹 구조가 아니거나 `agent` 값이 `api-spec|backend|frontend|qa` 밖이면) 1회 재스폰, 재실패 시 사용자에게 원문 노출하고 수동 확인 요청. 정상 포맷 예시: `references/01-plan-example.yaml`.

### Phase 3: 도메인별 게이팅 및 스폰

`_workspace/01_plan.yaml`의 `domains[]`를 순회한다. **서로 다른 domain은 완전 독립 — 한 메시지에 병렬로 게이팅 진행 가능**(같은 domain 내부만 depends_on으로 순서 강제).

각 domain 안에서, phase를 `depends_on`이 전부 `status: complete`인 것만 스폰 대상으로 추린다:

1. **api-spec phase** — 대상이면 서브 에이전트로 스폰(model: opus, `.claude/agents/api-spec.md` + `write-api-spec` 스킬 내용 프롬프트에 포함, **`target`(해당 domain명) + `source_request_ids`(그 domain의 `01_plan.yaml` 값 그대로) + `request_path`(`_workspace/00_request.yaml`) 필수 전달** — agent가 그 경로에서 해당 id들의 내용을 직접 읽음). 완료 시 `status: complete` 갱신 + **agent의 완료보고에 담긴 실제 저장 경로를 그대로 받아** 그 domain에 `spec_path`로 기록(오케스트레이터가 경로를 계산·추측하지 않는다 — `output_path` 기본값이 항상 지켜진다는 보장이 없어서 agent 보고값만 신뢰)
2. **backend/frontend phase** — 같은 domain에 이 둘이 **동시에** 대상이면 팀모드로 승격:
   - backend phase의 `path`(planner가 `01_plan.yaml`에 이미 결정해둔 값)에 CLAUDE.md 컨벤션(`types/` 서브경로) 적용해 `type_source`도 함께 산출 — 오케스트레이터는 `path` 자체를 재판단 안 함, planner 값 그대로 relay
   - 둘 다 유휴 스폰(한 메시지에 병렬 `Agent` 호출, "추가 지시 대기") → 스폰 결과에서 각 id 확보. 이때 프롬프트에 `source_request_ids` + `request_path`(`_workspace/00_request.yaml`)도 포함 — `spec_path` 유무와 무관하게 항상 전달(계약변경 없는 domain은 `spec_path` 자체가 없어서 이게 유일한 요구사항 출처)
   - 서로에게 SendMessage로 kickoff: 상대 id + 임무(backend: `path`/spec_path, frontend: `path`/spec_path/`type_source`) — `path`는 각자 phase의 `01_plan.yaml` `path` 필드 값을 그대로 전달(오케스트레이터가 재판단 안 함, planner가 이미 결정). **`language`는 전달하지 않는다** — 각 agent가 자기 `path` 진입 후 스스로 확인(backend.md 작업원칙 참고) + 배경(계약 내용 요약) + 통신규칙("일반 텍스트는 안 보임, SendMessage로만") + **종료조건**(스펙 이탈 협의 최대 2왕복, frontend ack 1회로 종료, ack 후 backend 추가발신 금지) — **type 완료 신호는 이 종료조건(왕복 카운트)과 별개**, backend/frontend 각 agent 정의(`backend.md`/`frontend.md`)의 팀 통신 프로토콜에 따라 자율 처리
   - 하나만 대상이면 서브 에이전트로 단독 스폰(id 릴레이 불필요) — 프롬프트에 `target`, `path`(각자 phase의 `01_plan.yaml` 값 그대로), `source_request_ids` + `request_path`(항상 전달), `spec_path`(있으면), `type_source`(frontend 한정, 기존 backend 타입 참조 필요한 경우만 — 오케스트레이터가 정적 경로로 직접 전달, SendMessage 아님) 전달 — `language`는 전달하지 않음
3. **qa phase** — 그 domain의 backend/frontend phase가 전부 `status: complete`면 서브 에이전트로 스폰(model: opus, `subagent_type: "general-purpose"` 필수, `.claude/agents/qa.md` 프롬프트 포함, `domain`+`impl_paths`+`spec_path`(있으면) 전달)

각 phase 완료 알림마다 `_workspace/01_plan.yaml`의 해당 `status`를 갱신(파일 재작성). 이 갱신이 다음 게이팅 판단의 근거가 된다.

### Phase 4: 종합 및 보고

1. 모든 domain의 모든 phase가 `complete` 또는 `error`가 될 때까지 Phase 3 반복
2. 각 에이전트 완료보고서에서 "외부설정 필요사항" 섹션 취합(키 이름/용도/발급처, 중복 제거)
3. 모든 qa 리포트(도메인별로 이미 incremental 실행되어 누적된 상태) 종합 — 여기서 QA를 새로 트리거하지 않는다
4. 최종 보고서 구성: planner 계획 대비 완료 요약 + QA 정적검증 결과(도메인별) + 외부설정 체크리스트 + 런타임 QA 필요 여부 안내(외부설정 완료 후 별도 요청 시에만 수행한다고 명시)

### Phase 5: 정리

1. 팀모드로 스폰됐던 backend/frontend에 종료 요청(SendMessage, 개별 전송) — 이미 phase 완료로 알아서 멈췄다면 생략
2. `_workspace/` 보존(사후 감사·재실행 대비)
3. 사용자에게 결과 요약 보고, 개선 피드백 요청

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
| qa가 위반사항 발견 | 코드 수정은 안 함(QA는 검증만) — 리포트를 최종보고서에 포함, 필요 시 사용자 확인 후 해당 backend/frontend agent 재스폰해서 수정 |
| 도메인 간 데이터 충돌 | 발생 안 함(도메인 간 계약 공유 없음이 설계 전제) — 만약 발견되면 planner의 도메인 분리 판단 오류이므로 planner 재실행 필요 |

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
