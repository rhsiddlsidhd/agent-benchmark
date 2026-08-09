# 01. API 계약 — 상품 검색 (feat/product-search)

> 작성: api-designer / Phase1
> 대상 요구사항: REQ-1 (REQ-3·REQ-4의 소비 계약 포함)
> 근거 문서: `src/server/boundary.ts`, `src/app/api/CLAUDE.md`, `src/server/services/CLAUDE.md`, `src/shared/schemas/CLAUDE.md`, `docs/DATA_ACCESS.md`, `docs/ERROR_HANDLING.md`
>
> **개정 이력**
> - v2 (현재) — 리더 정정 반영: 쿼리 파라미터는 **`q` 하나뿐**(별도 `category`/`subCategory` 필터 파라미터 없음). db-migrator 지적 반영: 라벨 역조회를 **부분일치**로 변경(정확일치면 "돌잔"이 "돌잔치"에 매칭 실패).
> - v1 — `q`/`category`/`subCategory` 3파라미터 안. 폐기.

---

## 0. 요약 (한눈에)

| 항목 | 값 |
| --- | --- |
| 경로 | `GET /api/products/search` |
| 채널 | **B (`route.ts`)** |
| 인증 | **불필요** (공개 엔드포인트) |
| 요청 | 쿼리스트링 **`q` 하나뿐**, optional |
| 응답 성공 | `200` + `{ success: true, data: ProductResponse[] }` — **배열 그대로, 래핑 없음** |
| 응답 실패 | `{ success: false, error: ErrorPayload }` |
| 에러 카테고리 | `VALIDATION`(400), `INTERNAL`(500) — 그 외 없음 |
| 즉시응답 / 비동기 | **즉시 응답(동기)**. 잡·폴링·웹훅 없음. 응답 본문에 최종 결과가 전부 들어있다 |
| 페이지네이션 | **없음 (v1)** |
| 신규 DB 필드 / 인덱스 | **없음** (db-migrator `01_db_schema.md`와 합의 완료) |

---

## 1. 채널 선택 근거 (채널 B = `route.ts`)

`docs/DATA_ACCESS.md`의 3분기표 기준:

- row 3 — **"브라우저가 캐싱/재검증(dedupe, revalidate) 필요한 조회(GET)" → `route.ts` + `fetcher`(`useSWR`)**.
- REQ-3이 `/search` 페이지에서 `useSWR` + `fetcher`로 호출하도록 명시했고, 검색어 입력마다 반복 호출되는 조회라 dedupe/revalidate가 실제로 필요하다. row 1(Server Component 직접 import)은 검색어가 클라이언트 상태라 해당 없고, row 2(Server Action)는 mutation이 아니라 해당 없다.
- 기존 `GET /api/products`(`src/app/api/products/route.ts`)와 정확히 같은 성격이라 그 패턴을 그대로 따른다.

### 신규 생성이 맞는가 (재사용 우선 검토)

- `src/app/api/` 전수 확인 결과 검색 엔드포인트는 **존재하지 않는다**.
- `GET /api/products`는 `category` **완전일치 필터**만 지원한다(`getAllProductsService`의 `query.category = category`). title 부분일치도, 라벨 역조회도, `$or` 결합도 없다. 기존 라우트에 검색 분기를 끼워 넣으면 "필터"와 "검색"이라는 의미가 다른 두 동작이 한 핸들러에 섞이므로 **신규 세그먼트로 분리**한다.
- 라우팅 충돌 없음: `src/app/api/products/` 아래에 동적 세그먼트(`[id]` 등)가 없어 `search` 정적 세그먼트가 안전하다.
- 파라미터명 `q`는 신조어가 아니다 — `src/app/api/couple-info/route.ts`가 이미 `searchParams.get("q")`를 쓴다.

---

## 2. 요청 계약

### 2.1 쿼리 파라미터

| 이름 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `q` | string | optional | 검색어. **이것 하나가 title·category·subCategory 세 축에 동시에 적용된다** |

