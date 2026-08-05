# 01_api_contract.md — 서브카테고리 진입 섹션 (REQ-3 / REQ-4)

> 작성: api-designer-subcat
> 대상: REQ-4(딥링크 도달) 계약. REQ-1/REQ-2(category.ts 리팩토링)는 이 문서의 값 원천이자 전제.
> 근거 문서: `src/server/boundary.ts`, `docs/ERROR_HANDLING.md`, `docs/DATA_ACCESS.md`, `src/shared/schemas/CLAUDE.md`, `src/app/api/CLAUDE.md`

---

## 1. 결론 — 신규 엔드포인트 없음

**신규 API 엔드포인트(route.ts)도 신규 Server Action도 만들지 않는다. 기존 페이지 `/products/[category]`에 쿼리 파라미터 `subCategory`를 얹어 클라이언트 필터의 초기값으로 주입하는 것으로 처리한다.**

신규 채널 A/B 표면이 0개이므로 `{ success, data }` / `{ success, error }` envelope 신규 인스턴스도 0개다. 기존 `/api/products`, `/api/products/search`의 요청·응답 shape은 **무변경**이다.

---

## 2. 왜 신규 엔드포인트가 불필요한가 (코드 근거)

`/products/[category]`는 이미 "카테고리 전량 서버 조회 → 클라이언트 메모리 필터" 구조이고, subCategory 필터는 **그 클라이언트 필터의 한 축으로 이미 완성되어 동작 중**이다. 서버가 새로 계산해줄 것이 없다.

| 지점 | 파일 | 현재 상태 |
| --- | --- | --- |
| 서버 조회 | `src/app/(main)/(products)/products/[category]/page.tsx` | `getAllProductsService(category)` — 카테고리 전량 조회. `searchParams` 안 받음 |
| 서비스 | `src/server/services/product.service.ts:123` | `category`만 쿼리 조건으로 받음(`subCategory` 조건 없음) |
| Provider 마운트 | `src/client/components/organisms/ProductCatalog.tsx:49` | `<ProductFilterProvider initialValue={initialFilterState}>` — **초기값 주입 지점이 이미 prop으로 열려 있음** |
| 초기 state | `src/client/context/productFilter/reducer.ts:7` | `subCategory: "all"` 하드코딩 |
| 실제 필터링 | `src/client/hooks/useVisibleProducts.ts` | `state.subCategory === "all" \|\| item.subCategory === state.subCategory` — **이미 구현되어 있음** |

즉 REQ-4 acceptance("추가 클릭 없이 이미 필터링된 상태")는 `initialFilterState.subCategory`의 하드코딩 `"all"`을 URL에서 읽은 값으로 갈아끼우는 것만으로 충족된다. 서버 왕복도, 새 응답 필드도 필요 없다.

`docs/DATA_ACCESS.md` 표 기준으로도 이 기능은 **row 1(서버 렌더 시점 데이터 — services 직접 import)** 에 그대로 머문다. row 2(mutation)도 row 3(브라우저 캐싱 필요 조회)도 아니다.

---

## 3. 검토 후 기각한 대안

| 대안 | 기각 사유 |
| --- | --- |
| **A. `/api/products/search?q=청첩장` 재사용** | 요구사항 `background`가 이미 지적한 대로, 이 엔드포인트는 자유 텍스트 `q`를 title/카테고리 라벨/서브카테고리 라벨에 **부분일치 `$or`** 로 매칭한다(`product.service.ts:141~`). 상품명에 "청첩장"이 들어간 다른 서브카테고리 상품이 딸려오는 오탐이 구조적으로 발생한다. 딥링크는 정확한 enum key 기반이어야 한다. **금지.** |
| **B. `/api/products?category=invitation&subCategory=wedding` 신설/확장** | 새 조회 표면을 만들어도 소비자가 없다. 목록 페이지는 Server Component가 services를 직접 부르는 row 1 경로이고(`DATA_ACCESS.md`), 브라우저는 이 목록을 `useSWR`로 다시 안 가져온다. 쓰는 사람 없는 엔드포인트 추가는 순수 부채. |
| **C. 서버사이드 필터링 (`getAllProductsService(category, subCategory)`)** | **기능적으로 회귀를 만든다.** 서버가 wedding만 실어 보내면 클라이언트 필터의 "전체"/"돌잔치" 버튼을 눌렀을 때 화면이 비어버린다(메모리에 그 데이터가 없으므로). 현재 필터 UI 전체가 "카테고리 전량이 클라이언트에 있다"를 전제로 동작한다. 서버 필터링을 하려면 필터 UI 전체를 서버 왕복 구조로 재설계해야 하고 이는 이번 스코프를 훨씬 초과한다. **기각.** |

