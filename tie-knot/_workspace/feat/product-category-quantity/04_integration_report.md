# 04_integration_report.md — Phase1~3 통합 리포트

> 브랜치 `feat/product-category-quantity` · 리더 작성 · Phase4(test-suite) 착수 직전

## 요약

상품 카테고리 라인업 확장(답례품/웨딩소품/방명록굿즈/예식용품 4종 신규) + quantity 옵션화(`Product.minQuantity`/`maxQuantity`/`images` 필드) + 주문수량 검증. 신규 엔드포인트·신규 모델 0개 — 기존 `Product` 스키마와 5개 엔드포인트(Server Action 3 + Route Handler 2)의 shape만 확장했다.

## REQ 충족 현황 (전부 passes:true)

| REQ | 내용 | 담당 | 상태 |
|---|---|---|---|
| REQ-1 | 카테고리 5종/서브카테고리 16종(신규14+기존2) 확장, 라벨맵·아이콘맵 동기화 | backend-impl | ✅ |
| REQ-2 | `Product.images`/`minQuantity`/`maxQuantity` 필드 + `transformProduct` 레거시 정규화(`??[]`/`??1`/`??1`) | backend-impl | ✅ |
| REQ-3 | zod 조건부 검증(images 물리상품 required, maxQuantity>=minQuantity) | backend-impl | ✅ |
| REQ-4 | `ProductOptions.tsx` quantity 하드코딩 제거, min/max 기반 fixed/open/range 모드, `QuantityStepper` 신규, totalPrice/handlePurchase 회귀버그 동시 수정 | frontend-impl | ✅ |
| REQ-5 | `createOrder` 주문수량 범위 검증(DB 재조회, `.lean()` 폴백 포함) | backend-impl | ✅ |
| REQ-6 | invitation 전용 필드(theme/previewUrl) 조건부 렌더 | frontend-impl | ✅ |
| REQ-7 | `updateProduct` discriminator 카테고리 변경 시 무증상 실패 수정(NOT_FOUND 명시) — 진행 중 api-designer 발견, 리더가 승격 | backend-impl | ✅ |

## 경계면 검증 이력

- `backend-req1-2-3-5-7.json` — PASS (1라운드, REDO 0)
- `frontend-req4-req6.json` — FIX(1라운드, 병합 시뮬레이션에서 통합결함 2건 실측 발견) → PASS(2라운드)

**통합결함 2건(FIX 사유, 해소 완료)**
1. `product.service.ts` 내용충돌 — frontend 워크트리가 typecheck용으로 복사해둔 구버전(REQ-5 핵심 함수 없음)이 병합 시 backend 버전을 덮어쓸 뻔함. HEAD(표준 브랜치) 쪽 채택으로 해소.
2. 테스트 픽스처 중복키 — 양쪽이 같은 3줄을 다른 위치에 삽입해 자동병합이 충돌 없이 중복 보존, `TS1117` 6건. 각 워크트리 단독 typecheck로는 안 잡히고 통합 시점에만 드러나는 전형적 결함.

두 건 다 boundary-verifier가 **분리 워크트리에서 실제 병합을 실행**해 실측 발견(셀프보고 신뢰하지 않음). 최종 병합은 fast-forward로 충돌 없이 완료(커밋 `9d38d43`).

## 최종 상태

REDO 0회, 강제 PASS 0건, `MANUAL_INTERVENTION_REQUIRED` 없음. 독립 `tsc --noEmit` exit 0, 전체 스위트 127 files / 720 tests 전부 pass(boundary-verifier 직접 실행 확인).

## Phase4(test-suite)에 반드시 넘길 회귀 픽스처 2건

1. **레거시 Product 문서 픽스처** — `minQuantity`/`maxQuantity`/`images` 필드가 아예 없는 문서. `.lean()`에는 mongoose default가 적용 안 되는 이 프로젝트 고유 함정이라, 정상 픽스처(필드 있는 신규 문서)만으로는 `transformProduct`/`getProductQuantityBoundsService`의 폴백 누락이 절대 드러나지 않는다.
2. **`updateProduct`를 기존과 다른 category로 호출하는 케이스** — 기대값은 "변경 성공"이 아니라 `NOT_FOUND`(REQ-7 스코프 경계 그대로).