**`category`/`subCategory` 쿼리 파라미터는 존재하지 않는다.** (리더 정정 사항 — v1 초안에 있던 것을 제거했다.) 검색창이 1개이므로 사용자 입력은 `q` 하나이고, 그 하나를 서버가 세 축으로 펼쳐 `$or`로 합친다. 별도 필터 UI가 실제로 생기는 시점에 파라미터를 추가할지 재설계한다 — 지금 쓰이지 않는 파라미터를 미리 계약에 넣지 않는다.

- 필드명은 camelCase 원칙을 따른다(현재 파라미터가 `q` 하나라 다단어 케이스는 없음). snake_case 유입 금지.

### 2.2 Edge case 정의 (구현자가 임의 판단하지 말 것)

| 케이스 | 동작 |
| --- | --- |
| 파라미터 자체가 없음 (`/search`) | `undefined` → **`200` + `data: []`** |
| 빈 문자열 (`?q=`) | `undefined`와 동일 취급 → `200` + `[]` |
| 공백만 (`?q=%20%20`) | `trim()` 후 빈 문자열 → `undefined`와 동일 취급 → `200` + `[]` |
| 같은 키 중복 (`?q=a&q=b`) | `searchParams.get()`이 첫 번째만 반환 — 첫 값 사용, 별도 에러 없음 |
| `q` 101자 이상 | **`400` `VALIDATION`** (§4.2) |
| `q`에 regex 메타문자 포함 (`.*`, `(`, `[` 등) | **리터럴 문자로 취급.** 이스케이프 필수 — 안 하면 패턴 컴파일 에러로 500 (§3.3) |
| `q` 1글자 (`?q=비`) | title regex는 적용, **라벨 역조회는 적용 안 함**(2글자 미만, §4.3) |
| `q`가 어떤 라벨과도 안 겹침 (`?q=웨딩드레스`) | 에러 아님. title regex 조건만 남고 정상 조회 |

### 2.3 zod 스키마 (작성 완료)

**`src/shared/schemas/request/productSearch.schema.ts`** — 실제 파일 작성 + 배럴 등록 + 테스트 통과(10 케이스) 완료.
(폴더 = `request/`, 파일명 camelCase — `coupleInfo.schema.ts`/`premiumFeature.schema.ts` 선례를 따름. `src/shared/schemas/CLAUDE.md` Structure)

```ts
import * as z from "zod";

// 빈 문자열/공백만 입력은 "조건 없음"과 동일하게 다뤄야 한다.
// trim 후 빈 문자열이면 undefined로 정규화해서, 서비스가 조건 유무만 보고 분기할 수 있게 한다.
const searchTermSchema = z
  .string()
  .trim()
  .max(100, { message: "검색어는 100자 이하로 입력해주세요." })
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

export const productSearchRequestSchema = z.object({
  q: searchTermSchema,
});

export type ProductSearchRequest = z.infer<typeof productSearchRequestSchema>;
```

- 소비처는 `@/shared/schemas`로만 import한다(개별 경로로 import하면 `config.ts`의 한국어 로케일 side-effect를 안 탄다 — `src/shared/schemas/CLAUDE.md` Gotchas).
- **검증 위치는 `route.ts`(채널 경계)**다. `src/server/services/CLAUDE.md`: "services 호출 시점엔 이미 zod 검증을 통과한 데이터"이므로 서비스는 재검증하지 않는다.
- **응답 스키마는 신규 정의하지 않는다** — 기존 `src/shared/schemas/response/product.schema.ts`의 `productsResponseSchema`를 그대로 재사용한다(§5.1).

---

## 3. 서비스 계약

### 3.1 시그니처

신규 함수 — **`src/server/services/product.service.ts`에 추가**(도메인당 파일 1개 원칙, 새 파일 만들지 않는다).

```ts
export const searchProductsService = async (
  q?: string,
  userId?: string,
): Promise<ProductJSON[]>
```