---

## 4. 확정 계약 — 쿼리 파라미터

### 4.1 파라미터 정의

| 항목 | 확정값 |
| --- | --- |
| 위치 | `/products/[category]` 페이지의 query string |
| 이름 | **`subCategory`** (camelCase 고정, snake_case·축약형 금지) |
| 타입 | `SubCategory` 유니온 값 = enum key 문자열 |
| 허용값 | REQ-1 이후 `"wedding"` \| `"first-birthday"` — **원천은 `SUB_CATEGORY_MAP` / `SubCategory`, 하드코딩 나열 금지** |
| 카디널리티 | 단일값. 반복 파라미터(`?subCategory=a&subCategory=b`)도 CSV(`a,b`)도 지원하지 않음 |
| 필수 여부 | optional |
| 값 형식 | **enum key만.** 라벨("청첩장")·라벨 인코딩 금지 (대안 A와 같은 오탐 사유) |

`subCategory`로 이름을 고정하는 이유 — 이미 네 지점이 전부 이 이름이라 매핑 레이어가 생기지 않는다:

- DB 필드: `src/server/models/product.model.ts:90` → `subCategory`
- 응답 스키마: `src/shared/schemas/response/product.schema.ts:17` → `subCategory`
- 클라 필터 state 키: `src/client/context/productFilter/type.ts:6` → `subCategory`
- 상품 등록 입력 스키마: `src/shared/schemas/request/product.schema.ts` → `subCategory`

### 4.2 URL 형태

```
/products/invitation?subCategory=wedding          → 청첩장으로 사전 필터링됨
/products/invitation?subCategory=first-birthday   → 돌잔치로 사전 필터링됨
/products/invitation                              → 필터 미적용(전체)
```

링크 생성 측(REQ-3 Home 섹션)은 `SUB_CATEGORY_MAP`을 순회하면서 **`{ 카테고리 key, 서브카테고리 key }` 쌍으로 href를 조립한다** — 경로 세그먼트도 쿼리값도 하드코딩하지 않는다.

**조립 지점은 컴포넌트 안 문자열 템플릿이 아니라 `src/shared/constants/routes.ts`의 경로 빌더 확장이다** (ui-designer 제안, 채택):

```ts
// src/shared/constants/routes.ts — 기존 byCategory 확장
byCategory: (category: string, subCategory?: SubCategory) =>
  subCategory ? `/products/${category}?subCategory=${subCategory}` : `/products/${category}`,
```

빌더로 가는 이유 — `src/shared/constants/CLAUDE.md` L24가 "라우트 경로 문자열을 소비처에 리터럴로 흩어 쓰지 않는다, 동적 세그먼트는 문자열 템플릿이 아니라 경로 빌더 함수로 제공한다"를 이미 규정한다. 이 계약이 요구하는 "하드코딩 금지"와 "무변환"은 그대로 충족된다(`category`는 prop, `subCategory`는 `SUB_CATEGORY_MAP` 순회값을 변환 없이 그대로 끼움). 부수 효과로 파라미터명이 바뀌어도 수정 지점이 `routes.ts` 한 곳으로 국한된다.

