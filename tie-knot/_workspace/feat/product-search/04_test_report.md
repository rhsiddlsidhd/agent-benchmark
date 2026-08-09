# 04. 테스트 리포트 — feat/product-search (Phase4)

> 작성: test-suite (2026-07-31)
> 입력: `00_requirements.json`(REQ-1~4, 전부 passes:true), `01_api_contract.md`, `01_ui_flow.md`, `04_integration_report.md`(known limitation 7건)

## 요약

기존 단위/서비스 테스트(backend-impl 84케이스 + frontend-impl 컴포넌트/훅 테스트)는 이미 REQ-1~4 각 함수 단위 로직을 충분히 커버하고 있어 중복 작성하지 않았다. 이 Phase4에서는 **여러 레이어(DB → service → route)를 실제로 관통하는 통합 시나리오**와 **인접 기존 기능(GET /api/products)의 회귀 스모크**만 신규로 추가했다.

기존 `src/app/api/products/search/route.test.ts`는 `searchProductsService`를 `vi.mock`으로 대체한 순수 단위 테스트라, route.ts의 파싱/응답 wrapping 로직만 검증하고 실제 DB까지는 안 닿는다. 이번에 추가한 두 파일은 `mongodb-memory-server`로 실제 mongoose 쿼리를 태워 그 공백을 메운다.

## 신규 작성 파일

| 파일 | 목적 |
|---|---|
| `src/app/api/products/search/route.integration.test.ts` | 상품 검색 골든패스 + 에러/엣지 흐름을 DB~route 전 레이어로 검증 |
| `src/app/api/products/route.regression.test.ts` | 이번 기능이 인접 파일(`product.service.ts`)을 건드리며 기존 `GET /api/products` 카테고리 필터를 깨지 않았는지 회귀 스모크 |

## 작성한 시나리오 (총 8케이스, 전부 통과)

### `route.integration.test.ts` (5케이스)

1. **골든패스 — title 부분일치**: "웨딩청첩장 프리미엄"/"완전히 다른 제목" 두 상품을 실제 DB에 심고 `?q=웨딩`으로 GET 호출 → 매칭 상품 1건만 반환, 응답이 `{ items, total }` 래핑 없이 배열 그대로임을 확인 (§01_api_contract.md §5.1).
2. **골든패스(핵심) — 라벨 역조회 부분일치**: `subCategory: "first-birthday"`(라벨 "돌잔치") 상품과 `"wedding"` 상품을 심고 `?q=돌잔`으로 GET 호출 → "돌잔"이 "돌잔치"에 **부분일치**로 걸려 first-birthday 상품만 반환됨을 확인. 정확일치 구현이었다면 실패했을, 이번 기능의 핵심 요구사항(§01_api_contract.md §4.3 확정 사항)을 DB~route 전 레이어로 증명.
3. **에러 아님 — 빈 쿼리(`q` 파라미터 자체 없음)**: DB에 매칭 가능한 상품이 있는 상태에서 `q` 없이 GET 호출 → `200 + { success: true, data: [] }`. DB에 데이터가 있어도 비검색 상태에서는 절대 반환되지 않음을 함께 증명(마운트 직후 빈 검색어로 전체 카탈로그가 새는 회귀를 잡는 케이스).
4. **에러 아님 — 공백만(`q=%20%20`)**: 위와 동일 조건, 공백만 입력 → 동일하게 `200 + []`.
5. **VALIDATION 에러 shape — 101자 초과**: `q`가 101자일 때 `400` + `body.error.category === "VALIDATION"` + `body.error.fieldErrors.q` 존재 + `body.data`가 `undefined`(서비스 호출 전에 막혀 응답에 `data` 필드 자체가 없음)까지 확인.

### `route.regression.test.ts` (3케이스)

6. `category` 없이 GET `/api/products` 호출 → 전체 상품 반환 (기존 동작 유지).
7. `category=invitation` 완전일치 필터 → 검색 기능의 부분일치 로직과 무관하게 정상 동작.
8. 존재하지 않는 `category` → `200 + []` (404 아님, 기존 동작 유지).

## 커버하지 못한 영역 (의도적 스코프 밖)

- **프론트엔드 통합(브라우저 E2E)**: 이 프로젝트엔 Playwright 등 E2E 도구가 없다. `/search` 페이지의 실제 렌더링~상호작용 흐름(디바운스 → SWR → 상태분기)은 이미 `useProductSearch.test.ts`/`ProductSearch.test.tsx` 등 컴포넌트/훅 단위 테스트가 mock API로 커버 중이며, 이번 Phase4에서 추가 조합 테스트를 만들지 않았다 — mock 경계가 이미 명확하고(SWR key 문자열, envelope shape) 프론트-백엔드 양쪽 다 단위 테스트가 이미 그 경계를 각각 검증하고 있어 실익이 적다고 판단.
- **regex 메타문자 이스케이프 / ReDoS 방어**: `product.service.test.ts`(서비스 단위)에 이미 "regex 메타문자가 포함된 검색어도 리터럴로 취급" 케이스가 존재해 중복 작성하지 않음.
- **`isLiked` 파리티**: known limitation #4(`isLiked` 항상 false)는 기존 스코프 밖 사항이라 별도 통합 케이스를 추가하지 않음.
- **`npm run verify:api`/`report:api` 스크립트 자체 결함**(known limitation #6, #7): 이번 기능과 무관한 기존 툴링 버그로, 통합 테스트로 우회 검증할 대상이 아니라고 판단해 건드리지 않음.

## 발견된 버그

없음. boundary-verifier 판정대로 REQ-1~4 실제 구현과 계약 사이 어긋남을 발견하지 못했다.

## 실행 방법 / 결과

```bash
# 이번에 추가한 두 파일만
npx vitest run src/app/api/products/search/route.integration.test.ts src/app/api/products/route.regression.test.ts
# → Test Files 2 passed (2) / Tests 8 passed (8)

# 전체 스위트 (fileParallelism: false, 회귀 확인)
npm run test
# → Test Files 113 passed (113) / Tests 598 passed (598)

# pre-commit과 동일한 커버리지 게이트
npm run test:coverage
# → 전체 통과, threshold 미달 없음(perFile lines 80% 위반 없음).
#   route.ts 파일들은 test-scope-exclude.json에 등록돼 있어 이번 신규
#   *.integration.test.ts/*.regression.test.ts가 vitest.config.ts의
#   testedSourceFiles 스캔에서 만들어내는 존재하지 않는 대응 소스 경로
#   (예: route.integration.ts)도 coverage 리포트에 아무 영향을 주지 않음을
#   실제 실행으로 확인함.

# lint / typecheck (pre-commit 훅과 동일 순서)
npm run lint        # 0 errors (기존 무관 warning 2건만 존재)
npx next typegen && npx tsc --noEmit   # 통과
```

## 커밋

`test: 상품 검색 골든패스/에러흐름 통합 테스트 + 기존 카테고리 필터 회귀 스모크 추가` — `feat/product-search` 브랜치에 직접 커밋 완료 (워크트리 아님, 표준 브랜치).
