# TODO

## 진행 방식

- 작업 항목 1개 = worktree 1개 = branch 1개 (`docs/GIT.md` worktree 규칙)
- 완료 → PR → `dev` merge → 로컬/원격 branch 삭제 → worktree remove
- 체크리스트 갱신은 `dev` 브랜치에서 진행
- branch prefix는 `docs/GIT.md` Common 표 기준 (`feat/fix/docs/refactor/chore/test`)

---

## 새 피처

- [ ] **상품 카테고리별 확장 설계 (quantity 옵션화 포함)** (2026-07-30 논의) — 현재 카테고리가 `invitation`(모바일 청첩장) 하나뿐이라 `ProductOptions.tsx:87`의 `quantity`가 `const quantity = 1`로 하드코딩(수량 선택 UI 자체 없음, 청첩장은 원래 1개 구매가 정석이라 지금은 정상). 답례품 등 실물 상품 카테고리가 추가되면 수량이 의미를 가지므로:
  - 착수 전 카테고리별 목데이터를 DB에 하나씩 실제로 insert해서 데이터 형태부터 확정(`product.service.ts`의 `category` discriminator 구조 활용, 현재 `invitation` 외 실 데이터 없음).
  - 그 다음 `Product` 스키마에 카테고리별 수량 정책 필드(예: `maxQuantity`/`quantitySelectable`) 추가 — 이름/shape는 목데이터 확정 후 결정(지금 확정하면 추측성 설계 위험, `docs: 문서 먼저 리팩토링 나중` 원칙과 동일 이유).
  - `ProductOptions.tsx`가 그 값 기준으로 수량 필드를 항상 노출하되 `maxQuantity===1`이면 `disabled` 고정("1개"), 그 외엔 선택 가능한 stepper로 렌더 — 카테고리 분기를 컴포넌트 if문이 아니라 product 데이터가 결정하게.
  - **문제점(2026-07-30 발견): `category` 값이 3군데에 독립적으로 하드코딩돼있어 카테고리 추가할 때마다 동기화 리스크** — `src/shared/utils/category.ts`(`ProductCategory` 타입 유니온 + `SUB_CATEGORY_MAP` + `productCategoryLabels`), `src/server/models/product.model.ts:87`(Mongoose `enum: ["invitation"]`), `src/shared/schemas/request/product.schema.ts:8`(zod `z.enum(["invitation"])`) — 이 3곳이 전부 `"invitation"`을 따로 타이핑해놨음. 하나만 넓히고 나머지 빠뜨리면 조용히 어긋남(예: 타입만 넓히고 mongoose enum 안 넓히면 신규 카테고리 상품 저장 시 validation 에러). `subCategory`는 파일 하나(`category.ts`) 안에서 타입(`SubCategory` 유니온)과 값 목록(`SUB_CATEGORY_MAP`)이 따로 선언돼있어 같은 종류 문제가 더 작은 범위로 존재(model/zod는 `SUB_CATEGORY_MAP`을 동적 참조라 안전, `category.ts` 내부만 리스크).
  - **해결 방향(2026-07-30 결정)** — `category.ts`에서 값 배열을 원본으로 두고 타입을 파생시키는 구조로 전환, 나머지는 그 배열/맵을 참조만 하게 정리:

    ```ts
    export const PRODUCT_CATEGORIES = ["invitation"] as const;
    export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

    export const SUB_CATEGORY_MAP = {
      invitation: ["wedding", "first-birthday"],
    } as const satisfies Record<ProductCategory, readonly string[]>;
    export type SubCategory =
      (typeof SUB_CATEGORY_MAP)[ProductCategory][number];
    ```

    `product.model.ts`의 `enum: [...]`과 `product.schema.ts`의 `z.enum([...])`은 `PRODUCT_CATEGORIES`를 import해서 그대로 넘기는 것으로 교체(값 재입력 없이 참조만). `productCategoryLabels`/`subCategoryLabels`는 `Record<ProductCategory, string>`/`Record<SubCategory, string>` 그대로 유지 — 카테고리/서브카테고리 추가했는데 라벨 안 채우면 TS 컴파일 에러로 잡히는 기존 안전장치 보존. DB를 완전 동적화(별도 Category 컬렉션)하는 대안은 기각 — 지금 카테고리 추가 빈도(런칭 이후 1개)에 비해 오버스펙, 컴파일타임 안전성(오타 방지)도 잃음.
    이 리팩토링 자체는 Phase 3(서브카테고리 진입 섹션, VIP/비즈니스 제거) 작업과 겹치는 파일이라 Phase 3에서 같이 처리하거나 그 직전 별도 커밋으로 분리 — 착수 시점에 결정.

