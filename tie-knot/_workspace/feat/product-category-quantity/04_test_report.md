# 04_test_report.md — Phase4 통합 테스트 리포트

> 브랜치 `feat/product-category-quantity` · test-suite 작성 · 04_integration_report.md 인계 사항 대응

## 요약

Phase2/3에서 backend-impl이 이미 서비스/액션 단위 테스트로 이번 기능(REQ-1~7)을 촘촘히 커버했다(`product.service.test.ts`, `order.service.test.ts`, `createProduct.test.ts`, `updateProduct.test.ts`, `createOrder.test.ts` — mongoose model은 실제 DB(`product.service.test.ts`/`order.service.test.ts`), action 레이어는 서비스를 `vi.mock`한 단위 테스트). 특히 04_integration_report.md가 지목한 **회귀 픽스처 2건 중 1번(레거시 Product 문서)은 이미 서비스 레이어에서 실제 DB로 완전히 커버돼 있었다** — `product.service.test.ts`의 `getProductService`/`getProductQuantityBoundsService` 레거시 문서 테스트, `order.service.test.ts`의 `createOrderService` 레거시 문서 테스트.

test-suite가 이번에 추가한 건 그 위에 얹는 **여러 레이어를 관통하는 통합 시나리오**다 — action → 실제 service → 실제 mongodb-memory-server DB → (필요 시) route.ts 응답 계약까지, `vi.mock`으로 서비스 자체를 대체하지 않고 실제로 실행해서 확인한다. 이 프로젝트에 이미 있는 `.integration.test.ts` 선례(`page.integration.test.ts`, `route.integration.test.ts`)와 같은 원리를 액션 3개(`createProduct`/`updateProduct`/`createOrder`)로 확장했다.

## 추가한 파일

| 파일 | 관통 범위 | 핵심 시나리오 |
|---|---|---|
| `src/server/actions/createProduct.integration.test.ts` | action → zod → `createProductService` → 실DB → `GET /api/products` route | REQ-1/2/3/6 골든패스 + 에러 흐름 + invitation 회귀 |
| `src/server/actions/updateProduct.integration.test.ts` | action → `updateProductService` → 실DB(discriminator 모델 선택 포함) | **REQ-7 회귀 픽스처(최우선)** |
| `src/server/actions/createOrder.integration.test.ts` | action → `createOrderService`(REQ-5 DB 재조회) → 실DB | REQ-5 골든패스/에러 흐름 + **회귀 픽스처(레거시 문서)를 action 레이어까지 닫음** |

세 파일 다 외부 연동(Cloudinary `uploadProductImage`)만 `vi.mock`하고, `requireAuth`/`getCookie`는 `"@/server/services"`/`"@/server/lib/cookies"`의 **부분 mock**(`importOriginal` + 필요한 함수만 override)으로 결과만 고정했다 — `createProductService`/`updateProductService`/`createOrderService`/`getProductQuantityBoundsService`/`getAllProductsService`는 전부 실제 구현 그대로 실행된다(`docs/TESTING_GUIDELINE.md` 목킹 정책 준수 — mongoose model을 mock하지 않음).

## 회귀 픽스처 2건 커버 현황

### 1. 레거시 Product 문서(필드 없음) — ✅ 기존 테스트로 이미 충분히 커버, action 레이어로 1건 확장

- **기존 커버(backend-impl, 유지)**: `product.service.test.ts`(`getProductService`/`getProductQuantityBoundsService`가 `?? []`/`?? 1`/`?? 1` 폴백 검증), `order.service.test.ts`(`createOrderService`가 레거시 문서에 대해 1개는 통과·2개는 거부).
- **이번에 추가**: `createOrder.integration.test.ts`의 "★회귀 픽스처★" 케이스 — 서비스 함수를 직접 호출하지 않고 **실제 `createOrder` 액션**(FormData 파싱 → zod 검증 → `requireAuth` → 서비스)까지 관통시켜, 레거시 문서(필드 없음, `ProductModel.collection.insertOne`으로 mongoose 경로 우회 삽입)에 대해 수량 1은 성공(주문 DB에 `quantity:1` 저장 확인)하고 수량 2는 `VALIDATION`으로 거부되는 걸 action 레이어에서 닫았다.
- 상세페이지 조회 크래시 없음(요청서의 (a) 조건)은 `product.service.test.ts`의 `getProductService` 레거시 테스트가 이미 검증(정상 리턴, throw 없음) — 중복 작성하지 않음.

