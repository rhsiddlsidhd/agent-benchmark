# 01_ui_flow.md — 인기 상품 섹션 UI/상태 설계

> branch: `feat/popular-products-section`
> 대상: REQ-2(Home 인기 상품 섹션 신설), REQ-3(ProductCard `rank` prop)
> 작성: ui-designer-popular
> 전제: 배치 순서(Hero → SubCategoryNavSection → 인기 상품 → 베스트 디자인 템플릿)는 00_requirements.json background[0]에서 확정 — 재논의 대상 아님.

---

## 1. 데이터 흐름 (요약)

```
(main)/page.tsx  [Server Component, export const revalidate = 3600]
   └─ Promise.all([ getProductService, getFeaturedTemplatesService,
                    ★getPopularProductsService(POPULAR_PRODUCTS_LIMIT).catch(() => []) ])
        └─ <HomeTemplate invitation product infoId ★popularProducts />
             ├─ <EcommerceHero />
             ├─ <SubCategoryNavSection category="invitation" />
             ├─ ★<PopularProductsSection products={popularProducts} />   ← 신규 (여기)
             ├─ (invitation.length > 0) 베스트 디자인 템플릿 섹션 → <TemplateCarouselGroup />
             ├─ (product && infoId) <LiveDemoSection />
             └─ <StartActionCTA />
```

### 1.1 데이터 계약 (api-designer-popular 확정 완료)

api-designer-popular 회신으로 아래 3개 모두 **확정**됐다(미확정 항목 없음).

| 항목 | 확정 내용 |
| --- | --- |
| 엔드포인트 | **신규 엔드포인트/Server Action 없음** — Home Server Component가 services 직접 import(DATA_ACCESS 1행 패턴). 클라이언트 fetch/useSWR/useActionState 전부 없음 |
| 반환 타입 | `Product[]` (= `ProductJSON`, `src/server/services/product.service.ts:10`). 신규 필드 없음(`rank`/`likeCount` 안 옴) — 순위는 UI가 `index + 1`로 파생 |
| 시그니처 | `getPopularProductsService(limit?: number, userId?: string): Promise<Product[]>`. 좋아요 0개 제외 + likes 내림차순 정렬 + 최대 8개 slice 전부 **서버 책임**. 3개 미만이어도 throw 없이 짧은 배열(빈 배열 포함) 그대로 반환 |
| prop 이름 | `HomeTemplate`이 받는 prop은 `popularProducts: Product[]` |
| 상수 | `src/shared/constants/product.ts`(기존 파일)에 `POPULAR_PRODUCTS_LIMIT = 8`, `POPULAR_PRODUCTS_MIN_ITEMS = 3` 추가 — UI/서비스가 같은 상수를 본다. **숫자 리터럴 8/3을 컴포넌트·page.tsx에 직접 쓰지 않는다.** import는 배럴(`@/shared/constants`) 경유 |

- **UI는 재정렬/재slice 하지 않는다.** 서버가 준 배열 순서를 그대로 순위로 해석한다.
- **`isLiked`는 항상 `false`다** — `revalidate = 3600` ISR 공유 캐시라 `userId`를 넘기지 않는다(넘기면 첫 방문자의 개인화 상태가 전 유저에게 캐시된다). 따라서 **이 섹션에 하트 채움 등 개인화 표현을 넣지 않는다.** 현재 `ProductCard`가 `isLiked`를 렌더에 쓰지 않으므로 실 영향은 없다.
- `likes: string[]`는 그대로 실려 오므로 카드의 "좋아요 N" 표시(`product.likes?.length`)는 기존 코드 그대로 동작한다.
- **`product.likesCount`를 참조하지 않는다 — 응답에 없다(`undefined`).** db-migrator-popular 확인: 서버가 정렬 계산에 쓰는 `likesCount`는 집계 파이프라인 내부 값이고 `$unset`으로 제거돼 응답에 안 나간다. 좋아요 수가 필요하면 항상 `likes.length`(`01_db_schema.md` §6-3).
- **인덱스 기반 순위의 안정성은 DB 쪽이 보장한다** — 서버 정렬이 결정적(tie-break 5단)이라 동점이 있어도 재생성마다 순서가 흔들리지 않는다. 따라서 UI가 동점 처리(공동 순위 표기 등)를 따로 하지 않는다 — 동점이어도 배열 순서대로 1, 2, 3...을 붙인다.

