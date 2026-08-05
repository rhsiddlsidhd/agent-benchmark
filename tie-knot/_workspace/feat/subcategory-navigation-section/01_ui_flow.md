# 01_ui_flow — 서브카테고리 진입 섹션 화면/상태 설계

> 브랜치: `feat/subcategory-navigation-section`
> 담당: ui-designer-subcat
> 대상: REQ-3(Home 서브카테고리 진입 섹션), REQ-4(딥링크 → 사전 필터링된 목록)
> **api-designer-subcat 협의 완료(1라운드에 전항 합의)** — 쿼리파라미터 계약·스코프·무효값 처리·응답 shape 전부 확정. 상세는 `01_api_contract.md`. 이 문서의 ⚠️ 표시는 전부 해소했다.

---

## 0. 용어 — 라벨 혼동 방지 (필독)

이번 기능은 "초대장"과 "청첩장"이 **다른 층위의 라벨**이라 코드/코멘트/커밋에서 반드시 구분한다.

| 코드 | 값 | 라벨 | 층위 | 이번 기능에서의 역할 |
| --- | --- | --- | --- | --- |
| `productCategoryLabels.invitation` | `"invitation"` | **초대장** | ProductCategory(우산 카테고리) | 섹션 제목/경로 세그먼트(`/products/invitation`) |
| `subCategoryLabels.wedding` | `"wedding"` | **청첩장** | SubCategory(결혼식 occasion) | 리스트 아이템 1 (Heart) |
| `subCategoryLabels["first-birthday"]` | `"first-birthday"` | **돌잔치** | SubCategory(돌 occasion) | 리스트 아이템 2 (Cake) |

- 새 컴포넌트/변수/코멘트에서 `invitation`을 "청첩장"으로 부르지 않는다. 섹션 전체를 가리킬 땐 "초대장", 개별 아이템을 가리킬 땐 각 서브카테고리 라벨을 쓴다.
- 컴포넌트 이름에도 반영: `SubCategoryNavSection`(서브카테고리 진입) — `InvitationNavSection`/`WeddingSection` 같은 층위 섞인 이름 금지.

---

## 1. 화면 플로우

### 1.1 플로우도

```
                      [진입점]
                         │
              ┌──────────┴───────────┐
              │  Home  ( URL: / )    │
              │  (main)/page.tsx     │
              └──────────┬───────────┘
                         │  RSC 렌더 (데이터 페칭 없음 — 아래 §4.1)
                         ▼
        ┌────────────────────────────────────────┐
        │  SubCategoryNavSection                 │
        │  ─ 제목: "초대장, 무엇을 찾으세요?"     │
        │  ─ 가로 스크롤 리스트                  │
        │    ┌────────┐ ┌────────┐   →→ (추가 시 옆으로 계속) │
        │    │ ♥ Heart│ │ 🎂 Cake│                            │
        │    │ 청첩장 │ │ 돌잔치 │                            │
        │    └────────┘ └────────┘                            │
        │    SUB_CATEGORY_MAP.invitation 순회 결과            │
        └───────┬──────────────────┬─────────────┘
                │ 아이템 클릭       │ 아이템 클릭
                │ (<Link href>)     │ (<Link href>)
                ▼                   ▼
  /products/invitation        /products/invitation
    ?subCategory=wedding        ?subCategory=first-birthday
                │                   │
                └─────────┬─────────┘
                          ▼
        ┌──────────────────────────────────────────┐
        │  상품 목록 (products)/products/[category] │
        │  ① RSC: params.category 검증             │
        │     └ 실패 → notFound() → 404 (기존)     │
        │  ② RSC: searchParams.subCategory 검증    │
        │     └ 유효  → initialSubCategory = 값     │
        │     └ 무효/없음 → initialSubCategory="all"│
        │  ③ RSC: getAllProductsService(category)  │
        │     └ throw → (products)/error.tsx        │
        │  ④ CSR: ProductFilterProvider            │
        │     initialValue.subCategory = ②의 값     │
        │  ⑤ 화면: 해당 칩 active + 필터된 그리드   │
        └──────────────────────────────────────────┘
                          │
                          ▼
                      [종료 상태]
       (A) 필터 결과 ≥1건 → ProductGrid 카드 노출 → 상세로 계속 진행
       (B) 필터 결과 0건  → ProductGrid 빈 상태 + 칩은 active (§4.3 T-5)
```

### 1.2 실제 도달 URL (라우트 그룹은 URL에서 제거됨)

| 화면 | 파일 경로 | 실제 URL |
| --- | --- | --- |
| Home | `src/app/(main)/page.tsx` | `/` |
| 목록(전체) | `src/app/(main)/(products)/products/[category]/page.tsx` | `/products/invitation` |
| 목록(청첩장 딥링크) | 〃 | `/products/invitation?subCategory=wedding` |
| 목록(돌잔치 딥링크) | 〃 | `/products/invitation?subCategory=first-birthday` |
| 상세 | `.../[category]/[id]/page.tsx` | `/products/invitation/{id}` |

`(main)`, `(products)`는 조직화용 라우트 그룹이라 URL에 나타나지 않는다.

---

## 2. 쿼리 파라미터 계약 (REQ-4)

**api-designer-subcat 확정(신규 엔드포인트 없음 — 기존 `/products/[category]`의 쿼리파라미터로 처리).**

