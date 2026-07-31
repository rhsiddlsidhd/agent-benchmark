---
name: boundary-verify
description: "API↔프론트 훅, 라우팅, 상태 전이, DB↔API↔UI 필드명 같은 경계면 정합성을 교차 검증할 때 사용. 두 컴포넌트가 각자는 멀쩡한데 연결부에서만 어긋나는 버그를 잡는다. 코드 리뷰나 존재 확인만으로는 못 잡는 결함을 대상으로 하며, PASS/FIX/REDO 판정과 REDO 재시도 상한 관리가 필요할 때 반드시 이 스킬을 로드할 것."
---

# Boundary Verify

경계면 불일치는 양쪽을 각각 봐서는 안 잡힌다 — 반드시 생산자(API route/action)와 소비자(hook/컴포넌트)를 **동시에 Read**해서 교차 비교해야 한다. TypeScript 제네릭 캐스팅이나 `npm run build` 통과는 이 결함을 못 잡는다(런타임 shape 불일치는 컴파일러가 안 봄).

## 0. 자동 검사 먼저

이 프로젝트엔 이미 검증 스크립트가 있다 — 수작업 grep 전에 먼저 돌린다:

```bash
npm run report:api   # src/app/api/**/route.ts 스캔, 라우트 목록/shape 추출 → scripts/api-report/output/
npm run verify:api    # 실제 개발서버에 요청 보내 응답을 스키마와 대조 → scripts/api-verify/output/
```

이 결과를 1차 신호로 삼고, 아래 7기준 중 스크립트가 커버 못 하는 부분(라우팅 매핑, 상태 전이, Server Action/채널 A, 옵셔널 필드 처리 등)을 수동으로 마저 채운다.

## 1. 7가지 판정 기준

| # | 기준 | 왼쪽(생산자) | 오른쪽(소비자) | 놓치는 이유 |
|---|------|-------------|---------------|-----------|
| 1 | API 응답 래핑 불일치 | `routeSuccess(data)`/`NextResponse.json()`의 실제 shape | 훅의 `fetchJson<T>` 제네릭 | 래핑(`{items,total}`) vs 배열 기대를 캐스팅으로 우회하면 컴파일은 통과 |
| 2 | 케이스 변환 불일치 | Mongoose 모델 필드명(camelCase 기준) | API 응답/프론트 타입 필드명 | snake_case 유입 시 조용히 undefined |
| 3 | 파일 경로 ↔ 링크 경로 | `src/app/` 하위 실제 page 경로((group) 제거, [param] 반영) | 코드 내 `href`/`router.push`/`redirect` 값 | 파일 구조와 링크를 따로 검증하면 둘 다 "정상"으로 보임 |
| 4 | 상태 전이 맵 ↔ update 코드 | 설계 문서의 상태 전이표(`01_ui_flow.md`) | 실제 `.update({status:...})`/상태 세터 코드 | 맵 존재 확인만 하고 모든 업데이트 코드를 추적 안 하면 누락 놓침 |
| 5 | API ↔ 프론트 훅 매핑 누락 | `src/app/api/`의 엔드포인트 전체 목록 | `src/client/hooks/`의 fetch 호출 URL 전체 목록 | 1:1 매핑을 안 하면 "만들었는데 아무도 안 씀"이 안 보임 |
| 6 | 즉시 응답 ↔ 비동기 결과 혼동 | route가 즉시 반환하는 shape | 프론트가 접근하는 필드(비동기 결과 필드를 즉시 응답에서 읽는지) | 동기/비동기 구분 없이 타입만 보면 놓침 |
| 7 | 옵셔널 필드 처리 | 스키마의 optional/nullable 정의 | 양쪽의 null/undefined 처리 코드 | 한쪽만 옵셔널 처리하면 다른 쪽에서 크래시 |

## 2. 판정 절차

1. 대상 엔드포인트의 생산자 파일과 소비자 파일을 **같은 턴에** Read
2. 7기준을 순서대로 대조. 위반 발견 시 파일:라인 단위로 근거 기록
3. 판정:
   - **PASS** — 7기준 전부 정합. 다음 엔드포인트로.
   - **FIX** — 부분 수정으로 해결 가능(필드명 하나 틀림, null 처리 누락 등). 담당 구현자에게 구체 수정 지시.
   - **REDO** — 설계 자체가 잘못됨(계약과 실제 필요가 근본적으로 다름). 설계 문서 수정 필요 → 담당자 + 리더에게 알림.
4. 판정 결과를 `_workspace/{domain}/{name}/03_boundary/{endpoint-slug}.json`에 기록 (형식은 아래 3절)

## 3. REDO 카운터 — 파일 기반 영속

에이전트는 매번 새로 스폰되거나 컨텍스트가 길어질 수 있으므로, REDO 횟수를 **반드시 파일에 저장**한다 (메모리로만 들고 있으면 유실됨).

`_workspace/{domain}/{name}/03_boundary/{endpoint-slug}.json`:

```json
{
  "endpoint": "/api/couple-info",
  "rounds": [
    { "round": 1, "verdict": "REDO", "reason": "...", "at": "2026-07-31T10:00:00Z" },
    { "round": 2, "verdict": "REDO", "reason": "...", "at": "2026-07-31T10:20:00Z" }
  ],
  "redoCount": 2,
  "forcedPass": false
}
```

- 매 판정마다 이 파일을 Read → 기존 `redoCount` 확인 → 새 라운드 append → Write
- **같은 엔드포인트에서 `redoCount`가 2에 도달한 상태로 또 REDO 판정이 나오면**: `forcedPass: true`로 바꾸고 `verdict`는 그대로 REDO로 기록하되 실질 처리는 PASS로 넘긴다(다음 엔드포인트 진행 차단하지 않음)
- 이때 `_workspace/{domain}/{name}/03_boundary/MANUAL_INTERVENTION_REQUIRED.md`에 한 줄 추가: `- {endpoint}: 2회 REDO 초과, 강제 PASS. 사유: {요약}`
- 리더에게 SendMessage로 즉시 에스컬레이션 (다음 통합 리포트까지 기다리지 않는다)

## 4. 판정 리포트 형식

담당 구현자에게 보내는 SendMessage는 반드시 파일:라인 + 구체적 수정 방향을 포함한다:

```
판정: FIX
경계면: /api/couple-info ↔ useCoupleInfo
기준: #1 API 응답 래핑 불일치
문제: route.ts:42 에서 { coupleInfo: {...} }로 래핑해서 반환하는데
      useCoupleInfo.ts:18 의 fetchJson<CoupleInfo>()는 언래핑된 객체를 기대함
수정: useCoupleInfo.ts:18을 fetchJson<{coupleInfo: CoupleInfo}>()로 바꾸고
      .coupleInfo로 언래핑하거나, route.ts:42의 래핑을 제거
```

"존재하는가"가 아니라 "일치하는가"로 항상 문장을 맺는다.