---

## 2. 화면 플로우

Home은 정적 렌더(ISR, `revalidate = 3600`) 페이지라 사용자 인터랙션 이전에 이미 확정된 마크업이 내려온다.

1. 사용자가 `/` 진입 → 서버에서 인기 상품 배열이 이미 채워진 HTML 수신.
2. 좋아요 1개 이상 상품이 **3개 이상**이면 SubCategoryNavSection 바로 아래에 "인기 상품" 섹션이 보인다(최대 8개).
3. **3개 미만이면 섹션이 DOM에 아예 없다** — 자리 표시/빈 상태 문구/스켈레톤 전부 없음. 사용자는 SubCategoryNavSection 다음에 곧바로 "베스트 디자인 템플릿"을 본다.
4. 카드 목록은 가로로 넘긴다(터치 스와이프 / 트랙패드 가로 스크롤 / Tab 이동 시 브라우저 자동 스크롤). 화살표 버튼 없음(§3.2 근거).
5. 카드 클릭 → `ProductCard`가 이미 갖고 있는 `<Link href={routes.products.detail(category, _id)}>`로 상세 페이지 이동. **신규 네비게이션 코드 없음.**

접근 제어: Home은 `docs/PAGE_ACCESS_CONTROL.md`의 인증 필요 페이지 목록에 없는 공개 라우트다 — `verifySession()` 게이트 대상 아니고, 이번 섹션이 그 판단을 바꾸지 않는다(로그인 여부와 무관하게 동일 노출).

---

## 3. 컴포넌트 트리 — 재사용 / 신규

### 3.1 결론

| 컴포넌트 | 상태 | 위치 |
| --- | --- | --- |
| `PopularProductsSection` | **신규** | `src/app/(main)/_components/PopularProductsSection.tsx` |
| `ProductCard` | **수정**(optional `rank` prop 추가) | `src/client/components/organisms/ProductCard.tsx` |
| `HomeTemplate` | **수정**(props 1개 추가 + 배치 1줄) | `src/app/(main)/_components/HomeTemplate.tsx` |
| `(main)/page.tsx` | **수정**(`Promise.all`에 호출 1개 추가) | `src/app/(main)/page.tsx` |
| `TypographyH2`, `Badge`, `TypographyMuted`, `CloudImage` | 재사용(그대로) | atoms/molecules |
| `TemplateCarouselGroup`, `atoms/carousel.tsx`(embla) | **재사용 안 함** | §3.2 근거 |

```
PopularProductsSection (신규, Server Component, 순수 presentational)
└── <section className="py-8">
    └── <div className="container mx-auto px-4">
        ├── <TypographyH2 id="popular-products-heading">인기 상품</TypographyH2>
        └── <ul className="flex gap-4 overflow-x-auto">      ← 가로 스크롤 트랙
            └── <li className="w-[45%] shrink-0"> × 3~8
                └── <ProductCard product={p} rank={index + 1} />   (재사용)
```

### 3.2 기존 캐러셀을 재사용하지 않는 근거 (과설계 방지 체크 결과)

먼저 기존 자산 2개를 실제로 확인했다.

- `src/client/components/organisms/TemplateCarouselGroup.tsx` — embla 기반, Home "베스트 디자인 템플릿"이 쓰는 캐러셀 그룹.
- `src/client/components/atoms/carousel.tsx` — shadcn/embla 원본 atom(`"use client"`).

**재사용 불가 판정 근거(우선순위 순):**