| 항목 | 확정값 | 근거 |
| --- | --- | --- |
| 파라미터명 | `subCategory` (camelCase 고정) | 클라이언트 state 필드(`ProductFilterState.subCategory`)·DB 필드(`product.subCategory`)와 이미 동일 → 매핑 레이어가 안 생김 |
| 값 | `SubCategory` 유니온 값 그대로 (`wedding` \| `first-birthday`). **라벨 금지** | 라벨("청첩장") 대신 enum key를 써야 i18n/라벨 변경에 URL이 안 깨짐 |
| 개수 | 단일값(반복 파라미터/CSV 미지원) | 현재 필터 state가 단일 선택(`SubCategory \| "all"`)이라 다중값을 받아도 표현할 UI가 없음 |
| 없을 때 | `all`(기존 동작 그대로). **"전체"의 정규형은 파라미터 생략** | 기존 `/products/invitation` 링크(`navigation.ts`, `SearchEmptyState.tsx`) 무회귀 |
| `?subCategory=all` | 수용은 하되 **링크를 그 형태로 만들지 않는다** | 같은 화면에 URL이 두 벌 생기는 걸 막음 |
| 잘못된 값 | **404가 아니라 조용히 `all` 폴백** | ① 쿼리파라미터는 리소스 식별자가 아니라 뷰 옵션이라 페이지 자체는 존재한다(REQ-1로 제거되는 `?subCategory=vip` 북마크를 전부 404로 만들지 않음). ② api-designer 추가 근거: RSC 렌더 경로는 `ERROR_HANDLING.md`의 채널 A/B 어느 쪽도 아니라 `{success:false, error}` envelope을 돌려줄 수단 자체가 없다 — 여기서 400을 내려면 envelope 밖 새 에러 표현을 발명해야 하는데 금지 사항이다 |

### 2.1 자유 텍스트 검색(`/api/products/search`) 재사용 금지 — 확정

요구사항 background대로 `q` 자유 텍스트 재사용은 채택하지 않는다. 근거를 UI 관점으로 한 줄 더 보태면: `q=청첩장`은 **상품 제목에 "청첩장"이 들어간 상품**도 같이 잡아서, "청첩장 아이콘을 눌렀는데 돌잔치 상품이 섞여 나오는" 결과가 나온다 — 진입 섹션의 계약("이 아이콘 = 이 서브카테고리")을 화면에서 배신한다.

### 2.2 링크 생성은 `routes.ts` 빌더로 (문자열 템플릿 금지)

api-designer 계약은 "`SUB_CATEGORY_MAP` 순회로 `/products/${category}?subCategory=${sub}` 조립, 경로 세그먼트도 하드코딩 금지"다. 이를 만족시키는 형태로 **문자열 템플릿을 컴포넌트에 두지 않고 `routes.ts` 빌더에 흡수한다** — `src/shared/constants/CLAUDE.md`가 "동적 세그먼트는 문자열 템플릿이 아니라 경로 빌더 함수로 제공"을 명시하기 때문이다. `category`는 prop, `subCategory`는 map 순회값이라 리터럴 하드코딩은 어디에도 남지 않으며, 파라미터명이 바뀌어도 고칠 파일이 `routes.ts` 하나로 국한된다.

```ts
// src/shared/constants/routes.ts (수정)
import type { SubCategory } from "@/shared/utils";

products: {
  root: "/products",
  // subCategory를 안 넘기면 기존 동작 그대로 → 기존 호출부(navigation.ts, SearchEmptyState.tsx) 무회귀
  byCategory: (category: string, subCategory?: SubCategory) =>
    subCategory
      ? `/products/${category}?subCategory=${subCategory}`
      : `/products/${category}`,
  detail: (category: string, id: string) => `/products/${category}/${id}`,
},
```

**두 번째 인자 타입은 `string`이 아니라 `SubCategory`로 둔다**(api-designer 권장 수용). 이유: §2.3 무변환 규칙이 문서 조항이 아니라 **타입으로 강제**된다 — `firstBirthday` 같은 하이픈 유실 오타가 컴파일 타임에 잡히는 유일한 지점이다. 기존 `category: string`은 이번 변경과 무관하므로 현행 유지(surgical).

부수 효과 하나 더: optional 분기 덕에 인자가 없으면 파라미터 자체를 안 붙이므로 **`?subCategory=all`을 생성할 경로가 구조적으로 존재하지 않는다** — §2 "전체의 정규형은 파라미터 생략"이 사람이 지키는 규칙이 아니라 구조로 보장된다.

### 2.3 무변환 규칙 (계약 필수 조항 — api-designer/db-migrator 제기)

**`SUB_CATEGORY_MAP`의 원소를 어떤 문자열 변환도 거치지 않고 그대로 href에 싣는다.** 케밥↔카멜 변환 유틸, `toLowerCase()`, slugify, 커스텀 정규화 전부 금지.

이게 왜 스타일 취향이 아니라 계약 조항인가 — **실패 모드가 이번 설계에서 가장 나쁘기 때문이다**:

- 이 설계는 서버 쿼리가 아니라 `useVisibleProducts`의 **문자열 등치 비교**(`item.subCategory === state.subCategory`)로 필터링한다.
- URL 값과 DB 저장값이 한 글자라도 어긋나면 **에러 없이 빈 목록**만 나온다 — 예외도, 콘솔 로그도, DB explain 흔적도 없다. T-5(정상적인 0건)와 화면상 구분이 안 된다.
- 위험 지점은 **`first-birthday`의 하이픈**이다. 중간에 카멜 변환이 끼면 `firstBirthday`가 되어 조용히 0건이 된다.

**⚠️ 검증 시 부분 통과 함정**: 동작 확인은 청첩장뿐 아니라 **돌잔치(`first-birthday`) 경로까지 실목록 도달**을 반드시 확인한다. `wedding`은 어떤 변환에도 불변이라 이 버그가 청첩장 경로에서는 절대 드러나지 않고 돌잔치에서만 터진다 — 청첩장만 보고 통과시키기 쉬운 구조다. (§7 체크리스트에도 재기재)

이 규칙을 지키면 URL = DB = 클라이언트 state가 전부 `SUB_CATEGORY_MAP` 한 상수에서 나온 동일 문자열이 되어 등치 비교가 구조적으로 보장된다(DB 쪽은 `product.model.ts` validator가 쓰기 시점에 문자 단위 동일성을 이미 강제한다).

### 2.4 쿼리 파라미터 검증 — 신규 zod 스키마 없이 기존 타입가드 재사용

**api-designer 확정: `src/shared/schemas/request/`에 신규 스키마를 만들지 않는다.** 기존 `isSubCategory()` 타입가드(`src/shared/utils/category.ts`)만 쓴다.

ui-designer는 처음에 `productSearch.schema.ts` 선례를 따라 zod request 스키마를 제안했으나, api-designer 판단(요청 계약 소유자)을 수용한다. 실제로도 이 파라미터는 `SubCategory` 유니온 소속 여부 단일 판정뿐이라 zod가 더해줄 정규화·에러메시지가 없고, `isSubCategory`는 이미 타입 내로잉(`value is SubCategory`)까지 해준다 — 스키마를 새로 만들면 오히려 taxonomy 판정 기준이 두 군데로 갈린다.

검증 로직은 `page.tsx`에 조건문을 흩뿌리는 대신 **`initialSubCategory`를 만드는 지역 헬퍼 한 곳**에 모은다. 요구 동작:

| 입력 (`searchParams.subCategory`) | 출력 (`initialSubCategory`) | 이유 |
| --- | --- | --- |
| `undefined` (파라미터 없음) | `"all"` | 기존 링크 무회귀 — 정규형 |
| `"wedding"` | `"wedding"` | 정상 |
| `"all"` | `"all"` | 명시적 전체도 수용(단, 링크는 생성 안 함) |
| `""` / `"   "` | `"all"` | 빈 값 = 조건 없음 |
| `"vip"` (REQ-1로 제거된 값) | `"all"` | throw 금지 — 화면에 새 에러 상태를 안 만든다(§2 표) |
| `"asdf"` | `"all"` | 〃 |
| `["wedding","x"]` (배열) | `"all"` | Next.js `searchParams`는 중복 키를 배열로 준다 — 단일값 계약이라 배열은 무효 처리. `typeof x === "string"` 선체크 필수 |

핵심: **어떤 입력도 throw하지 않는다.** 이 헬퍼가 던지면 `(products)/error.tsx`가 잡아서 "상품 페이지 오류" 전면 에러가 뜬다 — 오타 하나로 목록 전체가 죽는다.

---

## 3. 컴포넌트 트리

### 3.1 트리

```
src/app/(main)/page.tsx                      [RSC, 기존]  ── 수정 없음
└── HomeTemplate.tsx                         [RSC, 기존]  ── ★수정: 섹션 1줄 삽입
    ├── EcommerceHero                        [organisms, 기존, 재사용]
    ├── SubCategoryNavSection ★신규          [RSC, (main)/_components/]
    │   └── SubCategoryNavItem ★신규 (×N)    [RSC, (main)/_components/]
    │       ├── next/link <Link>             [재사용]
    │       ├── lucide-react Heart / Cake    [재사용, subCategoryIcons 경유]
    │       └── TypographySmall              [atoms, 기존, 재사용]
    ├── (Phase 4 자리 — 인기 상품 섹션)
    ├── TemplateCarouselGroup                [organisms, 기존, 재사용]
    ├── LiveDemoSection                      [organisms, 기존, 재사용]
    └── StartActionCTA                       [organisms, 기존, 재사용]

src/app/(main)/_constants/ ★신규 폴더
├── index.ts                                 [배럴 — app/CLAUDE.md 강제 형태]
└── subCategoryIcons.ts ★신규                [SubCategory → LucideIcon 매핑]

--- 목적지 쪽 (REQ-4) ---
src/app/(main)/(products)/products/[category]/page.tsx  [RSC, 기존] ── ★수정: searchParams 수신·검증 → initialSubCategory
└── _components/ProductCatalog.tsx           [컨테이너, 기존]  ── ★수정: initialSubCategory prop 통과(이름 동일)
    └── organisms/ProductCatalog.tsx         [기존]            ── ★수정: initialValue에 spread 주입
        ├── ProductFilterProvider            [context, 기존, 무수정]
        ├── ProductFilters                   [organisms, 기존, 무수정]
        └── ProductGrid                      [organisms, 기존, 무수정]
```