- 위치 인자 2개 형태는 **바로 옆 `getAllProductsService(category?, userId?)`와 동일한 모양**이다 — 같은 파일 안에서 형태가 갈리지 않게 맞췄다.
- 반환 타입 `ProductJSON[]` — `getAllProductsService`와 동일. `transformProduct`를 그대로 재사용한다.
- `userId`는 `isLiked` 계산용으로 시그니처에 열어두되 **v1 `route.ts`는 넘기지 않는다**(§5.3).

### 3.2 MongoDB 쿼리 구성 (구체 로직)

```ts
export const searchProductsService = async (
  q?: string,
  userId?: string,
): Promise<ProductJSON[]> => {
  const term = q?.trim();

  // 검색어가 없으면 DB를 치지 않고 즉시 빈 배열.
  // 이 가드가 없으면 $or가 빈 배열이 되는데, MongoDB는 이를 거부한다
  // ("$or/$and/$nor must be a nonempty array") — 정상 흐름이 500으로 둔갑한다.
  if (!term) return [];

  const or: Record<string, unknown>[] = [
    // (1) title 부분일치 — 대소문자 무시. 사용자 입력은 반드시 이스케이프.
    { title: { $regex: escapeRegExp(term), $options: "i" } },
  ];

  // (2) 같은 검색어를 카테고리 라벨로도 역조회 — 부분일치, 매칭된 enum key를 $in으로.
  const categoryKeys = findProductCategoriesByTerm(term);
  if (categoryKeys.length > 0) {
    or.push({ category: { $in: categoryKeys } });
  }

  // (3) subCategory도 동일
  const subCategoryKeys = findSubCategoriesByTerm(term);
  if (subCategoryKeys.length > 0) {
    or.push({ subCategory: { $in: subCategoryKeys } });
  }

  await dbConnect();

  const products = await ProductModel.find({ deletedAt: null, $or: or })
    .sort({ isFeatured: -1, priority: -1, createdAt: -1 })
    .lean();

  return products.map((p) => transformProduct(p, userId));
};
```

**결합 방식 명시**: 최종 쿼리는 `{ deletedAt: null, $or: [...] }` — 즉 **`deletedAt: null` AND (title 매치 OR category 매치 OR subCategory 매치)**이다.
- `deletedAt`을 `$or` **안에 넣지 않는다** — 넣으면 삭제된 상품이 새어 나온다.
- `$or` 배열은 title 조건으로 항상 최소 1개가 보장되고, category/subCategory는 **매칭된 게 있을 때만 동적 push**한다. 절대 빈 배열로 `find()`에 들어가지 않는다.

**`$in`을 쓰는 이유**: 부분일치 역조회 결과는 0개·1개·복수 모두 가능하다(예: `q="ㅇ"`류가 여러 라벨에 걸릴 수 있음). `$in`이면 개수와 무관하게 한 가지 형태로 처리된다.

**규약 준수**:
- `dbConnect()`를 쿼리 직전 호출 (`src/server/services/CLAUDE.md`). early return 경로에서는 커넥션을 열지 않는다.
- `transformProduct`로 매핑하지만 원본 Document 메서드가 필요 없으므로 `.lean()` 사용 — `getAllProductsService`와 동일
- 정렬은 `getAllProductsService`와 동일 (`isFeatured` → `priority` → `createdAt` 전부 desc)
- **`status` 필터는 걸지 않는다** — REQ-1이 "`getAllProductsService`와 동일하게 `deletedAt:null`"로 명시했고, 실제로 `getAllProductsService`도 `status`를 안 거른다. 검색만 `status: "active"`를 추가하면 목록과 검색 결과가 어긋난다 (§9 미해결 쟁점 1)

### 3.3 regex 이스케이프 (필수, 생략 금지)