## 스코프 아웃 확정 항목 (구현 안 됨, 의도)

- `updateProduct`의 `thumbnail` required 기존 부채(수정 시 썸네일 재업로드 강제) — 이번 피처와 무관한 기존 버그
- `Product` 복합 인덱스(`{deletedAt,category,isFeatured,priority,createdAt}`) — 성능 변경을 기능 PR에 섞지 않기 위해 스코프아웃, 별도 트랙 필요
- `organisms/OrderSummary.tsx`의 "청첩장 템플릿" 하드코딩 — `CheckoutItem` 계약 변경이 필요한 별개 버그, 답례품 등 신규 카테고리 주문서에도 문구가 그대로 뜸
- Cloudinary 이미지 원본 정리(삭제 시) — 참조만 끊기고 원본은 안 지워짐
- 갤러리 이미지 순서 편집 — "기존 뒤에 신규 append"만 지원

## Phase4에서 새로 발견한 버그 (미수정, 후속 트랙)

**존재하지 않는 productId + non-invitation category로 `updateProduct` 호출 시 `NOT_FOUND`가 아니라 `INTERNAL`(500)** — test-suite 발견, 5/5 재현. `product.model.ts`의 `subCategory` 비동기 validator가 대상 문서를 못 찾으면 category를 못 읽어 무조건 검증 실패로 떨어지는 게 원인으로 추정됨. REQ-1이 discriminator 없는 카테고리 4종(favor/accessory/guestbook/ceremony)을 늘리면서 새로 열린 경로. REQ-7 acceptance(다른 category로 존재하는 문서를 수정 시도 → NOT_FOUND) 자체는 이 버그와 무관하게 정상 동작 확인됨 — 별개 결함이다.

**수정 안 한 이유**: mongoose validator 재설계가 필요해 "최소조치"급이 아님(REQ-7과 달리 3~4줄로 안 끝남). 데이터 무결성 문제(REQ-7처럼 "성공했다고 거짓 응답")가 아니라 에러코드 오분류(500 vs 404) 수준이라 REQ-7보다 심각도 낮음 — 사용자에게는 어쨌든 실패로 보인다. PR 블로커 아님, TODO.md 버그수정 섹션에 리더가 별도 등록.

## 잔여 발견 사항 (차단 아님, 후속 판단 필요)

1. **"NaN원" 표시** — `ProductOptions`에서 수량 입력을 비우면 총 상품 금액이 일시적으로 "NaN원"으로 표시됨(blur 시 clamp되어 서버로는 안 나감, 설계상 허용된 중간상태). `Number.isNaN` 가드 권장.
2. **`test:coverage:diff` 툴링 부채** — 경로에 괄호가 든 파일(`src/app/(admin)/...` 등 라우트 그룹 전체)이 글롭 매칭 실패로 커버리지 게이트에서 조용히 누락됨(frontend-impl 발견). 게이트 통과가 검사 완료를 보장하지 않는 상태라 별도 이슈 등록 권장.
3. **REQ-1로 새로 열린 discriminator 리스크군** — REQ-7로 `updateProduct`의 무증상 실패는 막았지만, 카테고리 변경 자체를 되게 만드는 완전 해결(delete+recreate 또는 폼에서 category 잠금)은 이번 스코프 밖. 마켓플레이스 전환(TODO.md 별도 항목) 등 향후 카테고리 변경 니즈가 커지면 재검토 필요.

## 머지 후 리마인드

- TODO.md 체크박스는 dev 브랜치 머지 후 갱신(이 리포지토리 컨벤션)
- 위 스코프아웃 5건 중 "OrderSummary 하드코딩"과 "coverage 툴링 부채"는 TODO.md 버그수정/성능개선 섹션에 리더가 별도 등록 예정