### 3.2 신규 vs 재사용 판정표

| 컴포넌트 | 판정 | 티어(축 A) | 위치(축 B) | 근거 |
| --- | --- | --- | --- | --- |
| `SubCategoryNavSection` | **신규** | organism(페이지 안의 뚜렷한 한 구획, 하위 조각 N개 조합) | `src/app/(main)/_components/` | 최종 소비 라우트가 `/` 1곳뿐 → `components/CLAUDE.md` 승격 규칙상 라우트 로컬. §3.4 참고 |
| `SubCategoryNavItem` | **신규** | molecule(아이콘+라벨, 단일 책임) | `src/app/(main)/_components/` | 유일 소비자가 위 섹션이고 그 섹션도 라우트 1곳 전용 → 전이적으로 1라우트 |
| `subCategoryIcons` | **신규(상수)** | — | `src/app/(main)/_constants/` | §3.3 |
| `TypographySmall`/`TypographyP`/`TypographyH2` | 재사용 | atoms | 기존 | 프로젝트 타이포 프리미티브 |
| `next/link` `<Link>` | 재사용 | — | — | `components/CLAUDE.md` 예외 2 — 단순 페이지 이동은 `useRouter().push()` 대신 `<Link>`. **덕분에 컨테이너 분리도, `"use client"`도 필요 없다** |
| `lucide-react` Heart/Cake | 재사용 | — | — | 요구사항 지정 아이콘 |
| `Carousel`(atoms) | **미채택** | — | — | REQ-3이 "가로 스크롤 리스트"를 요구 — embla 캐러셀은 클라이언트 JS·좌우 버튼·`md:` 브레이크포인트를 끌고 온다(§5.2 480px 이슈와 충돌). CSS `overflow-x-auto`로 충분 |
| `ProductFilters` / `ProductGrid` / `useVisibleProducts` | 재사용(무수정) | organisms/hooks | 기존 | 필터 state 초기값만 갈아끼우면 기존 필터링 로직이 그대로 동작 — §4.2 |

### 3.3 아이콘 매핑 — "하드코딩 나열 금지"를 만족시키는 방법

REQ-3의 핵심 제약은 "서브카테고리가 늘어도 **컴포넌트를 안 고쳐도** 되게"다. 목록 자체는 `SUB_CATEGORY_MAP` 순회로 해결되지만, 아이콘은 어딘가에 매핑이 필요하다. 설계:

```ts
// src/app/(main)/_constants/subCategoryIcons.ts
import { Heart, Cake, type LucideIcon } from "lucide-react";
import type { SubCategory } from "@/shared/utils";

// Partial이 아니라 완전한 Record — 서브카테고리를 추가하고 아이콘을 안 채우면
// subCategoryLabels와 똑같이 TS 컴파일 에러로 잡힌다(기존 안전장치와 동일 패턴).
export const subCategoryIcons: Record<SubCategory, LucideIcon> = {
  wedding: Heart,        // 청첩장(결혼식) — "초대장"(카테고리 라벨) 아님, §0 참고
  "first-birthday": Cake, // 돌잔치
};
```

- **컴포넌트는 `SUB_CATEGORY_MAP[category].map(...)`만 돌린다** — 아이템을 나열하는 JSX가 없다. 서브카테고리가 늘면 고치는 파일은 `category.ts`(값 추가) + `subCategoryLabels`(라벨) + `subCategoryIcons`(아이콘) 세 lookup map뿐이고, 컴포넌트는 그대로다. REQ-3 acceptance 충족.
- 식별자 케이스는 `subCategoryIcons`(camelCase)가 맞다 — `shared/constants/CLAUDE.md` 규칙상 "값 안에 컴포넌트 참조가 섞이면 camelCase"(`navigation.ts`의 `userNavItems` 선례).
- **⚠️ 이 매핑을 `src/shared/utils/category.ts`에 넣지 않는다.** `category.ts`는 `product.model.ts`(서버/DB)가 import하는 파일이고 `shared/utils/CLAUDE.md`가 "side-effect 없는 도메인-무관 순수 함수" 전담으로 규정한다 — 여기 lucide-react(React 컴포넌트)를 넣으면 서버 모델이 배럴 경유로 UI 라이브러리를 끌어온다.
- **⚠️ key는 `SUB_CATEGORY_MAP` 원소와 문자 단위로 동일해야 한다**(`"first-birthday"`, 하이픈 유지). `Record<SubCategory, ...>` 타입 덕에 `firstBirthday`로 쓰면 컴파일 에러로 잡히지만, **아이콘 매핑용 정규화 유틸을 만드는 순간 그게 href 쪽으로 전염된다** — §2.3 무변환 규칙 참고. 정규화 유틸 자체를 만들지 않는다.
- 승격 트리거: 나중에 `/products` 쪽에서도 같은 진입 리스트를 쓰게 되면(라우트 2곳) 그때 `src/client/components/`와 `src/shared/constants/`로 올린다. 지금 미리 올리지 않는다.

### 3.4 `organisms/`가 아니라 `(main)/_components/`인 이유 (+ 기존 형제와의 불일치)