1. **480px 캡 known issue 재현(background[3], 결정적 근거).** `TemplateCarouselGroup`의 아이템 클래스가 `pl-4 sm:basis-1/2 md:basis-1/3 lg:basis-1/4`이고 화살표가 `hidden md:block`이다. `(main)/layout.tsx`는 `max-w-[480px]`로 콘텐츠를 캡하지만 Tailwind `md:`/`lg:`는 **실제 뷰포트 폭** 기준으로 발동하므로, 데스크탑에서는 480px 안에서 카드가 1/4폭(≈112px)으로 찌그러진다. 이 컴포넌트를 그대로 가져다 쓰면 Phase1 known issue를 새 섹션에서 그대로 재현한다.
2. **재사용하려면 기존 컴포넌트를 고쳐야 하고, 그건 무회귀 범위를 넓힌다.** 위 브레이크포인트를 걷어내거나 `rank`/`startRank` 같은 prop을 뚫으려면 "베스트 디자인 템플릿" 섹션(현재 유일 소비처)의 렌더도 같이 바뀐다 — 이번 기능 범위 밖의 회귀 리스크다. 반대로 `TemplateCarouselGroup`은 `title`/`description` 필수 prop 구조라 그대로 쓰면 시각적으로도 "베스트 디자인 템플릿"의 복제본이 된다.
3. **embla(client JS)를 새로 끌어올 이유가 없다.** 이 섹션에 필요한 건 "가로로 밀린다" 하나뿐이고, 480px 폭에서는 화살표 버튼(embla의 주 부가가치)이 사실상 무용하다. `atoms/carousel.tsx`는 `"use client"`라, 지금 서버에서 정적으로 렌더 가능한 섹션을 굳이 클라이언트 경계로 내리게 된다.
4. **동일 요구의 선례가 이미 CSS 한 줄로 풀려 있다.** Phase3 `SubCategoryNavSection`이 같은 480px 제약 아래에서 `flex gap-4 overflow-x-auto`만으로 가로 스크롤을 구현했고 브레이크포인트를 하나도 안 썼다. 같은 페이지·같은 제약·같은 요구라면 같은 방식이 일관적이다.

→ **신규 컴포넌트 1개(≈30줄, 상태 없음, JS 없음)**가 "기존 공용 컴포넌트를 고쳐 다목적화하는 것"보다 작고 안전하다. 과설계가 아니라 오히려 최소안이다.

### 3.3 배치 위치 판단 (컴포넌트 CLAUDE.md 축 A/축 B)

- **축 B(물리적 위치): `src/app/(main)/_components/`.** 이 섹션의 유일한 소비자는 `HomeTemplate`이고, `HomeTemplate`도 `(main)/page.tsx` 1곳 전용이다. `src/client/components/CLAUDE.md`의 "소비자 수는 전이적으로 센다 — 최종 도달 라우트 개수만 본다" 규칙상 실질 소비 라우트가 1곳이므로 공용 `organisms/`로 승격하지 않는다. Phase3 `SubCategoryNavSection`이 정확히 같은 판단으로 여기에 있다(직접 선례).
- **축 A(티어): 페이지 안의 한 구획 = organism 성격.** 다만 축 B에 의해 물리적으로는 라우트 로컬에 둔다(두 축은 독립이라 충돌 아님).
- **순수성(핵심 원칙 1) 유지**: 데이터 페칭·Server Action 없음, `products` prop만 받는다. 페칭은 `page.tsx`가 한다.
- **배럴(`_components/index.tsx`) 등재 안 함**: `src/app/CLAUDE.md` 규칙상 배럴은 `page.tsx`/`layout.tsx`가 직접 import하는 파일만 올리면 되고, 이 컴포넌트는 `HomeTemplate`이 상대경로로 직접 import한다(`SubCategoryNavSection`과 동일 처리).

### 3.4 480px 캡 준수 규칙 (신규 코드 하드 룰)