사용자 입력이 `$regex`에 그대로 들어가면 세 가지가 깨진다:
1. `(`, `[`, `*` 같은 문자로 **패턴 컴파일 자체가 실패**해 정상 검색이 500 `INTERNAL`이 된다 (db-migrator 지적 사항)
2. `.` `*` `+` `?`가 메타문자로 해석돼 **의도와 다른 결과**가 나온다 (`"a.b"` 검색이 `"axb"`에 매칭)
3. `(a+)+$` 류 입력으로 **catastrophic backtracking(ReDoS)** 을 유발할 수 있다

신규 순수함수 — **`src/shared/utils/escape-regexp.ts`**
(side-effect 없는 도메인-무관 순수함수 → `src/shared/utils/`가 정확한 위치. 파일명 kebab-case + **도메인이 안 드러나는 목적명** — `src/shared/CLAUDE.md`, db-migrator와 합의)

```ts
export const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
```

`src/shared/utils/index.ts` 배럴에 추가.

---

## 4. 결정 사항 및 근거

### 4.1 빈 쿼리(`q` 없음/공백만) → **`200` + `data: []`** (확정)

3가지 안을 검토했다:

| 안 | 판단 |
| --- | --- |
| 전체 상품 반환 | **기각.** `/search`는 input autofocus라 마운트 직후 빈 문자열로 SWR이 발사될 수 있다. 그 순간 전 카탈로그가 응답으로 나가면 (a) 불필요한 전량 조회 비용, (b) "검색하지 않았는데 결과가 떠 있는" 화면이 된다. 전체 목록이 필요하면 이미 `GET /api/products`가 있다 — 두 엔드포인트가 같은 일을 하게 만들지 않는다 |
| `400 VALIDATION` | **기각.** 빈 입력은 `/search` 페이지의 **정상 초기 상태**이지 클라이언트 오류가 아니다. 400으로 만들면 프론트가 "진짜 에러"와 "아직 안 침"을 `error.category`로 구분해야 하고, SWR의 `error` 상태에 정상 흐름이 섞여 에러 UI가 잘못 뜬다 |
| **빈 배열** | **채택.** REQ-1 acceptance가 "조건 없으면 빈 배열(에러 아님) 반환"으로 명시. 구현상으로도 `$or: []`가 MongoDB에서 에러이므로 early return이 자연스럽다. DB를 아예 치지 않아 비용도 0 |

> 프론트 주의: `data: []`는 "빈 쿼리"와 "검색했지만 0건" 두 상황에서 똑같이 나온다. **API 응답만으로는 구분 불가**이므로, UI가 검색어 유무를 자기 상태로 판단해야 한다(§5.2).

### 4.2 `q` 최대 길이 100자 → 초과 시 `400 VALIDATION` (확정)

무제한 문자열이 `$regex`에 들어가면 이스케이프를 해도 매칭 비용이 입력 길이에 비례해 커진다. 100자를 넘는 상품명 검색은 현실적 유스케이스가 없다. 잘라내기(truncate)가 아니라 400을 쓰는 이유: 조용히 잘라내면 사용자가 친 것과 다른 결과가 나오는데 이유를 알 수 없다.

### 4.3 라벨 역조회는 **부분일치** (확정 — v1의 정확일치 안에서 변경)

db-migrator 지적: 정확일치로 짜면 `"돌잔"` 검색이 라벨 `"돌잔치"`에 매칭 실패한다. 검색창이 1개인 구조에서 사용자가 라벨을 정확히 완창할 것을 기대할 수 없으므로 **부분일치**로 확정한다.

매칭 규칙:
- 라벨(`"청첩장"`/`"돌잔치"`/`"VIP"`/`"비즈니스"`/`"초대장"`)에 검색어가 **포함**되면 매칭 — 대소문자 무시(`"vip"` → `VIP`)
- enum key(`"wedding"` 등)에 검색어가 포함돼도 매칭 — 영문 입력 대응
- **검색어가 2글자 미만이면 라벨 역조회를 건너뛴다.** 1글자는 오탐이 지나치다(`"비"` 하나로 `비즈니스` 카테고리 전체가, `"e"` 하나로 `wedding` 전체가 딸려온다). title regex는 1글자여도 그대로 적용되므로 검색 자체가 막히지는 않는다.
- 매칭 실패는 **에러가 아니다** — 해당 조건만 `$or`에서 빠진다. 단일 검색창 구조상 매칭 실패가 정상 흐름의 대다수다.