`EcommerceHero`/`LiveDemoSection`/`StartActionCTA`/`TemplateCarouselGroup`은 전부 `src/client/components/organisms/`에 있지만, grep 결과 **소비자가 `HomeTemplate` 하나뿐**이다(= 라우트 1곳). 즉 기존 배치는 `components/CLAUDE.md` 승격 규칙과 이미 어긋나 있다. `src/app/CLAUDE.md` Gotchas가 "이 패턴은 새 라우트/새 기능부터 강제하고 기존 라우트를 일괄 전환하지는 않는다"고 명시하므로, **신규인 이번 섹션은 규칙대로 `(main)/_components/`에 둔다.**

- 리스크: 같은 Home 화면의 섹션들이 두 곳에 흩어져 보인다. 구현자가 "형제들이 organisms에 있으니 나도"라고 판단하지 않도록 여기에 근거를 남긴다.
- **✅ 리더 승인 확정** — 기존 `organisms/` 배치 Home 섹션 4개(`EcommerceHero`/`LiveDemoSection`/`StartActionCTA`/`TemplateCarouselGroup`)는 **그대로 두고 이번에 옮기지 않는다**. 일관성을 이유로 신규를 `organisms/`에 맞추지도 않는다 — `src/app/CLAUDE.md` Gotchas("새 라우트/새 기능부터 강제, 기존 일괄 전환은 안 함") 그대로 적용. 즉 두 곳에 흩어진 상태는 **의도된 과도기**이며 구현자가 임의로 정리하지 않는다.

### 3.5 배치 위치 — HomeTemplate 안 어디에?

**결정: `EcommerceHero` 바로 다음, Phase 4 "인기 상품" 섹션보다 위. ✅ 리더 승인 확정.**

```
EcommerceHero
  ↓
SubCategoryNavSection      ← ★이번 기능
  ↓
(Phase 4: 인기 상품 섹션)   ← TODO.md가 "Hero 바로 다음"이라 적은 자리
  ↓
베스트 디자인 템플릿 (TemplateCarouselGroup)
  ↓
LiveDemoSection
  ↓
StartActionCTA
```

근거:
1. **성격이 다르다** — 서브카테고리 리스트는 큐레이션 콘텐츠가 아니라 **길찾기(wayfinding) 띠**다. 높이 100px 안팎의 얇은 밴드라 히어로와 첫 콘텐츠 섹션 사이를 밀어내지 않는다.
2. **TODO.md가 인용한 실사 결과와 일치** — "카테고리 진입점은 가로로 압축(세로로 안 쌓음)" + 무신사/쿠팡/크림 공통 패턴이 `검색 → 히어로 → 카테고리 아이콘 행 → 큐레이션 섹션 반복`이다. 큐레이션(인기 상품)보다 위가 맞다.
3. **Phase 4의 의도는 보존된다** — "Hero 바로 다음"의 취지는 "베스트 디자인 템플릿보다 위, 첫 스크롤 안"이고, 얇은 nav 띠 하나가 끼어도 그 취지는 유지된다.
   - 문자 그대로의 "Hero 바로 다음"은 이번 PR로 이번 섹션이 차지한다. **리더 승인 완료** — Phase 4 착수 시 이 순서를 기정사실로 삼고, 재논의가 필요하면 이 문단을 근거로 쓴다.
4. Hero **위**는 기각 — 히어로가 first paint의 주력 프로모션 슬롯이다.

---

## 4. 클라이언트 상태 머신

### 4.1 Home 섹션(REQ-3) — 상태 없음

**이 섹션에는 로딩/에러/빈 상태가 존재하지 않는다.** 근거를 명시해둔다(리뷰어가 "왜 skeleton이 없냐"고 묻는 걸 방지):

- 데이터 소스가 `SUB_CATEGORY_MAP`(컴파일타임 상수)이다 — fetch도, `useSWR`도, Server Action도 없다.
- 따라서 `fetcher`/`ErrorPayload` 계약(`src/client/CLAUDE.md`)의 적용 대상이 아니다.
- `"use client"`도 불필요하다 — `<Link>` + lucide 아이콘 + CSS 스크롤뿐이라 순수 RSC로 렌더된다(lucide-react는 이미 `ProductCard.tsx`/`Header.tsx` 등 서버 컴포넌트에서 쓰이고 있어 검증됨). **클라이언트 번들 증가분 0.**

| 상태 | 조건 | 렌더 |
| --- | --- | --- |
| 정상 | `SUB_CATEGORY_MAP[category].length > 0` | 제목 + 가로 스크롤 리스트 |
| 방어적 숨김 | `SUB_CATEGORY_MAP[category].length === 0` | `return null` — `TemplateCarouselGroup`의 `if (data.length === 0) return null` 선례와 동일. 현재 타입상 도달 불가지만 카테고리 추가 시 빈 배열이 들어올 수 있다 |

### 4.2 목적지 페이지(REQ-4) — 데이터 흐름

핵심 발견: **서버 응답 shape을 바꿀 필요가 전혀 없다.** 필터링이 이미 100% 클라이언트에서 일어나기 때문이다.

```
getAllProductsService(category)  →  Product[]  (전량, 무변경)
                                        │
searchParams.subCategory ──검증──→ initialSubCategory: SubCategory | "all"
                                        │
                     ProductFilterProvider initialValue={{
                       ...initialFilterState,
                       subCategory: initialSubCategory,   ← ★유일한 변경점
                     }}
                                        │
                     useVisibleProducts(state, data)  ← 무수정
                       state.subCategory === "all" || item.subCategory === state.subCategory
                                        │
                              ProductGrid / ProductFilters
```

