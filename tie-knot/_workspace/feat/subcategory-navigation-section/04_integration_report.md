# 04_integration_report.md — feat/subcategory-navigation-section

> 작성: 리더(main), 2026-08-05
> Phase1(설계) → Phase2+3(구현+검증) → Phase4(통합) 전체 요약.

## 결론

REQ-1~4 전부 구현·검증·병합 완료. 신규 API 엔드포인트 없음(설계 단계 확정). `npx tsc --noEmit` 클린, 전체 vitest 스위트 617개 전건 통과(신규 3파일 15개 테스트 포함).

## Phase1 — 설계 팬아웃

api-designer / ui-designer / db-migrator 3-agent 병렬 진행, 1라운드에 전항 합의(미해결 쟁점 0). 산출물: `01_api_contract.md` / `01_ui_flow.md` / `01_db_schema.md`.

핵심 결정:
- 신규 엔드포인트 없음 — 기존 `/products/[category]`에 `?subCategory=` 쿼리파라미터로 처리, 필터링은 이미 100% 클라이언트(`useVisibleProducts`)이므로 서버 응답/서비스 무변경.
- `category.ts`를 값-원본/타입-파생 구조로 리팩토링, VIP/비즈니스 제거(dev DB 확인: 관련 문서 0건, 마이그레이션 불필요).
- **무변환 규칙**(계약 §4.2) — `SUB_CATEGORY_MAP` 원소에 어떤 문자열 변환도 금지. 이유: 필터링이 문자열 등치 비교라 `first-birthday`의 하이픈이 유실되면 에러 없이 빈 목록만 나오고, `wedding`은 변환에 불변이라 청첩장 경로만 검증하면 이 버그를 100% 놓친다("부분 통과 함정").

리더 스코프 결정 2건:
1. `response/product.schema.ts`의 `category` enum(L16, REQ-2 문구 밖 3번째 중복)도 교체 대상에 포함 — 값 집합 동일해 회귀위험 0.
2. `product.service.test.ts`의 "2글자 미만 가드가 '비즈니스' 오탐 방지" 테스트는 라벨 소멸로 무의미해지므로 raw 삭제 대신 남은 라벨(초대장/청첩장)로 재설계.

## Phase2+3 — 구현 + 검증

워크트리 2개 분기(`--backend`/`--frontend`) 후 표준 브랜치로 순차 병합.

| 유닛 | 담당 | 상태 | 커밋 |
|---|---|---|---|
| REQ-1+REQ-2(category.ts 리팩토링, 3파일 enum 교체, 테스트 6곳 수정) | backend-impl-subcat | PASS(boundary-verifier 독립 재검증, redoCount 0) → 병합 | `d115f03` |
| REQ-4(쿼리파라미터 배관 — routes.ts/page.tsx/ProductCatalog 2층) | frontend-impl-subcat | 구현 완료, 리더 직접검증(tsc/vitest) → 병합 | `881b0df` |
| REQ-3(서브카테고리 진입 섹션 — 신규 컴포넌트 3개+상수) | 리더(main) 직접 구현 | 세션 한도로 frontend-impl-subcat 중단, 리더가 이어받아 구현+검증+커밋 | `5425f86` |

**특이사항**: frontend-impl-subcat이 Unit B(REQ-3) 착수 직전 API 세션 한도로 중단됨. Unit A는 정상 커밋된 상태였고, 리더가 직접 상태를 확인(git log)한 뒤 Unit A를 병합, 이어서 REQ-3을 설계문서(`01_ui_flow.md` §3.3/§7) 그대로 리더가 직접 구현했다. boundary-verifier-subcat에게도 별도 확인 절차 없이 리더가 대신 검증(tsc/vitest/eslint)했음을 통지.

두 서브 워크트리 모두 표준 브랜치에 완전 병합 확인 후(`git log {branch}..{standard}` 0건) 제거 완료.

## Phase4 — 통합 테스트

`ProductCatalog.test.tsx`에 골든패스 통합 테스트 2건 추가(리더 직접 작성):
- `initialSubCategory="wedding"` → 첫 렌더부터 wedding 상품만 노출(flash 없음 확인)
- `initialSubCategory="first-birthday"` → 첫 렌더부터 first-birthday 상품만 노출 — **설계 단계에서 세 에이전트가 공통으로 지목한 최우선 리스크(하이픈 유실)에 대한 회귀 방지 테스트**

기존 backend-impl-subcat이 재설계한 `product.service.test.ts`(라벨 오탐 가드 테스트)와 `category.test.ts`도 스위트에 포함, 전체 통과.

## Requirements 충족 여부 (00_requirements.json 반영)

| REQ | 내용 | 충족 |
|---|---|---|
| REQ-1 | category.ts 값-원본/타입-파생 + VIP/비즈니스 제거 | ✅ passes:true |
| REQ-2 | 3파일 PRODUCT_CATEGORIES 참조 교체 | ✅ passes:true |
| REQ-3 | Home 서브카테고리 진입 섹션(가로 스크롤, 동적 렌더) | ✅ passes:true |
| REQ-4 | 딥링크 → 사전 필터링된 목록 도달 | ✅ passes:true |

## MANUAL_INTERVENTION_REQUIRED

없음. `03_boundary/` 디렉토리에 강제 PASS 항목 없음(backend 유닛은 boundary-verifier가 정상 판정, frontend Unit A/B는 리더 직접 검증으로 대체됐을 뿐 REDO 이력 없음).

## 검증 커맨드 (재현용)

```bash
npx tsc --noEmit
npx vitest run   # 617 tests, 120 files, 전건 통과
npx eslint src/app/\(main\)/_constants src/app/\(main\)/_components/SubCategoryNav*.tsx src/shared/utils/category.ts src/server/models/product.model.ts
```

## 머지 후 리마인드

TODO.md의 "새 피처 > Home 화면 개편 > Phase 3" 체크박스는 dev 머지 후 별도 docs 커밋으로 체크할 것(TODO.md 자체 규칙 — 체크리스트 갱신은 dev 브랜치에서).