### 4.4 라벨→enum key 역조회 로직의 **위치** (확정)

| 후보 | 판단 |
| --- | --- |
| `route.ts` | **기각** |
| **서비스 내부** | **채택** |

근거 3가지:

1. **`route.ts`는 얇은 어댑터라는 기존 계약.** `src/app/api/products/route.ts`는 `searchParams` 파싱 → 서비스 호출 → `routeSuccess/routeError` 3줄이 전부다. `src/app/api/CLAUDE.md`도 응답 빌더 규칙만 다루고 도메인 로직을 route에 두는 것을 전제하지 않는다.
2. **역조회는 도메인 로직이다.** `productCategoryLabels`/`subCategoryLabels`(`src/shared/utils/category.ts` — 카테고리 타입의 단일 소스)에 의존하는 비즈니스 규칙이고, `src/server/services/CLAUDE.md` Overview가 "DB 접근 + 비즈니스 로직"을 services 소관으로 규정한다.
3. **결정적 근거 — 재사용 경로.** `docs/DATA_ACCESS.md` row 1에 따라 Server Component가 나중에 검색을 서버 렌더 시점에 쓰면 `route.ts`를 거치지 않고 서비스를 직접 import한다. 역조회가 `route.ts`에 있으면 그 경로에서 통째로 누락돼, 같은 함수가 호출 경로에 따라 다르게 동작한다.

**단, 역조회 *헬퍼 함수 자체*는 `src/shared/utils/category.ts`에 둔다** — 라벨 맵의 소유자가 그 파일이고(`src/shared/utils/CLAUDE.md` Gotchas: "`category.ts`의 `ProductCategory`는 카테고리 타입의 단일 소스"), 새 카테고리 추가 시 한 파일만 고치면 되게 유지하기 위함이다. 즉 **헬퍼는 `category.ts`, 그 헬퍼를 호출해 쿼리를 만드는 것은 서비스**다.

`src/shared/utils/category.ts`에 추가할 헬퍼 (초안):

```ts
// 라벨 역조회 최소 길이 — 1글자는 오탐이 지나치다(§4.3).
const LABEL_MATCH_MIN_LENGTH = 2;

// 검색어가 라벨 또는 enum key에 부분일치하는 카테고리 key들을 돌려준다.
export const findProductCategoriesByTerm = (term: string): ProductCategory[] => {
  const normalized = term.trim().toLowerCase();
  if (normalized.length < LABEL_MATCH_MIN_LENGTH) return [];

  return (Object.entries(productCategoryLabels) as [ProductCategory, string][])
    .filter(
      ([key, label]) =>
        label.toLowerCase().includes(normalized) ||
        key.toLowerCase().includes(normalized),
    )
    .map(([key]) => key);
};

// subCategory도 동일 구조 (subCategoryLabels 사용, SubCategory[] 반환)
export const findSubCategoriesByTerm = (term: string): SubCategory[] => {
  /* 위와 동일 패턴 */
};
```

- 기존 `isProductCategory`/`isSubCategory`는 **완전일치 타입가드**라 이 용도에 못 쓴다(부분일치가 필요). 두 헬퍼를 새로 추가하되 기존 함수는 건드리지 않는다.

### 4.5 검색창 1개 ↔ 파라미터 1개 (리더 정정 반영)

v1 초안은 `q`/`category`/`subCategory` 3파라미터를 두고 클라이언트가 `q`만 보내는 안이었다. 리더 정정으로 **`category`/`subCategory` 파라미터 자체를 제거**했다. 결과적으로 계약이 단순해지고 "선언은 됐지만 아무도 안 쓰는 파라미터"가 사라졌다 — 프론트 훅도 `?q=` 하나만 조립하면 된다.