**계약 세부 (api-designer 확정 — 세 층 모두 같은 이름으로 통과시킬 것):**

| 항목 | 값 |
| --- | --- |
| prop 이름 | `initialSubCategory` (page.tsx → `_components/ProductCatalog.tsx` → `organisms/ProductCatalog.tsx` 3층 동일) |
| 타입 | `SubCategory \| "all"` |
| 주입 방식 | `initialValue={{ ...initialFilterState, subCategory: initialSubCategory }}` |
| 금지 1 | **`initialFilterState` 상수 자체를 수정하지 않는다** — `ProductSearch.tsx`와 다수 테스트가 이 상수를 그대로 쓴다. 반드시 spread 주입 |
| 금지 2 | **`useEffect` + `dispatch`로 마운트 후 주입하지 않는다** — "전체가 잠깐 보였다가 필터링되는" flash가 생겨 REQ-4 acceptance("추가 클릭 없이 이미 필터링된 상태")를 사실상 위반한다. 반드시 `initialValue` 경로로만 |

- `initialFilterState`는 지금 `subCategory: "all"` 하드코딩이지만, `ProductFilterProvider`가 이미 `initialValue` prop을 받는 구조(`createStateContext`)라 **context/reducer/상수는 한 줄도 안 고친다.**
- `ProductFilters`의 칩(`getSubCategoryOptions(category, true)`)은 `state.subCategory === option.value`로 active 스타일을 결정하므로, 초기값만 주입하면 **"청첩장" 칩이 자동으로 눌린 상태로 그려진다** → REQ-4 acceptance("추가 클릭 없이 이미 필터링된 상태") 충족.
- `page.tsx`에 `searchParams`를 추가해도 렌더 모드 회귀는 없다 — 이 페이지엔 `generateStaticParams`/`revalidate`가 없고 이미 매 요청 DB를 타는 동적 렌더다.
- Next.js 16이므로 `searchParams`는 `params`와 마찬가지로 **Promise**다: `searchParams: Promise<{ [key: string]: string | string[] | undefined }>`.

### 4.3 상태 전이표

진입점: Home의 `SubCategoryNavItem` 클릭(또는 URL 직접 입력/북마크).

| # | 현재 상태 | 트리거/조건 | 다음 상태 | 화면 | 담당 레이어 |
| --- | --- | --- | --- | --- | --- |
| T-0 | Home 렌더됨 | 아이템 클릭(`<Link>`) | 네비게이션 개시 | 프로젝트에 `loading.tsx`가 0개라 **RSC 응답 도착 전까지 Home이 그대로 보인다**(브라우저 탭 스피너만). §6 미해결 쟁점 1 | Next Router |
| T-1 | 네비게이션 중 | `isProductCategory(category)` 실패 | **404** | 루트 `not-found.tsx` | RSC (기존 로직) |
| T-2 | 네비게이션 중 | `getAllProductsService` throw | **에러** | `(main)/(products)/error.tsx`("상품 페이지 오류" + 다시 시도/홈으로) | error boundary (기존) |
| T-3 | 네비게이션 중 | 파라미터 유효(`wedding`) | 목록 렌더, `subCategory="wedding"` | 청첩장 칩 active + 필터된 그리드 | RSC → Provider `initialValue` |
| T-4 | 네비게이션 중 | 파라미터 없음/무효/배열/`all` | 목록 렌더, `subCategory="all"` | "전체" 칩 active + 전량 그리드. **에러 표시 없음**(§2 확정 — "잘못된 파라미터" 에러 상태를 만들지 않는다) | 〃 |
| T-5 | T-3 상태 | 해당 서브카테고리 상품 0건 | **빈 상태** | `ProductGrid` 기존 빈 상태("상품을 준비 중에 있습니다"). 칩이 active라 필터 때문이란 게 화면에서 읽힌다 | `useVisibleProducts` (무수정) |
| T-6 | T-3 상태 | 사용자가 "전체" 칩 클릭 | `subCategory="all"`, **URL은 `?subCategory=wedding` 유지** | 전량 그리드. 새로고침하면 다시 wedding으로 복귀 | 단방향 동기화의 **의도된 동작**(api-designer 확정) — §6 항목 2 |
| T-7 | T-3 상태 | 사용자가 다른 칩 클릭 | 그 서브카테고리로 전환 (URL 미갱신) | 기존 동작 그대로 | 〃 |
| T-8 | T-3/T-5 상태 | 브라우저 뒤로가기 | Home 복귀 | 기존 동작 | Next Router |
| T-9 | T-3 상태 | 새로고침(F5) | T-3 재현 | URL이 진실의 원천이므로 딥링크 상태 그대로 복원 | RSC |

### 4.4 API 응답 shape ↔ 상태 매핑 (1:1)

| 서버가 주는 것 | shape | UI 상태 |
| --- | --- | --- |
| `getAllProductsService(category)` 성공 | `Product[]` (기존, **무변경**) | T-3 / T-5 (길이·필터 결과에 따라) |
| `getAllProductsService` throw | `Error` | T-2 (error boundary) |
| `isProductCategory` 실패 | — | T-1 (`notFound()`) |
| `searchParams.subCategory` 검증 결과 | `SubCategory \| "all"` (`initialSubCategory`) | T-3 / T-4 |

