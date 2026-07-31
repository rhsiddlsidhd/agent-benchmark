# 04. 통합 리포트 — feat/product-search

> 작성: 리더 (2026-07-31)

## 요약

상품 검색 기능(REQ-1~4) 전건 구현+병합+경계면 검증 완료. REDO 0회, 강제 PASS(`MANUAL_INTERVENTION_REQUIRED`) 0건.

| REQ | 내용 | 상태 |
|---|---|---|
| REQ-1 | `GET /api/products/search?q=` — title regex 부분일치 + category/subCategory 라벨 부분일치 역조회를 `$or`로 결합 | ✅ PASS |
| REQ-2 | Header 검색 아이콘 → `/search` 이동 | ✅ PASS |
| REQ-3 | `/search` 페이지, 기존 `ProductGrid` 재사용, 300ms 디바운스 | ✅ PASS |
| REQ-4 | 0건 시 안내 메시지 + "전체 상품 보기" 링크 | ✅ PASS |

## Phase 이력

- **Phase1(설계)**: api-designer/ui-designer/db-migrator 병렬 진행. 동료 간 SendMessage 상호 도달이 이 환경에서 초기에 실패(스폰 타이밍 이슈)해서 셋 다 협업 없이 mock 전제로 각자 작성 → 리더가 산출물 교차대조해 미해결 쟁점(파라미터 shape v1→v2 정정, status 필터, isLiked, URL 동기화, 0건 링크 등) 전부 직접 판정.
- **Phase2+3(구현+검증)**: 워크트리 2개 분기. boundary-verifier가 구현 착수 전 계약↔코드베이스 사전 감사에서 결함 2건(B1: 표준 브랜치에 남아있던 폐기 v1 zod 스키마, B2: 훅 타입 `ProductResponse[]`가 `ProductGrid` prop과 구조적으로 안 맞음) 선제 발견 → 둘 다 구현 착수 전에 해소. backend/frontend 각 1유닛, boundary-verifier 판정 전부 PASS. 워크트리 정리 완료.

## 알려진 제약 (known limitation, 이번 스코프에서 조치 안 함)

1. **검색 의미론 이원화** — 기존 카탈로그 필터(`useVisibleProducts.ts`)는 대소문자 구분+초성 검색 지원, `/search`는 대소문자 무시+초성 미지원. MongoDB `$regex`는 초성 매칭이 원리적으로 불가능해 서버에서 맞추려면 `titleChosung` 비정규화 필드+backfill+동기화 의무가 필요한데 요구사항에 초성 요구가 없어 유보. 재검토 트리거: 초성 검색 요구가 실제로 들어올 때.
2. **O1 — 영문 2글자 검색어의 enum key 확장매칭**: `"in"`/`"on"` 등이 `"invitation"`의 부분문자열이라 라벨 역조회 최소길이(2글자) 조건을 통과해 카탈로그 전량이 걸린다. 계약(§4.3)대로 구현된 의도된 동작 — 현재 카테고리 1종이라 체감 문제 없음. 재검토 트리거: 카테고리 종류가 늘어 오탐 사례가 실사용에서 나타날 때.
3. **O3 — `ProductSearch.tsx` else 분기의 이론적 도달 가능성**: `products===undefined`일 때도 구조적으로는 `ProductGrid` 내장 빈 상태 문구("상품을 준비 중에 있습니다")에 닿을 수 있는 모양이지만, 현재 SWR 기본 옵션(`revalidateOnMount` 기본 true + `isLoading` 시맨틱)상 LOADING이 먼저 잡아 실제 도달 불가로 검증 완료. **SWR 옵션을 `revalidateOnMount:false`나 suspense 모드로 바꾸면 이 가정이 깨진다** — 향후 그 옵션을 건드리는 변경이 있으면 재검증 필요.
4. **`isLiked` 항상 `false`** — 기존 `GET /api/products`와 파리티(v1 한계). `/search` 결과의 하트가 항상 빈 상태로 렌더된다. `getAuth()` 추가로 전환 가능하나 이번 스코프에서 안 함.
5. **pre-commit 커버리지 리포트가 `(main)/...` 라우트그룹 하위 파일에서 `0/0 Unknown%`로 뜨는 기존 툴링 버그** — 스크립트 자체는 exit 0로 정상 종료돼 커밋을 막지는 않았음(frontend-impl 발견, 이번 기능 파일만의 문제 아니라 기존 이슈). 이번 PR 스코프 밖.
6. **`npm run verify:api` 스크립트 자체가 깨져있음** — `scripts/lighthouse-audit/get-auth-cookie` 모듈 누락 + `scripts/api-verify/schemas.js`의 import 경로(`src/schemas/...`)가 실제 구조(`src/shared/schemas/...`)와 어긋남. 이번 기능과 무관한 기존 이슈, 대신 backend-impl의 실제 테스트(84케이스)와 boundary-verifier의 독립 `tsc`/vitest 실행으로 검증 완료.

## 산출/변경 파일

**백엔드**: `src/app/api/products/search/route.ts`, `src/server/services/product.service.ts`(`searchProductsService`), `src/shared/utils/category.ts`(`findProductCategoriesByTerm`/`findSubCategoriesByTerm`), `src/shared/utils/escape-regexp.ts`(신규), `src/shared/schemas/request/productSearch.schema.ts`(신규) — 각 대응 테스트 포함

**프론트**: `src/shared/constants/routes.ts`(`search` 경로), `src/app/(main)/_components/Header.tsx`(검색 아이콘), `src/app/(main)/search/`(page.tsx, `_components/{ProductSearch,SearchBar,SearchEmptyState}`, `_hooks/{useProductSearch,useDebouncedValue}`) — 각 대응 테스트 포함

**공유 컴포넌트(`organisms/`) 무수정 확인** — boundary-verifier가 dev baseline 52개 파일 해시 대조로 IDENTICAL 확인.