REQ-1 acceptance("category/subCategory 라벨 입력도 매칭 가능")는 그대로 만족된다: 사용자가 `"청첩장"`을 치면 title에 "청첩장"이 든 상품과 `subCategory: "wedding"`인 상품이 `$or`로 함께 나온다.

---

## 5. 응답 계약

### 5.1 성공 — `200`

```jsonc
{
  "success": true,
  "data": [ /* ProductResponse */ ]
}
```

- **`data`는 `ProductResponse[]` 배열 그대로다. `{ items, total }` 래핑을 하지 않는다.**
  - 근거: 기존 `GET /api/products`가 `APIRouteResponse<ProductResponse[]>`로 배열을 그대로 내려주고, REQ-3이 그 응답을 소비하는 **기존 `ProductCatalog` 그리드를 재사용**하라고 명시한다. 래핑하면 소비처가 shape을 분기해야 하고 재사용이 깨진다.
  - 페이지네이션이 없으므로 `total`이 담을 정보가 `data.length` 외에 없다. 향후 페이지네이션 도입 시 그때 래핑 여부를 재설계한다(지금 미리 래퍼를 만들지 않는다).
- **응답 스키마는 신규 정의하지 않는다** — `src/shared/schemas/response/product.schema.ts`의 `productsResponseSchema`(`z.array(productResponseSchema)`)를 그대로 재사용한다. 검색이라고 해서 필드가 더 붙거나 빠지지 않는다.
- 타입: `Promise<APIRouteResponse<ProductResponse[]>>`

### 5.2 소비 측(프론트) 계약 — REQ-3/REQ-4용

```ts
// fetcher가 envelope를 벗겨 body.data를 반환한다 (src/client/.../fetcher.ts)
const key = term.trim() ? `/api/products/search?q=${encodeURIComponent(term.trim())}` : null;
const { data, error, isLoading } = useSWR<ProductResponse[]>(key, fetcher);
```

- **SWR key를 조건부(`null`)로 걸어 빈 검색어에서는 요청 자체를 보내지 않는다.** 서버는 빈 쿼리에도 안전하게 `[]`를 주지만(§4.1), 무의미한 왕복을 없애고 아래 상태 구분을 성립시키기 위함이다.
- **UI 상태는 4개**다. idle과 0건을 하나로 합치면 안 된다:

| 상태 | 조건 | 화면 |
| --- | --- | --- |
| idle(미검색) | `term.trim() === ""` | 안내/비어있는 초기 화면. **"검색결과가 없습니다"를 띄우지 않는다** |
| 로딩 | `isLoading` | 로딩 표시 |
| 결과 있음 | `data.length > 0` | `ProductCatalog` 그리드 |
| 결과 0건 | `data.length === 0` && term 있음 | **"검색결과가 없습니다"** (REQ-4) |

> 마운트 직후(autofocus, 빈 input) "검색결과가 없습니다"가 떠 있는 것이 이 기능의 대표적 경계면 버그다.
- `error`는 `ErrorPayload`(`{ category, message, fieldErrors? }`)로 throw된다 — `fetcher`가 `throw body.error` 하기 때문에 `Error` 인스턴스가 아니다. `error.message`를 그대로 노출해도 안전하다(`toErrorPayload`가 `ERROR_SAFE_MESSAGES`로 일반화 처리).
- **관련도(relevance) 정렬은 없다.** regex 검색이라 score가 안 나온다 — 정렬은 항상 `isFeatured` → `priority` → `createdAt` desc다. "관련도순" 같은 정렬 옵션/문구를 UI에 두지 않는다.

### 5.3 `isLiked`는 항상 `false` (v1 한계, 명시)

`route.ts`가 세션을 읽지 않으므로 `userId`가 서비스에 전달되지 않고, `transformProduct`가 `isLiked: false`를 채운다. **기존 `GET /api/products`와 동일한 한계**라 의도적으로 파리티를 맞췄다. `ProductCatalog`가 하트 채움 상태를 `isLiked`로 그린다면 `/search`에서는 전부 빈 하트가 된다. 이게 UX상 수용 불가면 `route.ts`에서 `getAuth()`로 `userId`를 얻어 넘기는 1줄 변경으로 해결되지만, 그러면 검색만 목록과 동작이 달라진다 (§9 미해결 쟁점 3).