**api-designer 확정: 서버사이드 필터링은 명시적으로 기각.** `getAllProductsService`의 인자·응답 필드가 전부 그대로이며 UI가 새로 렌더할 필드도 없다.

- 기각 근거(api-designer): 서버가 `wedding`만 실어보내면 화면의 "전체"/"돌잔치" 필터 버튼이 눌렀을 때 **빈 화면**이 된다 — 기존 기능 회귀다. 클라이언트 필터가 전량 배열 위에서 도는 현 구조가 유지돼야 필터 UI가 의미를 갖는다.
- 따라서 T-5의 빈 상태 문구도 분기하지 않고 `ProductGrid`의 기존 공용 문구를 그대로 쓴다 — **신규 UI 0개.**

---

## 5. 폼 유효성 규칙

### 5.1 폼 없음

이번 기능에는 사용자 입력 폼이 존재하지 않는다(링크 클릭이 유일한 인터랙션). 따라서 `src/shared/schemas/request/`의 폼 스키마를 클라이언트에서 재사용하는 케이스도, 새로 만들 케이스도 없다 — **zod 스키마 신규 추가 0개**(api-designer 확정, §2.4).

검증 대상은 "URL 쿼리 파라미터" 하나뿐이며 규칙은 §2.4 표에 정의했다. 중복 정의 금지 원칙은 그대로 지켜진다 — 판정 기준이 `isSubCategory()`(taxonomy 단일 소스인 `category.ts` 소속) 하나로 모여 있고, `page.tsx`가 자체 문자열 비교를 새로 쓰지 않기 때문이다.

### 5.2 스타일/접근성 제약 (구현자 필독)

| 항목 | 규칙 | 이유 |
| --- | --- | --- |
| **`md:`/`lg:` 브레이크포인트 금지** | 이 신규 컴포넌트에는 뷰포트 브레이크포인트를 **하나도 쓰지 않는다**. 480px 단일 레이아웃으로 작성 | `(main)/layout.tsx`가 `max-w-[480px]` 캡을 걸었지만 Tailwind `md:`는 여전히 실제 뷰포트 폭으로 발동한다 — TODO.md Phase 1의 "알려진 이슈"(EcommerceHero 붕괴 재현됨). 신규 컴포넌트가 같은 부채를 새로 만들지 않게 원천 차단 |
| 가로 스크롤 | `flex ... overflow-x-auto` + 각 아이템 `shrink-0` | REQ-3 acceptance. 아이템 2개일 땐 실제로 스크롤이 안 생기지만(480px에 충분히 들어감) 늘어나면 자동으로 옆으로 이어붙는다 — 그게 이 레이아웃을 고른 이유 |
| 스냅 | `snap-x snap-mandatory` + 아이템 `snap-start` (선택) | 아이템 수가 적어 필수는 아님. 넣어도 CSS만이라 비용 0 |
| 스크롤바 | 프로젝트에 `scrollbar-hide` 유틸리티가 없다 — 숨기려면 `globals.css`에 유틸 추가가 필요하므로 **이번 스코프에선 기본 스크롤바 유지**를 권장 | 신규 전역 CSS 유틸 도입은 별건 |
| 시맨틱 | `<nav aria-label="서브카테고리 바로가기">` > `<ul>` > `<li>` > `<Link>` | 길찾기 랜드마크. 스크린리더에서 "목록 2개 항목"으로 읽힘 |
| 아이콘 | `aria-hidden` 처리하고 텍스트 라벨(청첩장/돌잔치)로 접근명을 준다 | 아이콘만으론 의미 전달 불가 |
| 터치 타깃 | 아이템 최소 44×44px | 모바일 폭 전제 화면 |
| 아이콘 색 | 서브카테고리별 색 하드코딩 금지 — 단일 톤 사용 | 색까지 매핑하면 lookup map이 하나 더 늘고 §3.3의 "안 고쳐도 되게" 비용이 커진다 |

---

## 6. 확정된 트레이드오프 / 남은 확인 사항

### 6.1 협의로 확정된 것 (더 논의 불필요)

| # | 쟁점 | 결론 | 확정 주체 |
| --- | --- | --- | --- |
| 1 | 쿼리 파라미터명/타입 | `subCategory`, enum key 단일값 | api-designer (1라운드 합의) |
| 2 | URL→필터 동기화 스코프 | **단방향만**(진입 시점 1회). 양방향(칩 클릭 시 `router.replace`)은 제외 | api-designer |
| 3 | 무효값 처리 | 조용히 `"all"` 폴백, 404/에러 상태 없음 | api-designer |
| 4 | 서버 응답 shape | 무변경, 서버사이드 필터링 기각 | api-designer |
| 5 | 신규 zod 스키마 | 만들지 않음, `isSubCategory()` 재사용 | api-designer |
| 6 | **무변환 규칙** | `SUB_CATEGORY_MAP` 원소를 변환 없이 그대로 href/아이콘 key에 사용 (§2.3) | db-migrator 제기 → api-designer 계약 §4.2 |
| 7 | HomeTemplate 내 배치 순서 | Hero 바로 다음, Phase 4보다 위 (§3.5) | **리더 승인** |
| 8 | 신규 컴포넌트 배치 위치 | `(main)/_components/`. 기존 `organisms/` Home 섹션 4개는 이동하지 않음 (§3.4) | **리더 승인** |