- [x] **Home 화면 개편** (2026-07-30 그릴링으로 결정) — "전단지처럼 꽉 찬 다양한 content로 구매를 유도" + "데스크탑도 모바일 폭을 연상케 하는 max-width" 컨셉. 카테고리/상품이 앞으로 계속 늘어난다는 전제(2026-07-30 확인)로 설계, 6개 Phase로 분할(`docs/GIT.md` 1작업=1PR 원칙). Phase 0~5 전건 머지 완료:
  - [x] Phase 0(`refactor/admin-route-group-sibling`, PR #90 머지 완료) — `(admin)`을 `(main)` 밖 형제 라우트그룹으로 이동. Phase 1의 셸 폭 캡이 `(main)/layout.tsx`의 `{children}` 전체(= admin 포함)를 물리적으로 감싸는 구조라, admin만 캡에서 빼려면 CSS 편법(`max-w-none`+음수마진) 대신 구조적으로 분리하는 쪽 채택 — admin은 지금도 `(main)`의 Header/공지바를 그대로 이고 있어 이번 기회에 정리.
  - [x] Phase 1(`feat/home-shell-max-width`, PR #91 머지 완료) — `(main)/layout.tsx`에 Header+children+Footer를 감싸는 단일 래퍼로 max-width 480px 캡(admin은 Phase 0으로 이미 분리돼 영향 없음). Header 데스크톱 nav(`hidden md:flex`)는 제거하고 `MobileNav`(햄버거)로 통일 — 뷰포트 기준 Tailwind 브레이크포인트가 480px 캡과 충돌하기 때문(데스크탑 뷰포트에선 `md:` 스타일이 여전히 발동해 좁은 박스 안에서 깨짐). Footer 4열 그리드(`md:grid-cols-4`) → 항상 1열 세로배치, 데드링크 9개(서비스/회사/지원 9개 + GitHub/Mail, 전부 `href="#"`) 정리, 저작권 표기(`WeddingCard`→`Tie Knot`, 연도 갱신).
    - **알려진 이슈(2026-08-05 발견, 이번 Phase 스코프 밖으로 분리)** — 480px 캡이 CSS `max-width`(컨테이너 폭)일 뿐이라, Tailwind `md:`/`lg:`는 여전히 실제 뷰포트 폭 기준으로 발동한다. 데스크탑 뷰포트(≥768px)에서 캡 안의 `md:`/`lg:` 스타일이 그대로 켜져, 좁은 480px 박스 안에서 넓은-화면용 레이아웃이 트리거되는 문제가 있다 — Header/Footer/MobileNav는 이번 Phase에서 해당 클래스를 제거해 해결했지만, Home 페이지가 쓰는 다른 organism은 아직 미조치. 실제로 `EcommerceHero.tsx`에서 데스크탑 뷰포트 스크린샷으로 확인됨(`md:flex-row`+`md:text-5xl`가 480px 박스 안에서 겹쳐 h1 제목이 글자 단위로 줄바꿈되는 붕괴 재현, Playwright로 1440×900 뷰포트 캡처). `ProductGrid`/`TemplateCarouselGroup`/`LiveDemoSection` 등 `md:`/`lg:`를 쓰는 다른 organism도 같은 패턴일 가능성 높음(전수 확인 안 함). 근본 해결책 후보: Tailwind v4 컨테이너 쿼리(`@container`+`@md:`/`@lg:`)로 전환해 뷰포트가 아니라 480px 박스 자체를 기준 삼기 — 스코프가 organism 전반으로 커져 별도 Phase(또는 각 Phase 3/4 착수 시 해당 컴포넌트부터)로 분리하기로 결정, 이번 PR은 셸(Header/Footer/레이아웃 래퍼)만 반영.
  - [x] Phase 2(`feat/product-search`, PR #86 머지 완료) — 검색 기능 신설(기존 검색 인프라 0). 대상은 title(regex 부분일치, `$options:"i"`) + category/subCategory(라벨→enum key 역조회 후 `$in`) — `$or`로 결합. MongoDB `$text` 인덱스는 배제(한국어 형태소 분석 미지원이라 "돌잔" 검색 시 "돌잔치" 부분매칭 안 됨). category/subCategory를 포함한 이유: 지금처럼 카테고리당 상품 수가 적은 단계에선 상품명에 서브카테고리 단어가 안 박혀있는 경우가 흔해 title만으론 결과 0건이 나올 수 있음. Header엔 검색 아이콘만 두고, 클릭하면 상태전환 없이 `/search` 페이지로 바로 이동(거기서 입력, autofocus) — 480px 폭에서 로고행에 인풋까지 욱여넣지 않기 위함. 결과 화면은 새로 안 만들고 기존 `ProductGrid`(그리드, 설계 문서 작성 시점엔 `ProductCatalogView`로 지칭했으나 실제 재사용 대상은 category prop 없는 `ProductGrid`) 재사용, 0건일 땐 "검색결과가 없습니다" 메시지 + 전체 상품 보기 링크 노출(Phase 3 서브카테고리 진입카드는 그 Phase 착수 전까지 보류, 막다른 페이지로 안 만듦). 알려진 제약(초성 검색 미지원 등)은 `tie-knot/_workspace/feat/product-search/04_integration_report.md` 참고.
  - [x] Phase 3(`feat/subcategory-navigation-section`, PR #92 머지 완료) — 서브카테고리 진입 섹션 신설 + 카테고리 라벨/서브카테고리 taxonomy 정리 겸용. 2x2 고정 그리드가 아니라 가로 스크롤 아이콘 리스트로 — 서브카테고리 개수가 늘어도 레이아웃 재설계 없이 옆으로 이어붙임(무신사/크림 카테고리 진입 UI 실사 결과 반영). href로 해당 서브카테고리 상품 목록으로 바로 이동.
    - **VIP/비즈니스 서브카테고리 제거**(2026-07-30 결정) — 기존 4개(청첩장/돌잔치/VIP/비즈니스) 중 VIP/비즈니스는 "경조사 종류"가 아니라 "격식/대상" 축이라 나머지(청첩장/돌잔치, 향후 백일/회갑칠순/집들이/개업/부고 등 추가 후보)와 분류 기준이 안 맞음 — 청첩장/돌잔치 2개만 남기고 제거. `src/shared/utils/category.ts`의 `SubCategory` 유니온 + `SUB_CATEGORY_MAP` + `subCategoryLabels`에서 값 제거, `product.model.ts` subCategory validator가 참조하는 `SUB_CATEGORY_MAP`도 자동 반영됨. **착수 전 dev DB에 실제로 `subCategory: "vip"|"business"`로 저장된 문서가 있는지 확인 필요**(있으면 제거가 아니라 마이그레이션 문제가 됨 — 스키마 enum에서 값 빼면 기존 문서가 검증 실패 상태로 남을 수 있음, dev DB라 위험 낮을 걸로 추정되나 확인 전엔 단정 안 함).
    - 아이콘(lucide-react): 청첩장=Heart, 돌잔치=Cake.
    - 카테고리 라벨 확인 — `productCategoryLabels.invitation`은 이미 "초대장"(우산 라벨), "청첩장"은 `subCategoryLabels.wedding`(결혼식 occasion 전용) — 헷갈리지 않게 이번 Phase 코멘트/커밋 메시지에서 구분해서 쓴다.
  - [x] Phase 4(`feat/popular-products-section`, PR #93 머지 완료) — "인기 상품" 섹션 신설. 계획 시점엔 "Hero 바로 다음 배치"였으나, 먼저 머지된 Phase 3(PR #92)이 이미 그 자리를 차지해 실제 배치는 Hero → SubCategoryNavSection → 인기 상품 → 베스트 디자인 템플릿 순으로 조정(리더 승인, `_workspace/feat/popular-products-section/00_requirements.json` background[0] 근거). 좋아요 수(`Product.likes.length`) 기준 내림차순 Top 8, 가로 스크롤 캐러셀 + 카드에 순위 배지(1/2/3...) — `getPopularProductsService` 신규(aggregation, `getAllProductsService`는 무수정). 좋아요 1개 이상인 상품이 3개 미만이면 섹션 자체를 숨김(0개짜리를 "인기"로 포장하는 신뢰도 문제 방지). `ProductCard.tsx`는 optional `rank` prop만 추가해 값 있을 때만 배지 렌더(안 넘기면 기존 그리드/검색결과 사용처엔 영향 없음). 상세는 `_workspace/feat/popular-products-section/04_integration_report.md` 참고.
  - [x] Phase 5(`fix/cta-buttons-restore`, PR #88 머지 완료) — `StartActionCTA.tsx`가 `cta.json`에 이미 있던 `primaryAction`/`secondaryAction`(라벨+href)을 렌더하지 않고 있던 죽은 데이터를 복구. `secondaryAction.href`가 `/contact`(`routes.ts`에 없는 라우트, 404 유발)로 돼 있던 걸 `/support`로 수정.
  - 무신사/쿠팡/크림 3사 홈 화면을 Playwright로 직접 훑어 참고(2026-07-30) — 공통 패턴: 검색바 최상단 고정, 카테고리 진입점은 가로로 압축(세로로 안 쌓음), 히어로 캐러셀 1개, 이후 "제목+더보기+상품나열" 섹션 반복, 카드에 가격/할인율/신뢰지표(별점·리뷰·관심수 등) 노출. 지금 tie-knot은 카테고리 1종뿐이라 "제목+더보기" 큐레이션 섹션을 여러 개 무리하게 쌓지 않음(Phase 4 하나로 시작, 데이터 늘면 추가 검토).

---

## 버그 수정

- [x] **`/my-orders`에서 `Order._id` 미직렬화로 콘솔 에러 발생** (couple-info 분리 Phase 6/7 검증 중 발견, 2026-07-29, `fix/order-id-serialize` PR #89 머지 완료) — `order.service.ts`의 `getOrdersByUserId`가 `.lean()` 결과의 `coupleInfoId`/`userId`/`paymentId`/`product.productId`는 전부 `.toString()`으로 문자열화하면서 정작 `_id` 자체는 빠뜨렸다. Mongoose `ObjectId` 인스턴스가 Server Component → Client Component(`MyOrdersTemplate`) props로 그대로 전달돼 "Only plain objects can be passed to Client Components... Objects with toJSON methods are not supported" 콘솔 에러가 남(화면 자체는 정상 렌더링됨, 기능 영향 없음). 이번 couple-info 분리 작업과 무관한 기존 버그라 별도 처리하지 않고 여기 기록만 함.
- [x] **카카오페이 결제 완료 후 `/payment/success` 대신 `/products`로 튕겨 404** (2026-07-30 발견, `fix/checkout-payment-status-race` PR #87 머지 완료) — 원인은 레이스 컨디션. `(checkout)/layout.tsx`가 `<CheckoutForm>`(children)과 `<OrderSummary>`를 sibling으로 나란히 렌더하는데, 둘 다 `useCheckoutData()`를 각자 호출한다. `CheckoutForm`은 `paymentStatus`(`usePortOnePayment.ts:17`, 로컬 `useState`)로 skip 가드를 걸어놨지만, `OrderSummary.tsx:11`은 이 값을 모르는 채로 스킵 없이 호출한다. 결제 성공 시 `CheckoutForm.tsx:29` `clearOrder()`가 Zustand `order`를 null로 만드는 순간, 가드 없는 `OrderSummary` 쪽 `useCheckoutData`가 "주문 없음"으로 판정해 `useCheckoutData.ts:23` `router.replace(routes.products.root)`(`/products`)를 쏴버리고, 이게 뒤이은 `router.push(routes.payment.success)`를 덮어써서 최종적으로 `/products`(bare index `page.tsx` 없음, `[category]`만 존재)에 착지해 404가 뜬다.
  - **결정된 방향**: `paymentStatus`를 `usePortOnePayment.ts`의 로컬 `useState`에서 `useOrderStore`(Zustand)로 이전 — `order`와 스코프를 맞춰 `CheckoutForm`/`OrderSummary` 양쪽이 같은 값을 구독하게 한다. `_hasHydrated`처럼 `partialize`에서 제외해 비영속으로 유지(새로고침 시 PENDING 되살아나면 안 됨). `setOrder` 호출 시 `paymentStatus`도 IDLE로 같이 리셋 필수 — order 트리거 시점("구매하기"/my-orders "결제하기")과 paymentStatus 트리거 시점(체크아웃 폼 결제 제출)이 서로 다르기 때문에, 리셋 안 하면 이전 결제 시도의 상태가 새 주문으로 새어 들어간다. `useCheckoutData`의 skip 조건도 파라미터 대신 이 store 값을 직접 참조하도록 변경.

---

## 성능 개선

- [ ] 세부 항목 미정

---

## UI 수정

- [ ] 세부 항목 미정