### 2. `updateProduct`를 기존과 다른 category로 호출 — ✅ 신규 추가(핵심 갭)

- **발견한 갭**: 기존 `updateProduct.test.ts`(action 단위 테스트)는 `updateProductService`를 `vi.mock`으로 대체해 "null 리턴 시 NOT_FOUND"라는 **액션의 분기 로직**만 검증했다. `product.service.test.ts`(서비스 단위 테스트)에도 "카테고리를 바꿔서 discriminator 모델 불일치로 null이 실제로 발생하는" 케이스는 없었다 — 즉 REQ-7의 핵심 메커니즘(discriminatorKey 쿼리 조건 자동 주입 → 매칭 실패 → null)이 mock 뒤에 가려져 **한 번도 실제로 실행된 적이 없었다.**
- `updateProduct.integration.test.ts`의 "★회귀 픽스처★" 케이스가 이 갭을 닫는다: 실제로 `favor` 상품을 생성 → `updateProduct` 액션에 `category:"invitation"`으로 수정 요청 → 실제 mongoose discriminator 쿼리가 매칭 실패 → 실제 `null` 발생 → 액션이 `NOT_FOUND`로 번역하는 전 과정을 실행으로 확인. 원본 문서가 변경되지 않았음(무증상 데이터 불일치 없음)도 함께 확인.
- 리더 지시대로 "카테고리 변경 자체가 성공"을 기대하는 테스트는 작성하지 않았다 — 기대값은 시종일관 `NOT_FOUND`.
- 대조군으로 "같은 category로 수정하면 정상 반영된다" 골든 경로도 같은 파일에 추가해, REQ-7 수정이 정상 수정 흐름을 깨지 않았음을 함께 확인했다.

## 골든패스 커버 (요청서 5단계)

| 단계 | 커버 위치 | 확인 내용 |
|---|---|---|
| 1. favor 상품 등록(images 1+, min=2/max=10) | `createProduct.integration.test.ts` 골든패스 | action→실서비스→실DB 저장 확인(`images`/`minQuantity`/`maxQuantity` 그대로) |
| 2. 백엔드-투-프론트 계약(stepper range) | 위 테스트 안에서 이어서 `GET /api/products` 실제 route 호출 | 응답 `data[]`에 `images`/`minQuantity:2`/`maxQuantity:10`이 non-optional로 그대로 실림(01_api_contract.md §1-1) — 프론트 렌더는 이미 프론트 유닛테스트가 커버하므로 여기선 데이터 계약까지만 |
| 3. 수량 5개 주문 성공, `order.product.quantity===5` | `createOrder.integration.test.ts` 골든패스 | 실제 DB에서 order 재조회해 `product.quantity===5` 확인 |
| 4. 수량 15개(초과) → VALIDATION, fieldErrors undefined, "최대 10개" 포함 | `createOrder.integration.test.ts` 에러 흐름 | 메시지 원문·fieldErrors 부재·주문 미생성(count 0) 전부 확인 |
| 5. invitation 상품(1/1 고정) 회귀 | `createProduct.integration.test.ts` "회귀" 케이스 | 관리자가 명시적으로 1/1을 입력하는 실제 흐름(§4-2)을 그대로 재현해, 정규화 폴백과 안 섞이고 저장값이 정확히 1/1임을 확인. (레거시 문서의 1/1 *폴백*은 회귀 픽스처 1로 별도 커버) |

## 에러 흐름 커버

| 케이스 | 위치 | 확인 |
|---|---|---|
| 물리 상품 images 없이 등록 | `createProduct.integration.test.ts` | `VALIDATION` + `fieldErrors.images` 존재, DB 미저장, `requireAuth` 호출 전 차단 확인 |
| maxQuantity(5) < minQuantity(10) | `createProduct.integration.test.ts` | `VALIDATION` + `fieldErrors.maxQuantity` 존재, DB 미저장 |
| 존재하지 않는 productId로 주문 | `createOrder.integration.test.ts` | `NOT_FOUND` |
| 로그인 쿠키 없음 | `createOrder.integration.test.ts` | REQ-5 검증보다 먼저 `/login` redirect(주문 미생성) — 기존 액션 순서 회귀 확인 |

## 실행 결과

- 신규 3개 파일: `npx vitest run <3개 파일>` → **3 files / 11 tests 전부 pass**
- 전체 스위트: `npm run test` → **130 files / 731 tests 전부 pass** (기존 127/720 대비 +3 files/+11 tests, 회귀 없음)
- `npx tsc --noEmit -p .` → clean
- `npx eslint <3개 신규 파일>` → clean