- optional 인자라 기존 단일 인자 호출부(`navigation.ts`, `SearchEmptyState.tsx`)는 무회귀 — 다만 회귀 확인 대상으로 남긴다.
- **인자 부재 시 파라미터 자체를 안 붙이는 분기가 §4.3의 "부재 = 전체(정규형)"와 정확히 일치한다** — 빌더가 `?subCategory=all`을 생성할 경로가 구조적으로 없다.
- **두 번째 인자 타입은 `subCategory?: SubCategory`로 고정한다(확정, ui-designer 수용 완료).** `string`이 아니라 `SubCategory`여야 `firstBirthday` 같은 오타가 컴파일 타임에 잡혀 아래 **무변환 규칙이 문서 조항이 아니라 타입으로 강제**된다 — 하이픈 유실 버그를 정적으로 막는 유일한 지점이다. 기존 `category: string`은 현행 유지(이번 변경과 무관, surgical).

#### 무변환 규칙 (필수)

**`SUB_CATEGORY_MAP`의 원소를 어떤 문자열 변환도 거치지 않고 그대로 싣는다.** 케밥↔카멜 변환 유틸, `toLowerCase()`, slugify, 커스텀 정규화 전부 금지. 파싱 측(`page.tsx`)도 `searchParams` 원본 문자열을 그대로 `isSubCategory()`에 넘긴다.

이 규칙이 깨졌을 때의 실패 모드가 이번 설계에서 가장 진단하기 나쁘다:

- 이 설계는 서버 쿼리가 아니라 `useVisibleProducts`의 **문자열 등치 비교**(`item.subCategory === state.subCategory`)로 필터링한다.
- URL 값과 DB 저장값이 한 글자라도 어긋나면 **에러 없이 빈 목록**만 나온다. 예외도 로그도 없고 DB explain으로도 추적되지 않는다.
- 구체적 위험 지점은 **`first-birthday`의 하이픈**이다. 중간에 카멜 변환이 끼면 `firstBirthday`가 되어 조용히 0건이 된다. `wedding`은 변환에 불변이라 이 버그는 청첩장 경로에서 안 드러나고 돌잔치 경로에서만 터진다 — 부분 통과로 놓치기 쉽다.

DB 측이 보증하는 범위는 "저장값은 `SUB_CATEGORY_MAP` 원소와 문자 단위로 동일하다"까지다(`product.model.ts`의 `.includes()` validator가 쓰기 시점에 강제). 링크 생성·파싱 양측이 무변환을 지키면 **URL = DB = 클라 state가 모두 `SUB_CATEGORY_MAP` 한 상수에서 나온 동일 문자열**이 되어 등치 비교가 구조적으로 보장된다.

> boundary-verify 체크 포인트: 청첩장뿐 아니라 **돌잔치(`first-birthday`) 경로도 실목록 도달까지 반드시 확인**할 것. 하이픈 유실은 wedding 경로에서 드러나지 않는다.

### 4.3 부재 / 무효값 정책 (확정)

**한 줄 규칙: 해석 가능한 값이 아니면 전부 `"all"`(전체)로 귀결한다. 404도 아니고 에러 화면도 아니다.**

| 입력 | 결과 |
| --- | --- |
| 파라미터 부재 | `"all"` — 필터 미적용. **이것이 "전체"의 정규(canonical) 형태다** |
| `?subCategory=wedding` (유효) | `"wedding"` |
| `?subCategory=all` | `"all"` — 소비 측은 수용하되, **링크 생성 측은 이 형태를 절대 만들지 않는다**(전체는 파라미터 생략으로 표현) |
| `?subCategory=vip` (REQ-1에서 제거된 값) | `"all"` — 조용히 무시 |
| `?subCategory=asdf` / 빈 문자열 / 반복 파라미터 | `"all"` — 조용히 무시 |

근거:

- 경로 세그먼트 `[category]`는 **리소스 식별자**라 무효 시 `notFound()`가 맞다(현행 유지). 쿼리 파라미터 `subCategory`는 **뷰 옵션**이라 무효여도 페이지 자체는 존재한다 — 404로 승격시키지 않는다.
- Server Component 렌더 경로는 채널 A도 B도 아니라서 `{ success:false, error }` envelope을 **돌려줄 수단 자체가 없다**(`docs/ERROR_HANDLING.md` §채널 분리 규칙 — A는 함수 리턴값, B는 `Response`). 여기서 VALIDATION 에러를 만들려면 envelope 밖의 새 에러 표현을 발명해야 하는데, 그건 명시적 금지 사항이다.
- 따라서 **UI 쪽에 "잘못된 파라미터" 에러 상태를 새로 만들지 않는다.** 빈 상태 문구 분기도 필요 없다(무효값은 전체 목록으로 떨어지므로 결과가 비지 않는다).