**#2의 의도된 부작용(양측 합의로 허용)**: 진입 후 사용자가 필터를 바꿔도 URL은 그대로 남고, 새로고침하면 URL의 서브카테고리로 되돌아간다(T-6/T-7). 버그 리포트로 올라오지 않도록 여기에 기록해둔다 — 뒤로가기 히스토리 정책까지 새로 정해야 하는 양방향 동기화는 REQ-4 acceptance(진입 시점 1회)를 넘어서는 범위다.

### 6.2 남은 확인 사항

1. **네비게이션 중 로딩 표시 없음(T-0)** — 프로젝트 전체에 `loading.tsx`가 0개이며 `src/app/CLAUDE.md`는 "필요해지면 그때 기준을 추가한다"고 유보 중이다. 이번 기능이 Home→목록 이동을 처음으로 눈에 띄게 만들지만, **로딩 규약 신설은 이번 스코프 밖**으로 둔다(단일 라우트에 `loading.tsx`를 넣으면 프로젝트 전체 규약을 이 PR에서 정하는 셈이 된다). 목록 페이지 체감 지연이 실제 문제로 확인되면 별도 이슈로.
2. **REQ-1 선행 의존(구현 순서 제약)** — `subCategoryIcons`가 `Record<SubCategory, LucideIcon>`이라, REQ-1(vip/business 제거)이 먼저 반영돼야 아이콘 4개를 채우라는 컴파일 에러가 안 난다. **구현 순서: REQ-1 → REQ-3.**
3. **Phase 4 착수 시 인계 사항(미결 아님)** — 이번 PR로 Hero 바로 다음 자리는 이 섹션이 차지한다(리더 승인). TODO.md Phase 4의 "Hero 바로 다음" 문구는 §3.5 기준으로 "nav 띠 아래"로 읽는다.

> 설계 승인 상태: api-designer 계약 합의 완료 → 리더가 3개 산출물(api/ui/db) 정합성 검토 완료, **Phase 1 승인**. 이 문서는 구현 착수 가능 상태다.

---

## 7. 구현 체크리스트 (핸드오프용)

| # | 파일 | 작업 | REQ |
| --- | --- | --- | --- |
| 1 | `src/app/(main)/_constants/subCategoryIcons.ts` | 신규 — `Record<SubCategory, LucideIcon>` | REQ-3 |
| 2 | `src/app/(main)/_constants/index.ts` | 신규 — 배럴 | REQ-3 |
| 3 | `src/app/(main)/_components/SubCategoryNavItem.tsx` | 신규 — 아이콘+라벨+`<Link>`, RSC | REQ-3/4 |
| 4 | `src/app/(main)/_components/SubCategoryNavSection.tsx` | 신규 — `SUB_CATEGORY_MAP[category]` 순회, 가로 스크롤, RSC | REQ-3 |
| 5 | `src/app/(main)/_components/index.tsx` | 배럴에 섹션 추가 | REQ-3 |
| 6 | `src/app/(main)/_components/HomeTemplate.tsx` | `<EcommerceHero />` 다음 줄에 섹션 삽입 (§3.5) | REQ-3 |
| 7 | `src/app/(main)/_components/HomeTemplate.test.tsx` | 기존 `vi.mock`이 organisms 배럴만 모킹 중 — 새 섹션은 로컬 파일이라 별도 mock 또는 실렌더 필요. **기존 5개 테스트 회귀 주의** | REQ-3 |
| 8 | `src/shared/constants/routes.ts` | `byCategory(category, subCategory?)` 확장 (§2.2) | REQ-4 |
| 9 | `.../products/[category]/page.tsx` | `searchParams`(Promise) 수신 → `isSubCategory` 검증 → `initialSubCategory` 전달 (§2.4) | REQ-4 |
| 10 | `.../products/_components/ProductCatalog.tsx` | `initialSubCategory` prop 통과(이름 동일) | REQ-4 |
| 11 | `src/client/components/organisms/ProductCatalog.tsx` | `initialValue={{ ...initialFilterState, subCategory: initialSubCategory }}` | REQ-4 |

**무수정 확인**: `context/productFilter/*`(`initialFilterState` 상수 포함 — 수정 금지), `ProductFilters.tsx`, `ProductGrid.tsx`, `useVisibleProducts.ts`, `getAllProductsService`, `src/shared/schemas/**`(신규 zod 스키마 0개).

**검증 시 필수 확인 3가지**

1. **돌잔치 경로까지 실목록 도달 확인** — `/products/invitation?subCategory=first-birthday`가 실제로 필터링된 목록을 보여주는지. `wedding`만 확인하면 케밥/카멜 불일치 버그를 100% 놓친다(§2.3).
2. **flash 없음** — 첫 페인트부터 필터가 적용돼 있어야 한다. "전체가 잠깐 보였다가 필터링" = `useEffect` 주입 흔적, REQ-4 acceptance 위반(§4.2).
3. **기존 링크 무회귀** — `navigation.ts`의 `MAIN_NAV_ITEMS`, `SearchEmptyState.tsx`가 쓰는 `routes.products.byCategory("invitation")`(단일 인자)가 `/products/invitation` 그대로여야 한다.
