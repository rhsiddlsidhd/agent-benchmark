# 04_test_report.md — feat/popular-products-section Phase4 통합 테스트 리포트

> 작성: test-suite (Phase4, 서브 에이전트 단독 호출)
> 대상: `04_integration_report.md` §6 필독 검증 함정 대응 — dev DB 2건으로는 화면 확인이 증거가 될 수 없어, 전부 `mongodb-memory-server` 시딩 + 자동 테스트로 검증했다.

---

## 1. 사전 확인 — 이미 커버된 영역 (중복 방지)

착수 전 `04_integration_report.md`, `01_api_contract.md`, `01_db_schema.md`, `01_ui_flow.md`를 정독하고, backend-impl/frontend-impl이 이미 작성한 단위 테스트를 확인했다.

| 파일 | 기존 커버 범위 |
|---|---|
| `src/server/services/product.service.test.ts`의 `getPopularProductsService` 블록 | 좋아요 3/2(featured)/2/1/0 + soft-deleted + `likes` 필드 없는 레거시 문서 시딩 → 정렬/tie-break(isFeatured)/제외 조건을 서비스 레벨에서 실제 DB로 이미 검증. `limit` 클램프, `userId` 반영, `$unset` 확인까지 포함 |
| `PopularProductsSection.test.tsx` | 손으로 만든 Product 객체로 3개/2개/8개 렌더링, rank 배지, `overflow-x-auto` 랜드마크 |
| `ProductCard.test.tsx` | rank 미전달 시 배지 없음 / `rank={1}` 시 배지+sr-only 렌더 |
| `HomeTemplate.test.tsx` | organisms 전체 mock 상태에서 배치 순서(SubCategoryNav→인기 상품→초대장), 5개 prop 조합 |

→ 이 레벨의 재검증은 반복하지 않고, **Phase4는 이 계층들 "사이의 연결부"** — DB에서 나온 실제 정렬 결과가 컴포넌트까지 순서를 잃지 않고 전달되는지, page.tsx의 에러 흡수가 실제로 작동하는지 — 에 집중했다.

---

## 2. 신규/수정 테스트 목록

### 2.1 `src/app/(main)/_components/PopularProductsSection.integration.test.tsx` (신규)

DB(mongodb-memory-server) → `getPopularProductsService`(실제 aggregate) → `<PopularProductsSection>`(실제 컴포넌트, `ProductCard`도 mock 안 함) 를 관통하는 시나리오.

1. **골든패스**: 좋아요 5/3/3(동점, 한쪽만 `isFeatured`)/2/1로 시딩 + 좋아요 0개 상품 + soft-deleted(좋아요 8개, 최다) 상품을 섞어 투입 → 실제 서비스 호출 결과를 그대로 렌더링.
   - 헤딩 "인기 상품" + `<h3>` 5개가 정확히 `[1위, 2위(featured), 3위, 4위, 5위]` 순서로 렌더됨을 확인(제목 텍스트 직접 비교, 순서 포함).
   - 좋아요 0개/soft-deleted 상품 제목이 DOM에 아예 없음을 확인.
   - `sr-only` rank 배지 텍스트(`인기 N위`)가 문서 순서대로 1~5임을 확인 — DB 정렬 결과와 화면 배지 숫자가 어긋나지 않는지가 핵심.
2. **REQ-2 골든패스(실 DB)**: 좋아요 상품 2개만 시딩 → 서비스는 `[]`가 아니라 2개 배열을 그대로 리턴(게이트가 UI 책임임을 재확인) → 그 결과를 그대로 렌더링해도 섹션이 DOM에 렌더되지 않음(`container`가 빈 DOM).

### 2.2 `src/app/(main)/page.integration.test.ts` (신규)

이 프로젝트에 app router `page.tsx`를 직접 테스트하는 선례가 없어, `route.integration.test.ts`(`app/api/products/search`)와 동일한 원리 — 실제 DB를 관통시켜 함수를 직접 호출하고 리턴값을 검사 — 를 page.tsx에 적용했다. JSX는 함수 호출이 아니라 엘리먼트 서술자이므로 `await page()` 시점엔 `HomeTemplate`/`EcommerceHero` 등 하위 컴포넌트 바디가 실행되지 않는다 — 그래서 `@vitest-environment node`로 jsdom 없이 돈다(더 빠르고, organism mock도 불필요).

`@/server/services` 배럴을 `importOriginal`로 spread하고 `getPopularProductsService`만 `vi.fn(actual)`로 감싸 개별 테스트에서 override 가능하게 했다(그 외 `createProductService`/`getFeaturedTemplatesService`/`getProductService`는 실제 구현 그대로).