### 4.4 검증 방식

**신규 zod 스키마 파일을 만들지 않는다.** 기존 `src/shared/utils/category.ts`의 타입가드 `isSubCategory()`를 그대로 쓴다.

```ts
// src/app/(main)/(products)/products/[category]/page.tsx
export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ subCategory?: string }>;
}) {
  const { category } = await params;
  if (!isProductCategory(category)) notFound();

  const { subCategory } = await searchParams;
  const initialSubCategory: SubCategory | "all" =
    subCategory && isSubCategory(subCategory) ? subCategory : "all";
  // ...
  <ProductCatalog products={products} category={category} initialSubCategory={initialSubCategory} />
}
```

zod를 안 쓰는 이유(의도적 판단, 누락 아님):

- `src/shared/schemas/`는 **폼/API 입력 검증과 Route Handler 응답**을 다루는 레이어다. 이번 입력은 그 어느 쪽도 아니다(RSC 렌더 파라미터).
- zod의 부가가치인 `fieldErrors` 생산·`validateAndFlatten` 경유 `AppError("VALIDATION")` 승격이 여기선 전부 무의미하다 — 4.3에 따라 무효값은 에러가 아니라 폴백이다.
- 값 원천 단일성(REQ-1 목표)은 `isSubCategory`가 이미 `subCategoryLabels` key에서 파생되므로 충족된다. 별도 zod enum을 두면 오히려 값 나열이 한 벌 더 늘어난다.
- 단일 optional enum 하나에 새 스키마 파일 + 배럴 export를 추가하는 건 과설계다(GUIDELINES §2).

**카테고리-서브카테고리 교차 검증(`SUB_CATEGORY_MAP[category].includes(sub)`)은 이번 스코프에서 제외한다.** 현재 카테고리가 `invitation` 하나뿐이라 `isSubCategory()`와 결과가 항상 동일해 순수 dead branch다. 두 번째 카테고리가 생기는 시점에 추가한다(쓰기 시점 교차 검증은 `product.model.ts:98~106`과 `request/product.schema.ts`의 `.refine`이 이미 담당하고 있어 데이터 정합성 자체는 이미 보호된다).

---

## 5. 데이터 흐름 계약 (경계면 3개)

```
Home 서브카테고리 섹션 (REQ-3)
  └─ href: `/products/${category}?subCategory=${sub}`        ← 경계 ①  파라미터 이름/값
       ↓
products/[category]/page.tsx  (Server Component)
  ├─ isProductCategory(category) 실패 → notFound()            (현행 유지)
  ├─ getAllProductsService(category)                          (인자 무변경)
  └─ isSubCategory(subCategory) ? subCategory : "all"
       ↓ prop: initialSubCategory: SubCategory | "all"        ← 경계 ②  prop 이름/타입
       ↓
_components/ProductCatalog.tsx (client 컨테이너) → organisms/ProductCatalog.tsx
  └─ <ProductFilterProvider initialValue={{ ...initialFilterState, subCategory: initialSubCategory }}>
                                                              ← 경계 ③  state 키 subCategory
       ↓
useVisibleProducts — 기존 로직 그대로, 코드 변경 없음
```

- **경계 ② prop 이름 확정: `initialSubCategory`** (타입 `SubCategory | "all"`). `page.tsx` → `_components/ProductCatalog.tsx` → `organisms/ProductCatalog.tsx` 세 단계 모두 같은 이름으로 통과시킨다.
- `initialFilterState` 자체는 수정하지 않는다 — 하드코딩 `"all"`은 기본값으로 남기고 spread로 덮어쓴다(`ProductSearch.tsx`, 다수 테스트가 이 상수를 그대로 쓰고 있어 값을 바꾸면 회귀).
- `useVisibleProducts` / `ProductGrid` / `ProductFilters`는 **수정 대상이 아니다.**