- **`sm:`/`md:`/`lg:`/`xl:` 접두사를 하나도 쓰지 않는다.** `sm:`(640px)도 480px 캡보다 크므로 동일한 known issue를 만든다 — "md 이상 금지"가 아니라 **반응형 접두사 전면 금지**로 간다.
- 가변 폭은 브레이크포인트 대신 **퍼센트**로 표현한다. 아이템 폭 `w-[45%] shrink-0` → 480px 캡(콘텐츠 448px)에서 카드 ≈200px, 2장 + 3번째 살짝 보임(스크롤 가능하다는 어포던스). 360px 단말에서도 같은 비율이 유지된다.
- `overflow-x-auto`는 `<ul>`에 걸고, 바깥 `container mx-auto px-4`는 `SubCategoryNavSection`과 동일하게 유지한다.
- 채택 안 함(과설계 방지): `snap-x`/`snap-mandatory` 스크롤 스냅, 커스텀 스크롤바 숨김 유틸, 화살표 버튼. `SubCategoryNavSection` 선례에도 없고 REQ에도 없다. 필요해지면 그때 별건으로 추가한다.

---

## 4. 클라이언트 상태 머신

**결론: 클라이언트 상태 없음. 훅 없음. `"use client"` 없음.**

Home Server Component가 렌더 시점에 데이터를 갖고 오므로(§1 가정 A), 브라우저에서 관측 가능한 상태는 아래 2개가 전부다.

| 상태 | 조건 | 렌더 |
| --- | --- | --- |
| **HIDDEN** | `products.length < POPULAR_PRODUCTS_MIN_ITEMS`(=3) — 좋아요 1개 이상 상품 부족, 서버 조회 실패로 `[]`인 경우 포함 | 섹션 전체가 DOM에 없음(`return null`) |
| **LOADED** | `POPULAR_PRODUCTS_MIN_ITEMS ≤ products.length ≤ POPULAR_PRODUCTS_LIMIT`(3~8) | 헤딩 + 가로 스크롤 트랙 + 카드 N장 |

- **로딩 상태 없음** — 클라이언트 페칭이 없어 스켈레톤/스피너가 존재할 수 없다. ISR로 정적 HTML이 내려온다.
- **에러 상태 없음** — `page.tsx`에서 `getPopularProductsService(POPULAR_PRODUCTS_LIMIT).catch(() => [] as Product[])`로 흡수한다(기존 `getFeaturedTemplatesService(...).catch(() => [] as Product[])` 패턴 그대로). 인기 상품 조회 실패가 Home 전체를 `error.tsx`로 떨어뜨리면 안 되므로 이 catch는 **필수**다. 실패 = 빈 배열 = HIDDEN으로 자연 수렴한다.
- **개인화 상태 없음** — ISR 공유 캐시라 로그인 여부·`isLiked`에 따라 갈리는 분기가 없다(§1.1).
- **빈 상태(empty state) UI 없음** — REQ-2가 "빈 상태가 아니라 존재 안 함"을 명시(신뢰도 낮은 '인기' 표시 방지). `ProductGrid`의 "상품을 준비 중에 있습니다" 같은 빈 상태 블록을 여기에 만들지 않는다.

### 4.1 3개 미만 게이트를 어디에 둘 것인가

**`PopularProductsSection` 내부에 둔다**: `if (products.length < POPULAR_PRODUCTS_MIN_ITEMS) return null;` (상수는 `@/shared/constants`에서 import — api-designer 확정대로 리터럴 3을 박지 않는다).