---

## 6. 에러 계약

| 상황 | 카테고리 | HTTP | 발생 위치 | 비고 |
| --- | --- | --- | --- | --- |
| `q` 100자 초과 | `VALIDATION` | 400 | `route.ts` (zod 실패 → `AppError`) | `fieldErrors: { q: [...] }` 포함 |
| DB 커넥션/쿼리 실패 | `INTERNAL` | 500 | 서비스 → `routeError`가 unknown error로 처리 | 메시지는 `ERROR_SAFE_MESSAGES.INTERNAL`로 일반화 |
| 그 외 예상치 못한 예외 | `INTERNAL` | 500 | `routeError` | |

**발생하지 않는 에러**(구현자/검증자 주의):
- `UNAUTHENTICATED`(401) / `FORBIDDEN`(403) — 공개 엔드포인트라 인증·인가 검사가 없다
- `NOT_FOUND`(404) — 검색 결과 0건은 **정상 200 + `[]`**다. 컬렉션 조회이지 단일 리소스 조회가 아니므로 404가 아니다
- `DISABLED`(503) / `EXTERNAL_SERVICE`(502) — 외부 API 의존이 없다

**500이 나면 안 되는데 나기 쉬운 두 지점**(db-migrator 지적, 반드시 방어):
1. `$or: []` → early return 가드로 방어 (§3.2)
2. 이스케이프 안 된 사용자 입력의 regex 컴파일 실패 → `escapeRegExp`로 방어 (§3.3)

에러 응답 wrapping은 전부 `routeError(error)` 단일 경로다. `NextResponse.json`을 직접 호출하지 않는다(`src/app/api/CLAUDE.md`).

---

## 7. route.ts 초안

파일 경로: **`src/app/api/products/search/route.ts`**

```ts
import { NextRequest } from "next/server";
import { APIRouteResponse, routeSuccess, routeError } from "@/server/boundary";
import { searchProductsService } from "@/server/services";
import { ProductResponse, productSearchRequestSchema } from "@/shared/schemas";
import { validateAndFlatten } from "@/shared/utils";
import { AppError } from "@/shared/types";

export const GET = async (
  request: NextRequest,
): Promise<APIRouteResponse<ProductResponse[]>> => {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = validateAndFlatten(productSearchRequestSchema, {
      q: searchParams.get("q") ?? undefined,
    });

    if (!parsed.success) {
      throw new AppError("VALIDATION", "검색어를 확인해주세요.", parsed.error);
    }

    const products = await searchProductsService(parsed.data.q);

    return routeSuccess(products);
  } catch (error) {
    return routeError(error);
  }
};
```

---

## 8. 인덱스 / DB 영향 (db-migrator와 합의 완료)

db-migrator `01_db_schema.md`와 결론 일치:

- **`product.model.ts` 무수정. 신규 필드 없음, 신규 인덱스 없음.** 기존 `title`/`category`/`subCategory`/`deletedAt`/`isFeatured`/`priority`/`createdAt`만 사용한다.
- **MongoDB `$text` 인덱스는 명시적으로 배제**(00_requirements.json: 한국어 형태소 분석 미지원).
- 인덱스를 안 두는 근거: `$regex`가 `^` 시작 고정이 아닌 부분일치 + `$options: "i"`라 `title` 인덱스를 못 탄다. `$or`는 절마다 인덱스를 따로 타는데 한 절이라도 인덱스가 없으면 옵티마이저가 전체를 컬렉션 스캔으로 처리하므로, `category`/`subCategory` 인덱스를 걸어도 이 쿼리에서는 이득이 없다. 쓰기 비용만 늘어난다.
- **재검토 트리거**: 문서 수 수천 건 초과 또는 p95 200ms 초과. 그 시점에는 인덱스가 아니라 **Atlas Search(한국어 analyzer)** 로 간다 — 인덱스 추가로는 해결되지 않는 문제다.
- "라벨→enum key 역조회" 전제는 스키마와 정합 확인 완료: DB에는 enum key가 저장되고 한글 라벨은 `category.ts`에만 존재한다. 따라서 라벨 문자열로 DB를 직접 조회하는 코드는 있어서는 안 된다 — 반드시 key로 변환 후 `$in`.