---

## 6. 인증 / 에러 카테고리 매핑

| 항목 | 결정 |
| --- | --- |
| 인증 요구 | **없음.** 상품 목록은 비로그인 공개 화면이고 현재도 `requireAuth()`를 안 탄다. `getAllProductsService`의 `userId`는 optional(`isLiked` 계산용)이며 이번 변경과 무관 |
| UNAUTHENTICATED / FORBIDDEN | 해당 없음 |
| VALIDATION | **해당 없음** — 4.3대로 무효 파라미터는 에러가 아니라 `"all"` 폴백. 새 VALIDATION 경로를 만들지 않는다 |
| NOT_FOUND | 기존 경로 세그먼트 검증(`isProductCategory` → `notFound()`)만 유지. 쿼리 파라미터로는 404를 내지 않는다 |
| INTERNAL | 기존과 동일 — `getAllProductsService` 내부 DB 실패는 현행 처리(page 레벨 `error.tsx`)를 그대로 따르며 이번 변경으로 추가되는 실패 지점 없음 |
| DISABLED / EXTERNAL_SERVICE | 해당 없음 |

신규 `AppError` throw 지점 없음, 신규 `routeError`/`actionError` 호출 지점 없음.

---

## 7. 스키마 변경 여부

| 파일 | 변경 |
| --- | --- |
| `src/shared/schemas/request/*` | **무변경** (신규 파일 없음 — §4.4 참고) |
| `src/shared/schemas/response/product.schema.ts` | **L16 `category`만 교체** — `z.enum(["invitation"])` → `z.enum(PRODUCT_CATEGORIES)` (리더 결정으로 REQ-2 범위 포함, §7.1). **L17 `subCategory`는 무변경.** 응답 shape·필드 구성 자체는 그대로이고 UI가 새로 렌더할 필드도 없음 |
| `src/shared/schemas/request/product.schema.ts` | REQ-2 범위에서 `category: z.enum(["invitation"])` → `z.enum(PRODUCT_CATEGORIES)` 교체만. **subCategory 관련 변경 없음** |

`response/product.schema.ts`의 **L17 `subCategory: z.string()`은 이번에 좁히지 않는다**(무변경). REQ-1/REQ-2 acceptance는 `category` enum만 대상으로 하고, 응답 스키마의 subCategory를 유니온으로 좁히면 DB에 남아있을 수 있는 과거 값에 대해 응답 파싱이 깨질 위험이 생긴다 — 별건으로 둔다. (db-migrator도 독립적으로 같은 결론: 과거 값이 응답 검증에서 튕기는 게 가장 진단하기 나쁜 실패 모드)

### 7.1 `response/product.schema.ts` — 인접한 두 줄, 정반대 처리 (리더 결정 확정)

**같은 파일 L16과 L17은 별개 건이고 처리 방향이 정반대다.** 인접 라인이라 한쪽 규칙을 다른 쪽에 옮겨 적용하기 쉬우니 아래 표대로만 처리한다.

| 라인 | 현재 | 처리 | 근거 |
| --- | --- | --- | --- |
| L16 `category` | `z.enum(["invitation"])` | **`z.enum(PRODUCT_CATEGORIES)`로 교체** | 값 집합이 `PRODUCT_CATEGORIES`와 **완전히 동일**한 동어반복 치환이라 **런타임 동작 변화가 0**. REQ-1 목적("값 배열이 원본")을 문자 그대로 달성하려면 리터럴 나열이 남으면 안 됨 |
| L17 `subCategory` | `z.string()` | **손대지 않는다** | 유니온으로 좁히면 값 집합을 **실제로 축소**하는 변경이라, DB에 남아있을 수 있는 과거 값(vip/business 등)에서 응답 파싱이 깨진다. 과거 값이 응답 검증에서 튕기는 건 가장 진단하기 나쁜 실패 모드(api-designer·db-migrator 독립적으로 동일 결론) |