- 근거: `SubCategoryNavSection`이 `if (!subCategories.length) return null`로 자기 노출 조건을 스스로 판단하는 선례와 일치. 또한 `HomeTemplate`이 `{invitation.length > 0 && ...}`로 감싸고 `TemplateCarouselGroup`이 다시 `if (data.length === 0) return null`을 하는 **기존 이중 가드 중복**을 새 섹션에서 반복하지 않는다.
- 따라서 `HomeTemplate`은 조건 없이 `<PopularProductsSection products={popularProducts} />` 한 줄만 놓는다. "3"이라는 신뢰도 임계값을 읽는 지점이 한 곳뿐이다.
- **판정자는 UI 단 한 곳이다 — 서버는 3개 미만일 때 빈 배열로 눌러 내리는 이중 처리를 하지 않는다**(db-migrator-popular 요청, api-designer-popular 확정 계약과 일치). 서버 책임은 "좋아요 0개 제외 + 정렬 + 최대 8건"까지고, "3 미만이면 숨김"이라는 신뢰도 판단은 UI 소관이다. 양쪽이 다 판정하면 섹션이 안 보일 때 어느 레이어가 잘랐는지 구분이 안 돼 경계면 검증이 불가능해진다.
- api-designer-popular는 `HomeTemplate` 쪽에 `{popularProducts.length >= POPULAR_PRODUCTS_MIN_ITEMS && ...}` 형태를 제안했는데, **관측 가능한 동작은 완전히 동일하고**(같은 상수, 같은 임계값, 같은 DOM 결과) "UI 내부 어느 파일에 두느냐"만 다르다 — 쟁점 아니며 위 선례 일관성 근거로 컴포넌트 내부를 택했다. 구현자는 둘 중 하나만 두면 된다(양쪽에 다 넣지 말 것).

---

## 5. 컴포넌트 명세

### 5.1 `PopularProductsSection` (신규)

```
파일: src/app/(main)/_components/PopularProductsSection.tsx
props: { products: Product[] }   // Product = ProductJSON (@/server/services)
import: POPULAR_PRODUCTS_MIN_ITEMS from "@/shared/constants"
```

- `products.length < POPULAR_PRODUCTS_MIN_ITEMS` → `null`.
- `<section className="py-8" aria-labelledby="popular-products-heading">`
- 헤딩: `<TypographyH2 id="popular-products-heading" className="mb-4 border-none text-xl font-bold">인기 상품</TypographyH2>` — `SubCategoryNavSection`의 헤딩 스타일과 동일(`border-none text-xl font-bold`, `md:text-4xl` 같은 것 없음). 부제/설명 문구는 두지 않는다(REQ에 없음).
- 목록: `<ul className="flex gap-4 overflow-x-auto">`, 아이템 `<li key={p._id} className="w-[45%] shrink-0">`.
- 카드: `<ProductCard product={p} rank={index + 1} />` — 배열 순서 = 순위. 서버가 이미 likes desc로 정렬해 보낸다는 전제(§1.1).
- 상단에 `"use client"` 붙이지 않는다. `async` 붙일 필요도 없다(props만 받음).

### 5.2 `ProductCard` 수정 (REQ-3)

```ts
export function ProductCard({ product, rank }: { product: Product; rank?: number })
```

- 렌더 조건: `typeof rank === "number"`일 때만 배지 렌더. `{rank && ...}` 형태의 truthy 체크는 쓰지 않는다(0이 들어오면 React가 `0`을 그대로 출력하는 함정).
- 배치: 기존 상단 좌측 배지 컬럼(`<div className="flex flex-col gap-1.5">`, 현재 Premium/추천 배지가 들어있는 곳)의 **첫 번째 자식**으로 넣는다. Premium/추천보다 위에 오게 해서 순위가 가장 먼저 읽히게 한다. 우측 할인 배지 영역은 건드리지 않는다.
- 마크업(형제 배지들과 동일한 `Badge` + `TypographyMuted` 패턴 유지):
  ```tsx
  {typeof rank === "number" && (
    <Badge className="border-transparent bg-neutral-900/85 shadow-sm backdrop-blur-sm">
      <TypographyMuted className="text-[10px] font-bold text-white">
        {rank}
        <span className="sr-only">인기 {rank}위</span>
      </TypographyMuted>
    </Badge>
  )}
  ```
  - 숫자만 노출하면 스크린리더에서 의미 없는 "1"이 되므로 `sr-only` 보조 텍스트를 함께 둔다.
  - 색: Premium(amber)/추천(white)/할인(rose)과 겹치지 않는 중립 다크. 카드 상단 그라데이션 위에서 대비 확보.