---

## 9. 미해결 쟁점 (리더 판단 요청)

1. **`status` 필터 부재** — 검색 결과에 `status: "inactive"`/`"soldOut"` 상품이 포함된다. `getAllProductsService`와 파리티를 맞춘 결과이자 REQ-1의 명시 지시(`deletedAt:null`)를 따른 것이지만, "판매 중지 상품이 검색된다"가 제품상 허용되는지 확인이 필요하다. 바꾼다면 검색만이 아니라 `getAllProductsService`도 같이 바꿔야 어긋나지 않는다.
2. **라벨 역조회 최소 길이 2글자** (§4.3) — 1글자 검색어는 title regex만 타고 라벨 매칭은 건너뛴다. 오탐 방지 목적이나 임의 상수이므로, 실사용에서 부자연스러우면 조정 대상이다.
3. ~~**`isLiked` 항상 false**~~ — **리더 판정(2026-07-31): v1 그대로 false 채택.** ui-designer가 `ProductGrid`/`ProductCard` 그대로 재사용하기로 확정했고(01_ui_flow.md §6), 하트 빈 상태로 렌더돼도 크래시/오동작 없음 — 단순 UX 제약이라 이번 스코프에서 `getAuth()` 추가 안 함. 04_integration_report.md에 known limitation으로만 기록.
4. ~~**`status` 필터 부재**~~ — **리더 판정: 미포함 유지.** db-migrator/api-designer 독립적으로 같은 결론(파리티 유지) — 확정.
5. **라벨 역조회 최소 길이 2글자** — 리더 판정: 임의 상수 그대로 채택, 실사용 후 조정 필요하면 재검토(과대설계 방지).

**Phase1 승인 상태: 리더 승인 완료 (2026-07-31). backend-impl 착수 가능.**

---

## 10. 산출 파일 목록 (Phase2 backend-impl 인계)

| 상태 | 경로 | 비고 |
| --- | --- | --- |
| **작성 완료** | `src/shared/schemas/request/productSearch.schema.ts` | 배럴 등록 완료 |
| **작성 완료** | `src/shared/schemas/request/productSearch.schema.test.ts` | 10 케이스 통과 |
| **작성 완료** | `src/shared/schemas/index.ts` | 배럴에 1줄 추가 |
| 미작성(초안만) | `src/app/api/products/search/route.ts` | §7 |
| 미작성(초안만) | `src/shared/utils/escape-regexp.ts` (+ 배럴) | §3.3 |
| 미작성(초안만) | `src/server/services/product.service.ts` — `searchProductsService` 추가 | §3.2 |
| 미작성(초안만) | `src/shared/utils/category.ts` — `findProductCategoriesByTerm` / `findSubCategoriesByTerm` 추가 | §4.4 |
| 재사용(변경 없음) | `src/shared/schemas/response/product.schema.ts` — `productsResponseSchema` | §5.1 |

> **이 저장소에는 TDD 게이트 훅이 걸려 있다** — `src/` 아래 파일을 쓰기 전에 대응하는 `*.test.ts`가 먼저 존재해야 한다(Bash 우회 금지). backend-impl은 위 미작성 항목마다 테스트를 먼저 작성해야 한다.
>
> 코드 블록은 **설계 초안**이다. Phase2에서 backend-impl이 다듬을 수 있되, §2.2 edge case 표·§4 결정 사항·§5.1 응답 shape·§6 에러 카테고리는 계약이므로 임의로 바꾸지 않는다.
