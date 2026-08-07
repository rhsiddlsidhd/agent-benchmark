# TODO

## 진행 방식

- 작업 항목 1개 = worktree 1개 = branch 1개 (`docs/GIT.md` worktree 규칙)
- 완료 → PR → `dev` merge → 로컬/원격 branch 삭제 → worktree remove

---

## 새 피처

- [x] **상품 카테고리별 확장 설계 (quantity 옵션화 포함)** (2026-07-30 논의 시작, 2026-08-06 필드 설계 확정, 2026-08-07 PR #95 머지 완료) — 현재 카테고리가 `invitation`(모바일 청첩장) 하나뿐이라 `ProductOptions.tsx:87`의 `quantity`가 `const quantity = 1`로 하드코딩(수량 선택 UI 자체 없음, 청첩장은 원래 1개 구매가 정석이라 지금은 정상). 답례품 등 실물 상품 카테고리가 추가되면 수량이 의미를 가지므로:
  - **카테고리/서브카테고리 확정 라인업** (`category.ts`의 `PRODUCT_CATEGORIES`/`SUB_CATEGORY_MAP` 확장 대상, 실판매 가능성 기준 재검토 완료 — 식품/생화/대여성/자재성 상품 제외):
    - `favor`(답례품): `candle`, `diffuser`, `soap`, `magnet`, `handkerchief`
    - `accessory`(웨딩 소품): `ring-pillow`, `welcome-board`, `polaroid-frame`
    - `guestbook`(방명록 굿즈): `book`, `stamp`
    - `ceremony`(예식 용품): `candle-holder`, `escort-card`, `program-book`, `aisle-runner`
  - **`Product` 스키마 필드 확정** (base `ProductDB`, discriminator 아님 — 전 카테고리 공통):
    - `images: string[]` — 상세페이지 갤러리(목록/카드용 기존 `thumbnail`과 역할 분리). optional(default `[]`) — `invitation`은 `previewUrl`이 상세 확인을 대신하므로 없어도 판매 성립. 물리 상품 4종은 `request/product.schema.ts`에서 `category !== "invitation"`이면 required로 조건부 검증(`isPremium`↔`featureIds` superRefine과 같은 패턴, `product.schema.ts:29` 참고).
    - `minQuantity: number` / `maxQuantity: number` — 둘 다 required, per-product(카테고리가 강제 안 함, admin이 상품 등록 시 직접 입력). `minQuantity` default `1`/min `1`, `maxQuantity` default `0`(0=무제한), `maxQuantity!==0`이면 `maxQuantity>=minQuantity` 검증. `invitation` 상품은 `minQuantity:1, maxQuantity:1`로 등록(강제 로직 아니라 실제 그 값을 넣는 것).
    - `ProductOptions.tsx` 렌더 규칙: `minQuantity===maxQuantity===1`이면 수량 UI `disabled` 고정("1개"), 그 외엔 `[minQuantity, maxQuantity]` stepper(`maxQuantity===0`이면 상한 없는 stepper) — 카테고리 분기를 컴포넌트 if문이 아니라 product 데이터가 결정하게.
    - 기존 invitation 실 데이터는 신규 required 필드(`minQuantity`/`maxQuantity`) 마이그레이션 없이 진행 가능 — 배포된 DB지만 실 서비스 아니라 사용자가 직접 삭제 예정(백필 스크립트 불필요).
  - **착수 순서**: 위 라인업 기준으로 카테고리별 목데이터를 DB에 실제로 insert(어드민 `/admin/products/new` 경유 또는 `createProduct` 스크립트) → 실 데이터 형태 최종 확인 → 구현.
  - **스코프 아웃**: `Order.quantity`(`order.model.ts:20`, 이미 존재)와 `Product.minQuantity`/`maxQuantity` 정책 간 검증 로직(주문 수량이 상품 허용 범위 안인지)은 이번 필드 설계엔 미포함 — quantity 옵션화 구현 단계(`createOrder` 액션)에서 반드시 챙길 것.
  - **(2026-07-30 발견한 선행 문제, PR #92로 이미 해소됨)** `category` 값이 `category.ts`/`product.model.ts`/`product.schema.ts` 3군데에 독립 하드코딩돼있던 동기화 리스크 — `category.ts`가 `PRODUCT_CATEGORIES`/`SUB_CATEGORY_MAP` 원본 배열을 갖고 model/schema가 그걸 import해서 참조하는 구조로 이미 전환 완료(확인: `product.model.ts:88` `enum: PRODUCT_CATEGORIES`, `product.schema.ts:8` `z.enum(PRODUCT_CATEGORIES)`). 이번 항목(quantity 옵션화) 착수 시 이 구조를 그대로 활용하면 됨 — 별도 조치 불필요.

- [ ] **마켓플레이스 전환 (제3자 판매자 입점)** (2026-08-06 방향성만 논의, 착수 아님) — 현재 `UserRole`은 `"USER" | "ADMIN"` 둘뿐이고(`user.model.ts:2`) 상품 등록은 `createProduct.ts`의 `role !== "ADMIN"` 체크로 관리자 전용(자사 직접판매몰 구조, `authorId`는 "등록한 관리자"만 의미). `SELLER` role 추가해 제3자 판매자가 직접 상품을 입점시키는 구조로 전환하는 방향이 논의됨. 착수 시 파급 범위 큼 — 착수 전 별도로 팬아웃 설계 필요:
  - 상품 등록/수정/삭제 권한 체크 전반에 `SELLER` 포함, 상품 소유권 개념 신설(자기 상품만 수정/삭제 가능하도록 인가 로직 추가 — `authorId`의 의미가 "등록한 관리자"에서 "소유 판매자"로 바뀜)
  - 판매자 정산/수수료 체계, 판매자 프로필/스토어 페이지, 관리자의 판매자 상품 검수 플로우 등 마켓플레이스 특유 기능 신규 설계
  - 위 "상품 카테고리별 확장" 항목과 별개 트랙 — 섞어서 진행하지 않는다.

---

## 버그 수정

- [ ] **`OrderSummary.tsx` "청첩장 템플릿" 하드코딩** (2026-08-07 발견, PR #95 스코프아웃) — 주문서 상품명 아래에 카테고리 무관하게 `"청첩장 템플릿"`을 하드코딩해서 렌더한다. 카테고리가 5종으로 늘어난 지금 답례품/방명록 등 주문서에도 그대로 뜬다. `CheckoutItem`에 카테고리 정보가 없어서 고치려면 `CheckoutItem` 계약 변경이 필요.
- [ ] **`updateProduct`의 `thumbnail` required 기존 부채** (2026-08-07 재확인, PR #95 스코프아웃) — `productSchema`가 `thumbnail`을 `File(size>0)` required로 잡아서 상품 수정 시마다 썸네일 재업로드가 강제된다. `images` 필드는 `existing` 합산 설계로 이 문제를 안 만들었지만 `thumbnail` 자체는 그대로.
- [ ] **존재하지 않는 productId + non-invitation category로 `updateProduct` 호출 시 `NOT_FOUND` 아닌 `INTERNAL`(500) 반환** (2026-08-07 test-suite 발견, PR #95 스코프아웃) — `product.model.ts`의 `subCategory` 비동기 validator가 대상 문서를 못 찾으면 category를 못 읽어 무조건 검증 실패로 떨어지는 게 원인으로 추정(5/5 재현). 카테고리가 discriminator 없는 4종(favor/accessory/guestbook/ceremony)으로 늘어나며 새로 열린 경로. mongoose validator 재설계 필요해 최소조치로 안 됨 — 데이터 무결성 문제 아니라 에러코드 오분류 수준이라 우선순위 낮음.
- [ ] **`test:coverage:diff`가 괄호 경로(라우트 그룹) 파일을 커버리지 게이트에서 조용히 누락** (2026-08-07 발견, PR #95) — `coverageInclude` 필터가 파일 경로를 글롭 패턴처럼 다뤄서 `src/app/(admin)/...`처럼 `(...)` 라우트 그룹이 든 경로가 매칭 실패로 커버리지 체크 대상에서 빠진다. 게이트 통과가 검사 완료를 보장하지 않는 상태 — `(admin)`/`(main)`/`(products)`/`(checkout)` 하위 전체 파일이 동일 영향권.

---

## 성능 개선

- [ ] **`Product` 복합 인덱스 추가 검토** (2026-08-07, PR #95 스코프아웃) — 카테고리가 1종→5종으로 늘면서 `category` 필터에 실질적 선택도가 처음 생겼다. 제안: `{deletedAt:1, category:1, isFeatured:-1, priority:-1, createdAt:-1}`(ESR 순서). 현재 `productSchema`엔 `_id` 외 인덱스가 0개(기존 부채) — 이번 기능 PR에 성능변경을 안 섞으려고 분리함. 이 인덱스는 `category` 지정 호출만 커버하고 전체 목록 경로(category 미지정)는 여전히 in-memory sort라, 두 경로 다 커버하려면 인덱스 2개 필요 — 실 데이터 규모 보고 판단.

---

## UI 수정

- [ ] 세부 항목 미정