- **대안 검토·기각**: 카드 하단(제목/가격/좋아요 영역)에 큰 순위 숫자를 오버레이하는 안 — 하단은 이미 서브카테고리/제목/원가/할인가/좋아요 5개 정보가 들어차 있어 정보 밀도 초과. 상단 배지 컬럼이 이미 "배지들의 자리"로 확립돼 있어 추가 레이아웃 규칙이 필요 없다.
- **무회귀 근거**: `rank`는 optional이고, 기존 소비처는 전부 미전달이다.
  - `ProductGrid.tsx:28` → `<ProductCard key={item._id} product={item} />` (검색 결과 `search/_components/ProductSearch.tsx:45`도 `ProductGrid`를 경유하므로 별도 소비처가 아니다)
  - `TemplateCarouselGroup.tsx:45` → `<ProductCard product={product} />`
  - 즉 실제 소비처는 2곳뿐이며 둘 다 변경 없음 → 배지 미렌더 → 기존 화면 동일.

### 5.3 `HomeTemplate` 수정

- props에 `popularProducts: Product[]` 추가.
- `<SubCategoryNavSection category="invitation" />` **바로 다음 줄**, "베스트 디자인 템플릿" `{invitation.length > 0 && (...)}` 블록 **이전**에 `<PopularProductsSection products={popularProducts} />` 삽입(background[0] 확정 순서).
- import는 `SubCategoryNavSection`과 동일하게 `./PopularProductsSection` 상대경로.

### 5.4 `(main)/page.tsx` 수정

- 기존 `Promise.all` 배열에 세 번째 항목 추가: `getPopularProductsService(POPULAR_PRODUCTS_LIMIT).catch(() => [] as Product[])`.
- `<HomeTemplate ... popularProducts={popularProducts} />`로 전달. `revalidate = 3600`은 그대로 — 인기 순위가 최대 1시간 지연 반영되는 건 허용 범위(별도 요구 없음).
- `userId`는 넘기지 않는다(§1.1 `isLiked` 항목 — ISR 공유 캐시 오염 방지).

### 5.5 `src/shared/constants/product.ts` 수정

- 기존 파일에 `POPULAR_PRODUCTS_LIMIT = 8`, `POPULAR_PRODUCTS_MIN_ITEMS = 3` 추가(신규 파일 아님 — 이미 존재하고 `constants/index.ts` 배럴에 등재돼 있어 배럴 수정 불필요).
- 소유자는 api-designer/backend 쪽이지만 UI(§5.1, §5.4)도 같은 상수를 소비하므로 여기 명시한다 — 구현 시 중복 정의 주의.

---

## 6. 폼 유효성 규칙

**해당 없음** — 이번 기능에 입력 폼·사용자 입력·mutation·Server Action이 없다(읽기 전용 노출 섹션).

---

## 7. 테스트 계획 (프론트 구현자 인계용)

프로젝트 관례상 `_components`의 각 파일은 co-located `*.test.tsx`를 갖는다(`SubCategoryNavSection.test.tsx` 등).

**`PopularProductsSection.test.tsx` (신규)**
1. 상품 3개 → 섹션 헤딩("인기 상품")과 카드 3장이 렌더된다.
2. 상품 2개 → 아무것도 렌더되지 않는다(`container`가 비어있음 / 헤딩 `queryBy...` null) — REQ-2 수용 기준.
3. 상품 8개 → 8장 전부 렌더 + 첫 카드에 순위 1이 붙는다(순서=순위 검증).
4. (선택) 가로 스크롤 트랙이 `overflow-x-auto` 리스트로 렌더된다 — `SubCategoryNavSection.test.tsx`의 랜드마크 검증과 같은 성격.

**`ProductCard.test.tsx` (기존 파일에 추가)**
5. `rank` 미전달 → 순위 배지 없음(기존 27개 assertion 무회귀 + `queryByText("1")` 부재).
6. `rank={1}` 전달 → "1" 및 "인기 1위"(sr-only) 노출.