1. **골든패스**: DB에 좋아요 4/3/2/1로 시딩 → `await page()`가 리턴한 엘리먼트의 `props.popularProducts`가 실제 정렬 결과와 정확히 일치(`["1위","2위","3위","4위"]`), 전부 `isLiked: false`(ISR 공유 캐시라 `userId` 미전달 확인), `getPopularProductsService`가 `POPULAR_PRODUCTS_LIMIT`으로 호출됐는지 배선 확인.
2. **에러 흐름(리더 지시 #4)**: `getPopularProductsService`를 1회 `mockRejectedValueOnce`로 throw시킴 → `await page()`가 reject하지 않고(=흡수 실패 시 이 await 자체가 테스트를 실패시킨다) `props.popularProducts`가 `[]`로 떨어짐을 확인. `.catch(() => [])`(`01_api_contract.md` §3)가 실행 레벨에서 실제로 동작함을 증명.

### 2.3 `src/client/components/organisms/ProductGrid.test.tsx` (기존 파일에 1개 추가)

리더 지시 #3(rank prop 배지 렌더/미렌더 무회귀, ProductGrid/TemplateCarouselGroup 경유). `ProductGrid`는 `01_ui_flow.md` §5.2가 명시한 기존 소비처 2곳 중 하나(rank 미전달)다. `rank`를 넘기지 않는 상태에서 카드 2장을 렌더링해도 `인기 N위` sr-only 텍스트나 순위 숫자 배지가 전혀 나타나지 않음을 확인 — 인기 섹션이 추가한 rank 배지가 기존 검색결과/카탈로그 그리드로 새지 않는지의 회귀 확인.

**`TemplateCarouselGroup`은 이번에 테스트 추가하지 않았다** — 아래 §4 "커버 못 한 영역"에 이유를 명시.

---

## 3. 실행 결과

```
Test Files  123 passed (123)
     Tests  637 passed (637)
```

신규/수정 3개 파일만 먼저 단독 실행 후(8/8 통과), 전체 스위트(`npx vitest run`, 인프라 전체 — mongodb-memory-server 포함)를 재실행해 회귀 없음을 확인했다. `app/api/products/route.regression.test.ts`(카테고리 필터), `app/api/products/search/route.integration.test.ts`(검색)를 포함해 이 기능이 손대지 않은 인접 기능들도 전부 그린 — `product.service.ts`에 이 프로젝트 최초의 `aggregate()` 호출을 추가했음에도 기존 `find()` 기반 함수들(`getAllProductsService` 등)에 영향이 없음을 재확인했다(리더 지시 #5 회귀 스모크는 기존 회귀 테스트 재실행으로 충족 — 해당 코드 경로가 이번 기능으로 수정되지 않았으므로 신규 중복 테스트를 만들지 않았다).

---

## 4. REQ별 커버 판정

| REQ | Phase4 통합 테스트 근거 |
|---|---|
| REQ-1 (좋아요순 정렬 + Top N + 0개/soft-delete 제외) | `PopularProductsSection.integration.test.tsx` 골든패스 — 서비스 결과가 컴포넌트까지 순서 보존돼 도달함을 실제 DB로 확인(서비스 자체 정확성은 기존 `product.service.test.ts`가 이미 충분히 커버) |
| REQ-2 (Home 배치 + 3개 미만 숨김) | `PopularProductsSection.integration.test.tsx` REQ-2 케이스(실 DB 2건 시딩) — 게이트가 실제 서비스 결과에 대해서도 정확히 작동 |
| REQ-3 (ProductCard rank optional, 기존 소비처 무회귀) | `PopularProductsSection.integration.test.tsx`의 rank 배지 순서 확인 + `ProductGrid.test.tsx` 신규 케이스(rank 미전달 무회귀) |
| 에러 흐름(`getPopularProductsService` throw → Home 안 죽음) | `page.integration.test.ts` 에러 흐름 케이스 |

---

## 5. 커버 못 한 영역 / 플래그

- **`TemplateCarouselGroup`은 이번 Phase4에서 테스트를 추가하지 않았다.** `01_ui_flow.md` §5.2가 명시한 `ProductCard` 기존 소비처 2곳 중 하나지만, 이 컴포넌트는 이번 기능이 건드리지 않았고(설계 문서가 "재사용 안 함"으로 명시적으로 결정) `async` 함수형 Server Component라 RTL로 테스트하려면 `await TemplateCarouselGroup({...})`로 직접 호출 후 렌더하는 별도 패턴이 필요한데, 이 프로젝트에 이 컴포넌트에 대한 테스트 자체가 지금까지 하나도 없다(사전 조사로 확인, `find`로 `TemplateCarouselGroup.test.tsx` 부재 확인). 이번 기능이 이 컴포넌트를 수정하지 않았으므로 신규 테스트 인프라를 여기서 처음 까는 건 스코프 밖 판단 — `ProductCard`가 rank를 optional로 받고 `TemplateCarouselGroup`이 rank를 안 넘기는 건 소스 코드로 이미 확인했고(§3.1 소스), `ProductCard.test.tsx`의 "rank 미전달 시 배지 없음" 단위 테스트가 이 무회귀를 컴포넌트 레벨에서 충분히 담보한다고 판단해 별도 통합 테스트를 만들지 않았다. **버그는 아니고, 기존에 존재하던 테스트 공백을 이번 기능이 상속받은 것** — 별도 이슈로 후속 처리 권고.
- mutation testing(stryker)은 지시대로 돌리지 않았다.

## 6. 발견한 이슈

**없음.** 구현이 4개 설계 문서(`01_api_contract.md`/`01_db_schema.md`/`01_ui_flow.md`/`04_integration_report.md`)의 명세와 정확히 일치했다 — aggregate 파이프라인 5단(`$match`→`$addFields`→`$sort`→`$limit`→`$unset`), tie-break 5단, `limit` 클램프, `POPULAR_PRODUCTS_LIMIT`/`MIN_ITEMS` 상수 사용, `.catch(() => [])` 흡수, `userId` 미전달(ISR 캐시 보호) 전부 실제 실행으로 재확인했고 어긋난 지점이 없었다. boundary-verifier의 4개 PASS 판정과 일치.

---

## 7. 최종 판정

**REQ-1/2/3 전부 Phase4 통합 테스트로 재확인 완료(passes: true 유지).** 전체 스위트 123 파일 / 637 테스트 그린. PR(Phase5) 진행 가능.