**스코프 결정(리더, 확정)**: L16은 REQ-2 범위에 **포함**한다. REQ-2 acceptance 문구는 `product.model.ts`/`request/product.schema.ts` 2개 파일만 명시하지만, 이 파일이 `"invitation"` 리터럴의 **3번째 중복 지점**이라 함께 정리한다(db-migrator `01_db_schema.md` §9 #7에서도 동일 지적). 같은 결정이 db-migrator에게도 전달됨.

따라서 `"invitation"` 리터럴 제거 대상은 총 **3개 파일**이다(line 번호는 db-migrator `01_db_schema.md` §3-4와 동일):

1. `src/server/models/product.model.ts:87` → `enum: PRODUCT_CATEGORIES` — REQ-2 명시
2. `src/shared/schemas/request/product.schema.ts:8` → `z.enum(PRODUCT_CATEGORIES)` — REQ-2 명시
3. `src/shared/schemas/response/product.schema.ts:16` → `z.enum(PRODUCT_CATEGORIES)` — 리더 결정으로 추가

리더 판정 원문: "REQ-2 문구엔 없지만 취지(하드코딩 3곳 통합)에 정확히 부합하고, 값 집합 동일해 회귀위험 0".

> 구현 시 경고: 3번 항목은 **L16만** 바꾼다. 바로 아랫줄 **L17 `subCategory: z.string()`은 손대지 않는다.** db-migrator 문서 §3-3에도 같은 대비가 경고 블록으로 들어가 있다.

---

## 8. 즉시 응답 vs 비동기 결과

**전부 즉시(동기) 처리.** 비동기 결과 대기 구간 없음.

- 목록 데이터: 서버 렌더 시점에 이미 확보(`await getAllProductsService`) — 클라이언트 로딩 스피너/`useSWR` 재조회 없음.
- 초기 필터 적용: 첫 렌더의 `useReducer` 초기값으로 들어가므로 **"전체가 잠깐 보였다가 필터링되는" 깜빡임(flash)이 없어야 한다.** `useEffect`로 마운트 후 dispatch하는 방식은 이 flash를 만들므로 금지 — 반드시 `initialValue` 경로로 주입한다. (REQ-4 acceptance "추가 클릭 없이 이미 필터링된 상태"의 실질적 검증 포인트)

렌더링 모드 주석: `searchParams`를 읽으면 해당 라우트는 dynamic 렌더로 확정된다. 이 페이지는 이미 `dbConnect()` + `find()`를 매 요청 수행하는 uncached 경로라 실질적 성능/캐시 회귀는 없다(`export const revalidate` 미선언, `/products/[category]`).

---

## 9. 이번 스코프에서 명시적으로 제외

- **양방향 URL 동기화** (필터 버튼 클릭 시 `replaceState`로 URL 갱신). REQ-4는 진입 시점 1회만 요구한다. 양방향은 뒤로가기/히스토리 엔트리 정책을 새로 정해야 해서 범위가 커진다. → 제외. *결과적 동작*: 진입 후 사용자가 필터를 바꿔도 URL은 그대로 남는다. 새로고침하면 URL의 서브카테고리로 되돌아간다. 의도된 동작으로 기록한다.
- 서버사이드 서브카테고리 필터링 (§3-C 기각)
- 목록 페이지네이션 / 정렬 파라미터의 URL 반영
- `keyword`/`price`/`sortBy` 등 다른 필터 축의 URL 파라미터화 — 요청 범위 밖. 지금 `subCategory` 하나만 연다.

---

## 10. 동료 협의 결과

| 상대 | 쟁점 | 결론 |
| --- | --- | --- |
| db-migrator-subcat | 파라미터 이름 `subCategory`로 정렬 | **합의** — §4.1 |
| db-migrator-subcat | 라벨 아닌 enum key 사용 | **합의** — §4.1 |
| db-migrator-subcat | `all` 센티널 / 파라미터 부재 처리 | **확정** — 부재 = 전체(정규형), `all` 값도 수용하되 링크는 생성 안 함. §4.3 |
| db-migrator-subcat | 무효값 400 vs 무시 | **확정: 무시(→ all)**. 400을 낼 채널 자체가 없음. §4.3 |
| db-migrator-subcat | 신규 필드/인덱스 필요 여부 | **불필요.** subCategory로 DB 쿼리하지 않음(클라 메모리 필터). 인덱스 후보 없음 |
| ui-designer-subcat | 파라미터 이름/타입/카디널리티 | **확정** — `subCategory`, 단일값, enum key. §4.1 |
| ui-designer-subcat | 최소 스코프(초기값 주입만) / 양방향 제외 | **승인** — §5, §9 |
| ui-designer-subcat | 무효값 → `all` 폴백, 에러 상태 불필요 | **승인** — 상태 전이표에 에러 상태 넣지 않음. §4.3 |
| ui-designer-subcat | 응답 shape 변화 여부 | **무변경.** 빈 상태 문구 분기 불필요. §7 |
| db-migrator-subcat | 응답 스키마 L17 `subCategory` 좁히기 | **양측 독립적으로 "좁히지 않음" 결론 일치.** §7 |
| db-migrator-subcat | 하이픈 유실 → 무증상 빈 목록 리스크 제기 | **수용, 계약에 반영.** 무변환 규칙을 §4.2에 필수 조항으로 신설 + ui-designer에 전달 완료 |
| db-migrator-subcat | 응답 스키마 L16 `category` (3번째 중복) | **리더 결정: REQ-2 범위 포함 확정.** 교체 대상 3파일 — §7.1 |
| ui-designer-subcat | href 조립을 `routes.ts` 빌더로 이관 | **채택.** `constants/CLAUDE.md` L24 경로 빌더 규칙에 부합하고, 계약의 하드코딩 금지·무변환 요건을 그대로 충족 — §4.2 |
| ui-designer-subcat | 빌더 2번째 인자 타입 `SubCategory` | **확정(ui-designer 수용).** 무변환 규칙이 컴파일타임 강제로 승격 — §4.2 |

**미해결 쟁점: 없음.** 리더 판단 대기 건도 없음(§7.1 L16 스코프 건은 포함으로 확정 종결).
3라운드 도달 항목 없음 — 세 에이전트의 제안이 1라운드에서 일치했고, 이후 왕복은 전부 리스크 보강·스코프 확정이었다.

---

## 11. 구현자 체크리스트

1. `page.tsx`가 `searchParams: Promise<{ subCategory?: string }>`를 받고 `await`로 푼다 (`src/app/api/CLAUDE.md`의 params 비동기 규칙과 동일 계열).
2. `isSubCategory()` 통과 실패 시 `"all"` — `notFound()` 호출하지 않는다.
3. `initialSubCategory` prop 이름으로 `ProductCatalog` 두 층을 통과시킨다.
4. `ProductFilterProvider initialValue`에 spread로 주입한다. `initialFilterState` 상수 자체는 건드리지 않는다.
5. `useEffect` + dispatch 방식으로 초기 필터를 넣지 않는다(§8 flash).
6. Home 링크 href는 `routes.products.byCategory(category, sub)` 빌더로 조립한다(§4.2). 컴포넌트 안에서 경로 문자열 템플릿을 쓰지 않고, `wedding`/`first-birthday` 문자열도 직접 쓰지 않는다 — 값은 `SUB_CATEGORY_MAP` 순회에서 온다(REQ-3 acceptance).
7. **URL에 싣는 값에 어떤 문자열 변환도 적용하지 않는다**(케밥↔카멜, `toLowerCase()`, slugify 전부 금지). 파싱 측도 원본 문자열을 그대로 `isSubCategory()`에 넘긴다 — §4.2 무변환 규칙.
8. 동작 확인 시 **돌잔치(`first-birthday`) 경로를 반드시 포함**한다. 하이픈 유실 버그는 `wedding` 경로에서는 증상이 안 나타나고, 실패해도 에러 없이 빈 목록만 나온다.