**`HomeTemplate.test.tsx` (기존 파일 수정 필요)**
7. 기존 5개 케이스가 `<HomeTemplate invitation={} product={} infoId={} />`를 직접 호출하므로 `popularProducts` prop 추가에 따라 **전 케이스 시그니처 갱신이 필요하다**(타입 에러로 바로 드러남, `popularProducts={[]}` 추가). 기존 mock 블록(`vi.mock("@/client/components/organisms")`)은 `PopularProductsSection`이 `_components` 소속이라 영향받지 않는다.
8. 배치 순서 검증: `popularProducts` 3개 이상일 때 DOM 순서가 SubCategoryNav → 인기 상품 → "초대장"(베스트 디자인 템플릿) 순인지 확인(background[0] 회귀 방지).

### 7.1 수동 검증 전 시딩 전제 (db-migrator-popular 요청, 필독)

**dev DB의 products는 2건뿐이라 시딩 없이 홈을 열면 섹션이 구조적으로 안 나온다.** 두 건 모두에 좋아요가 있어도 3 미만이라 HIDDEN이 정답이다. 문제는 **조회 로직이나 렌더 조건이 완전히 깨져 있어도 화면 증상이 똑같다**는 것 — "안 보이니까 통과"와 "안 보이니까 버그"를 눈으로 구분할 수 없다.

- **"홈에서 안 보인다"를 단독 검증 근거로 삼지 않는다.** 시딩 전 단계의 증거 능력은 위 자동 테스트(§7 1~8)에만 있다.
- 수동 확인이 필요하면 **좋아요 ≥1 상품을 4건 이상, 좋아요 수를 서로 다르게(예: 5/3/2/1) + 동점 1쌍 포함**해서 시딩한다. 3건만 시딩하면 "경계(3) 통과"만 확인되고 정렬·순위 배지(REQ-3)의 정확성은 드러나지 않는다.
- 시딩 후 확인할 것: (a) 섹션이 SubCategoryNavSection 다음에 나타난다, (b) 배지 숫자가 좋아요 내림차순과 일치한다, (c) 동점 쌍이 새로고침(재생성) 후에도 같은 순서를 유지한다(§1.1 tie-break 보장 확인), (d) 480px 캡 안에서 카드 2장 + 3번째 살짝 보이고 가로 스크롤이 된다, (e) 데스크탑 넓은 창에서도 (d)가 동일하다(브레이크포인트 미사용 확인).
- 시딩 스크립트/데이터 자체는 db-migrator-popular 소관(`01_db_schema.md` §6-3).

---

## 8. 미해결 쟁점 / 인계 사항

1. **(해소됨)** §1.1 데이터 계약 — api-designer-popular 회신으로 전부 확정(신규 엔드포인트 없음 / `Product[]` / `getPopularProductsService(limit?, userId?)` / prop명 `popularProducts` / 공유 상수 2개 / `isLiked` 항상 false). 미해결 쟁점 없음.
2. **별건 후속 이슈 — 이번 PR 스코프 밖(리더 확정, 건드리지 말 것).** `ProductCard`가 `CloudImage`에 `priority={true}`를 하드코딩하고 있다. 인기 상품 8장이 추가되면 Home의 우선 로드 이미지가 늘어 LCP에 불리할 수 있다(`lighthouse-history.ndjson`으로 성능을 추적 중인 프로젝트). 기존 "베스트 디자인 템플릿" 캐러셀에서도 이미 동일한 상태라 이번 기능이 만든 문제가 아니다 — **구현자는 `ProductCard`의 `priority` 관련 코드를 수정하지 않는다.** 별도 이슈로 후속 처리한다.
3. **(참고)** `HomeTemplate`의 기존 "베스트 디자인 템플릿" 블록은 `md:text-4xl`(헤딩)과 `TemplateCarouselGroup`의 `sm:/md:/lg:basis`를 여전히 갖고 있다 — background[3] known issue의 잔존 지점이다. 이번 PR에서 건드리지 않는다(surgical change 원칙).