## 실제 버그 발견 — 플래그만 남김 (설계 판단 필요, 직접 수정하지 않음)

**증상**: `updateProduct` 액션으로 **존재하지 않는 productId**를 수정하려 하면서 대상 category가 `invitation`이 아닌 경우(즉 discriminator가 없는 base `ProductModel` 경로), REQ-7이 기대하는 깔끔한 `NOT_FOUND`가 아니라 `AppError("INTERNAL", "Validation failed: subCategory: ...")`가 발생한다.

**재현(직접 실행해 확인)**:
```ts
await ProductModel.findOneAndUpdate(
  { _id: 존재하지않는id, deletedAt: null },
  { category: "favor", subCategory: "diffuser" }, // 둘 다 유효한 조합
  { new: true, lean: true, runValidators: true },
);
// → ValidationError: subCategory: 'diffuser'는 해당 카테고리에서 허용되지 않는 subCategory입니다.
```
5회 반복 재현, 100% 재현됨. `updateProductService`를 통해 호출해도 동일(대상 id가 없으면 항상 재현).

**원인 추정**: `product.model.ts`의 `subCategory` 비동기 validator가 `this.get("category")`로 먼저 페이로드의 category를 읽으려 시도하는데(모델 CLAUDE.md Gotchas에 기록된 기존 로직), 실제로는 update 쿼리 컨텍스트에서 이 값이 기대만큼 페이로드를 반영하지 못하고 `this.model.findOne(this.getQuery())` DB 폴백으로 넘어가는 것으로 보인다. 대상 문서가 존재하지 않으면 이 폴백 조회도 빈 값을 리턴 → `category`가 계속 `undefined` → subCategory 검증이 무조건 실패 → mongoose가 `ValidationError`를 던지고 `updateProductService`가 이를 `AppError("INTERNAL")`로 감싼다. 반면 REQ-7의 실제 시나리오(category를 `invitation`으로 바꾸는 경우)는 discriminator 모델(`InvitationProductModel`)의 쿼리 조건 자동 주입 경로를 타면서 이 문제를 우회해 깔끔하게 `null`(→`NOT_FOUND`)로 귀결된다 — 그래서 REQ-7 자체 테스트는 정상 통과한다.

**영향 범위**: REQ-1로 새로 늘어난 4개 카테고리(favor/accessory/guestbook/ceremony)는 전부 discriminator 없는 base `ProductModel`을 쓴다(REQ-7 acceptance criteria §. discriminator는 invitation에만 존재). 따라서 이 4개 카테고리 상품을 잘못된/삭제된 productId로 수정 시도하면(관리자 오탈자, 경합 상태로 방금 삭제된 상품 등) 관리자에게 "상품을 찾을 수 없습니다"가 아니라 일반화된 "서버에 문제가 발생했습니다"가 뜬다 — 에러 분류가 실제 원인과 다르게 표시되는 문제다.

**test-suite가 고치지 않은 이유**: `product.model.ts`의 async validator 폴백 로직 자체를 건드려야 하는 수정이라(모델 CLAUDE.md의 기존 Gotchas 기록과 얽혀 있고, mongoose update-validator 컨텍스트에 대한 재설계 판단이 필요) "사소한 수정"보다는 설계 판단이 필요한 영역으로 판단해 플래그만 남긴다. REQ-7 자체 acceptance(카테고리 변경 시도 → NOT_FOUND)는 이 버그와 무관하게 정상 동작하며 테스트로 확인 완료했다.

**권장**: 별도 이슈로 `TODO.md` 버그수정 섹션 등록 검토(리더 판단 요청). 재현 스크립트는 이 리포트에 그대로 남겨둔다.

## 커버하지 않은 영역(의도)

- `ProductOptions.tsx`/`QuantityStepper` 등 컴포넌트 렌더링 레벨 — 요청서에 명시된 대로 프론트 유닛테스트가 이미 커버(01_ui_flow.md §6 체크리스트), 이 리포트는 백엔드-투-프론트 **계약**(API 응답 shape)까지만 다룬다.
- `OrderSummary.tsx`, `thumbnail` required, 복합 인덱스 — 스코프아웃 확정 항목, 테스트 대상에서 제외(지시사항 그대로).
- images 필드가 있는 정상 픽스처만으로 검증 가능한 케이스(예: 정상 minQuantity/maxQuantity 반환)는 이미 `product.service.test.ts`가 촘촘히 커버해 중복 작성하지 않았다.
