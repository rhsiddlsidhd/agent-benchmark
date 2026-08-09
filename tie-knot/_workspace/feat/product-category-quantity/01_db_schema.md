# 01_db_schema.md — 데이터 모델 설계

> feat/product-category-quantity · Phase1 · db-migrator
> 대상 요구사항: REQ-1(카테고리 확장), REQ-2(Product 필드 추가), REQ-3(zod 조건부 검증)
> 참조: REQ-5(주문 수량 검증)는 스키마 변경 없음 — §6에 경로만 확정

## 0. 결정 요약

| 항목 | 결정 |
|---|---|
| 신규 모델 | **없음** — 기존 `Product` base 스키마 확장으로 해결 |
| 신규 필드 | `images` / `minQuantity` / `maxQuantity` (전부 base `ProductDB`, discriminator 아님) |
| 필드명 케이스 | camelCase — DB ↔ API 응답 ↔ UI 폼 3중 동일, 매핑 코드 없음 |
| 신규 discriminator | **만들지 않음** — 신규 4개 카테고리는 전용 필드가 없음 |
| 신규 인덱스 | **없음** (근거 §5, 후속 권고 별도) |
| 백필 스크립트 | **작성 안 함** — 대신 읽기 경로 정규화로 대체(§7, 이번 설계의 핵심 리스크) |
| `order.model.ts` | **변경 없음** — `product.quantity` 이미 존재 |

3자 합의 완료(db-migrator ↔ api-designer ↔ ui-designer): 필드명 3개, mongoose default 값, 레거시 폴백 값, `images` 요청 payload 모양.

---

## 1. REQ-1 — `category.ts` 라인업 확장

파일: `src/shared/utils/category.ts` (카테고리 타입의 단일 소스)

### 1-1. 확장 대상 4곳

`PRODUCT_CATEGORIES` / `SUB_CATEGORY_MAP`만 넓히면 끝나지 않는다. **같은 파일의 라벨 맵 2개도 반드시 같이 넓힌다.**

```ts
export const PRODUCT_CATEGORIES = [
  "invitation", "favor", "accessory", "guestbook", "ceremony",
] as const;

export const SUB_CATEGORY_MAP = {
  invitation: ["wedding", "first-birthday"],
  favor:      ["candle", "diffuser", "soap", "magnet", "handkerchief"],
  accessory:  ["ring-pillow", "welcome-board", "polaroid-frame"],
  guestbook:  ["book", "stamp"],
  ceremony:   ["candle-holder", "escort-card", "program-book", "aisle-runner"],
} as const satisfies Record<ProductCategory, readonly string[]>;
```

`productCategoryLabels`(5개), `subCategoryLabels`(16개) 전부 채운다. **라벨을 빠뜨리면 조용히 깨진다** — `isProductCategory`/`isSubCategory`가 `Object.keys(labels)` 기반이라(`category.ts:21-27`) 라벨 없는 카테고리는 "존재하지 않는 카테고리"로 판정된다. `products/[category]` 라우트의 `generateStaticParams()`/카테고리 검증이 이 함수를 쓴다(`src/shared/utils/CLAUDE.md` Gotchas). `getCategoryOptions()`도 `productCategoryLabels`를 순회하므로 라벨이 곧 어드민 셀렉트 옵션이다.

`satisfies Record<ProductCategory, ...>`가 `SUB_CATEGORY_MAP` 누락만 컴파일 타임에 잡아주고 **라벨 맵 2개는 `Record<...>` 타입 annotation이 있어 역시 컴파일 에러로 잡힌다** — 4곳 다 타입이 강제하므로 빌드가 통과하면 누락은 없다.

### 1-2. 파생 타입은 손대지 않는다

`SubCategory = (typeof SUB_CATEGORY_MAP)[ProductCategory][number]`가 그대로 16개 값의 유니온으로 넓어진다. `product.model.ts`(`enum: PRODUCT_CATEGORIES`)/`request/product.schema.ts`(`z.enum(PRODUCT_CATEGORIES)`)/`response/product.schema.ts`는 **수정 불필요** — 이미 원본을 import하는 구조다(PR #92). REQ-1 수용조건 그대로.

### 1-3. 확인 사항 2건

- **서브카테고리 값은 16개 전역 유일**해야 한다(`subCategoryLabels`가 카테고리로 중첩되지 않은 평면 `Record<SubCategory, string>`이라서). 현재 라인업에 중복 없음 — 확인 완료.
- `findSubCategoriesByTerm`은 부분일치라 검색어 "candle"이 `candle`(favor)과 `candle-holder`(ceremony)를 **둘 다** 반환한다. 버그 아님(검색 관점에선 오히려 바람직) — 다만 검색 결과 기대치로 알고 있을 것.

### 1-4. 서브카테고리 개수 — 14개 (정정 반영 완료)

`00_requirements.json` REQ-1이 당초 "13개"로 적혀 있었으나 열거된 실제 개수는 **14개**(favor 5 + accessory 3 + guestbook 2 + ceremony 4)다. 리더가 요구사항 파일을 14개로 정정 완료 — **이 항목은 종결**. 구현·검증 모두 14개 기준.

`invitation`의 기존 2개를 포함한 `SUB_CATEGORY_MAP` 전체 값은 16개이고, `subCategoryLabels`도 16개를 채워야 한다(§1-1). "신규 14개"와 "전체 16개"를 혼동하지 말 것.

---

## 2. REQ-2 — `Product` 모델 필드 추가

파일: `src/server/models/product.model.ts`

### 2-1. base 스키마에 넣는 이유

`src/server/models/CLAUDE.md`는 "하위 타입 전용 필드는 discriminator로 분리"를 요구한다. 세 필드는 **전 카테고리 공통 개념**이므로 base가 맞다:
- `images`(상세 갤러리)는 invitation도 가질 수 있다 — 안 쓸 뿐 개념이 배타적이지 않다(`previewUrl`은 invitation 전용 개념이라 discriminator로 간 것과 대비).
- `minQuantity`/`maxQuantity`는 per-product 정책이고 invitation도 실제 값(1,1)을 갖는다 — "카테고리가 강제하지 않는다"는 게 TODO.md 확정 사항이다.

**신규 4개 카테고리에 discriminator를 만들지 않는다** — 전용 필드가 아직 없다. 같은 CLAUDE.md의 과설계 방지 규칙. `getWritableProductModel`(`product.service.ts:25`)이 `category === "invitation"`이 아니면 base `ProductModel`을 돌려주므로 신규 카테고리는 **서비스 코드 수정 없이** 그대로 저장된다.

### 2-2. 스키마 정의

```ts
images: { type: [String], default: [] },
minQuantity: { type: Number, required: true, default: 1, min: 1 },
maxQuantity: { type: Number, required: true, default: 0, min: 0 },
```

| 필드 | 타입 | required | default | validator | 비고 |
|---|---|---|---|---|---|
| `images` | `string[]` | ✗ | `[]` | 없음 | Cloudinary URL. 배열 순서 = 갤러리 표시 순서(BSON 배열은 순서 보존) |
| `minQuantity` | `number` | ✓ | `1` | `min: 1` | |
| `maxQuantity` | `number` | ✓ | `0` | `min: 0` | `0` = 무제한. **DB는 이 의미를 모른다** |

**`images`에 mongoose `required`를 걸지 않는 이유(두 가지)**
1. invitation은 `images` 없이 판매 성립(`previewUrl`이 대신함) — required면 등록 자체가 깨진다.
2. 설령 걸어도 목적을 못 이룬다: mongoose에서 배열 path의 `required`는 존재 여부만 보고 **빈 배열 `[]`도 통과**시킨다. "물리상품은 최소 1장"은 zod superRefine이 **유일한** 집행 지점이다.

**`maxQuantity >= minQuantity` 교차검증을 mongoose validator로 옮기지 않는다** — `subCategory` validator가 이미 겪은 함정을 그대로 재현한다: update validator에서 `this`는 Document가 아니라 Query라 다른 필드를 못 읽고, `this.get()`은 이번 payload에 있는 값만 준다(`models/CLAUDE.md` Gotchas). 필드 간 교차검증은 zod 레이어 전담(§3).

`required: true` + `default`는 저장 시 절대 실패하지 않는다(default가 먼저 채워짐) — 신규 문서에 값이 반드시 존재함을 보장하는 용도다. **기존 문서에는 소급 적용되지 않는다**(§7).

### 2-3. 타입 3종 갱신

```ts
export interface ProductDB {
  // ...기존 필드
  images: string[];
  minQuantity: number;
  maxQuantity: number;
}
```
`IProduct`는 `ProductDB`를 extends하므로 자동 반영. `ProductJSON`은 `Omit<ProductDB, "likes"|"featureIds"|"deletedAt">` 기반이라 **자동 반영된다**(세 필드 다 Omit 대상이 아니고 직렬화 변환도 불필요) — 추가 선언 불필요.

`ProductJSON`에서 세 필드는 **non-optional**이다. 이 계약은 §7의 읽기 경로 정규화가 있어야만 성립한다.

---

## 3. REQ-3 — `request/product.schema.ts` 조건부 검증

파일: `src/shared/schemas/request/product.schema.ts`

### 3-1. `images`의 요청 shape은 `string[]`이 **아니다** (설계상 가장 중요한 지점)

DB/응답은 `string[]`이지만 **요청 DTO는 다르다.** 이 프로젝트의 product 액션은 **업로드 전에** 검증한다(`createProduct.ts:38` 검증 → `:56` Cloudinary 업로드). `thumbnail`이 URL이 아니라 `z.instanceof(File)`인 이유다. 폼 제출 시점엔 신규 파일이 아직 URL이 아니다.

`images: z.array(z.instanceof(File))`로 잡으면 **수정 플로우가 깨진다** — 이미지가 이미 있는 물리상품을 이미지는 안 건드리고 수정하면 newFiles가 비어 "images required"에 걸린다.

→ **`coupleInfo` 선례를 그대로 채택**(`request/coupleInfo.schema.ts:53-70` `coupleInfoClientSchema`):

```ts
images: z.object({
  existing: z.array(z.string().url()),   // 유지할 기존 URL
  newFiles: z.array(z.instanceof(File)), // 새로 업로드할 파일
}),
```

- 조건부 required는 **합계**로 검사: `category !== "invitation"` → `existing.length + newFiles.length >= 1`
- 액션이 `newFiles`만 업로드 후 `[...existing, ...uploadedUrls]`로 합쳐 `string[]`을 서비스에 전달
- FormData 키: 신규 파일 `images`(multiple) / 유지할 기존 URL `currentImages`(multiple) — `updateProduct.ts:55`의 `currentThumbnail`과 같은 축
- 클라이언트는 기존 훅 `useImageList`를 그대로 재사용한다 — `getPayload()`가 정확히 이 모양을 반환한다(`useImageList.ts:62`)

**요약: DB/응답 = `string[]`, 요청 DTO만 `{ existing, newFiles }`.**

### 3-2. superRefine 2종 (기존 `isPremium`↔`featureIds` `.refine()`과 같은 패턴)

```ts
.refine(
  (data) => {
    if (data.category === "invitation") return true;
    return data.images.existing.length + data.images.newFiles.length >= 1;
  },
  { message: "상세 이미지를 1장 이상 등록해주세요.", path: ["images"] },
)
.refine(
  (data) => data.maxQuantity === 0 || data.maxQuantity >= data.minQuantity,
  { message: "최대 수량은 최소 수량 이상이어야 합니다.", path: ["maxQuantity"] },
)
```

`minQuantity: z.number().int().min(1)`, `maxQuantity: z.number().int().min(0)`을 object에 추가한다(정수 강제는 zod에서만 — mongoose `min`은 정수 여부를 안 본다).

REQ-3 수용조건 대응: invitation은 첫 refine을 무조건 통과(images 없이 OK) / 물리상품 4종은 합계 0이면 에러 / `maxQuantity>0 && maxQuantity<minQuantity`면 에러.

---

## 4. 필드명 매핑표 (DB ↔ API ↔ UI)

api-designer / ui-designer와 합의 완료. **이름이 갈라지는 곳이 없다** — `transformProduct`가 lean 문서를 그대로 spread하므로 매핑 코드가 생기지 않는다.

| DB (`ProductDB`) | 응답 (`productResponseSchema`) | 요청 zod (`productSchema`) | FormData 키 | UI 폼 `name` |
|---|---|---|---|---|
| `images: string[]` | `images: z.array(z.string())` | `images: {existing, newFiles}` | `currentImages`(유지 URL) / `images`(신규 File) | `images` |
| `minQuantity: number` | `minQuantity: z.number()` | `z.number().int().min(1)` | `minQuantity` | `minQuantity` |
| `maxQuantity: number` | `maxQuantity: z.number()` | `z.number().int().min(0)` | `maxQuantity` | `maxQuantity`(무제한 시 hidden `0`) |

**`images` 행의 비대칭 2개는 전부 의도된 것이다. 경계면 검증에서 불일치로 판정하지 말 것:**
1. **요청 shape ≠ 응답 shape** — 요청은 `{existing, newFiles}`, 응답/DB는 `string[]`. 검증이 업로드보다 먼저 일어나기 때문(§3-1).
2. **FormData 키 ≠ DTO 필드명** — `currentImages` → `existing`, `images` → `newFiles`. FormData 키는 이 프로젝트 product 액션의 `currentThumbnail` 관례를, DTO 필드명은 `coupleInfoClientSchema`의 `{existing, newFiles}` 관례를 각각 따른 결과다. 액션이 둘을 이어 붙인다:
```ts
images: {
  existing: formData.getAll("currentImages") as string[],
  newFiles: (formData.getAll("images") as File[]).filter((f) => f.size > 0),
}
```
`size > 0` 필터는 필수다 — 빈 `<input type="file">`도 0바이트 File 엔트리를 만들어서, 안 거르면 물리상품 required 검증이 "이미지 있음"으로 오판한다(`createProduct.ts:59`의 `previewFile.size > 0` 가드와 같은 사유).

응답 3필드는 전부 non-optional — §7 정규화가 이를 보장한다.

경계면 검증 시 알아둘 것: **UI stepper의 "무제한 시 소프트 상한 99"는 DB/서버 제약이 아니다** — 순수 UI 편의 상한이며 서버는 `maxQuantity===0`일 때 상한을 검사하지 않는다(ui-designer와 합의). 불일치로 판정하지 말 것.

---

## 5. 인덱스 설계

### 5-1. 이번 스코프: 신규 인덱스 없음

`images`/`minQuantity`/`maxQuantity`는 **필터 키도 정렬 키도 아니다.** 전부 상품 조회 결과에 딸려 나오는 표시·검증용 필드이고, 접근 경로는 `_id` 단건 조회 아니면 기존 목록 쿼리의 부산물이다. REQ-5의 수량 검증 조회도 `_id` 기준(`findOne({_id, deletedAt:null}).select("minQuantity maxQuantity")`)이라 `_id` 기본 인덱스로 충분하다.

현재 `productSchema`에 정의된 인덱스는 **하나도 없다**(`_id` 제외). 참고로 `order.model.ts`는 `merchantUid`(unique)/`coupleInfoId`/`userId`에 인덱스가 있다.

### 5-2. 후속 권고 — 이번 PR 스코프 아웃 (리더 판단)

카테고리가 1개 → 5개로 늘면서 `category` 필터에 **실질적 선택도가 처음 생긴다**. api-designer가 제안한 복합 인덱스는 설계상 타당하다(ESR 순서 정확):

```
{ deletedAt: 1, category: 1, isFeatured: -1, priority: -1, createdAt: -1 }
```

이번 PR에 넣지 않는 이유 두 가지:
1. 인덱스 부재는 이번 기능이 만든 문제가 아니라 **기존 부채**다. 인덱스 추가는 기능 변경이 아니라 성능 변경이라 같은 PR에 섞으면 회귀 원인 분리가 안 된다.
2. 저 인덱스는 `getAllProductsService(category)` **카테고리 지정 호출만** 커버한다. category 없이 부르는 전체 목록 경로는 `deletedAt` 다음 키가 `category`라 그 뒤 정렬 키들이 연속되지 않아 결국 in-memory sort로 떨어진다. 두 경로를 다 커버하려면 인덱스가 2개 필요하고, 그건 실제 문서 수를 보고 판단할 일이다(현재 규모에선 in-memory sort가 문제되지 않는다).

`searchProductsService`의 `$or` + `$regex`(비앵커 패턴)는 어차피 일반 인덱스로 가속되지 않는다 — 필요해지면 text 인덱스가 별도 검토 대상이다.

---

## 6. `order.model.ts` — 변경 없음 + 경로 정정

**스키마 변경 불필요.** REQ-5가 쓸 수량 필드는 이미 존재한다.

**경로 정정(TODO.md 오기):** TODO.md가 "`Order.quantity`(`order.model.ts:20`)"라고 적었으나 라인 20은 `ProductSnapShot` 인터페이스 **안**이다. `IOrder`에 top-level `quantity`는 **없다**.

| 항목 | 실제 값 |
|---|---|
| 저장 경로 | `order.product.quantity` (`ProductSnapShotSchema`) |
| 스키마 정의 | `{ type: Number, required: true, default: 1 }` |
| FormData 키 | `productQuantity` (`createOrder.ts:54`) |

REQ-5 검증 로직(backend-impl)은 이 경로를 대상으로 한다. `ProductSnapShot`은 주문 시점 스냅샷이므로 `minQuantity`/`maxQuantity`를 스냅샷에 복사하지 않는다 — 검증은 주문 생성 시점에 Product를 다시 읽어 수행하고, 그 결과가 `quantity` 한 값으로 고정되면 충분하다.

**REQ-5용 조회(권고, 위치는 `product.service.ts`):**
```
ProductModel.findOne({ _id, deletedAt: null }).select("minQuantity maxQuantity").lean()
```
- 앞에 `mongoose.isObjectIdOrHexString` 가드 — 이 파일의 기존 패턴(`incrementProductViewsService`)
- **`.lean()`이라 여기서도 default가 채워지지 않는다** → 결과에 `?? 1` / `?? 1` 폴백 필수. 빠뜨리면 레거시 invitation 상품 주문에서 `undefined` 비교로 검증이 전부 통과해 **검증이 무력화된다**
- 상한과 무관하게 `quantity`는 양의 정수여야 한다(소수/음수/NaN 거부) — UI clamp는 방어선이 아니다

---

## 7. 마이그레이션 / 백필 — 스크립트 없음, 읽기 경로 정규화로 대체

### 7-1. 백필 스크립트를 만들지 않는다

TODO.md 라인 22 확정: 배포된 DB의 기존 invitation 문서는 실 서비스 데이터가 아니고 사용자가 직접 삭제 예정. MongoDB는 스키마리스라 필드 추가 자체에 DDL이 필요 없다.

### 7-2. 그러나 그냥 두면 깨진다 — 이번 설계에서 가장 큰 리스크

`required: true` + `default`는 **신규 저장분에만** 적용된다. 기존 문서에는 세 필드가 물리적으로 없다. 여기서 이 프로젝트 고유의 함정이 걸린다:

> **mongoose default는 문서를 hydrate할 때 채워지는데, 이 프로젝트의 읽기 경로는 `.lean()`이 기본이다.** lean 결과는 Document를 만들지 않으므로 **default가 적용되지 않는다.** `product.service.ts`의 조회는 전부 `.lean()`이다.

즉 기존 문서를 읽으면 `minQuantity: undefined`가 그대로 응답에 실려 나간다. 그 결과:
- `images: undefined` → 상세페이지 갤러리 `undefined.map()` **즉시 런타임 크래시**
- `minQuantity/maxQuantity: undefined` → stepper 값이 NaN으로 **조용히** 깨짐
- 응답 스키마의 `z.number()`(non-optional) 계약 위반
- REQ-5 수량 검증이 `undefined` 비교로 무력화(§6)

### 7-3. 대체 조치 — `transformProduct` 정규화 (backend-impl 작업)

위치: `src/server/services/product.service.ts:28` `transformProduct`. `...rest` 스프레드라 신규 필드는 자동으로 흘러가지만 `undefined`도 자동으로 흘러간다.

```ts
images: rest.images ?? [],
minQuantity: rest.minQuantity ?? 1,
maxQuantity: rest.maxQuantity ?? 1,
```

**`maxQuantity` 폴백은 `0`이 아니라 `1`이다.** 폴백이 실제로 발동하는 문서는 **기존 invitation 문서뿐**이고(신규 생성분은 default가 DB에 기록되어 lean에서도 값이 있다), invitation의 정답은 `(1, 1)`이다. `?? 0`이면 "무제한"이라 레거시 청첩장 상세가 상한 없는 stepper로 렌더돼 **REQ-4의 회귀 금지 조건("invitation은 기존과 동일하게 수량 고정")이 깨진다.**

즉 이 폴백의 의미는 단순 타입 방어가 아니라 **"필드가 없는 레거시 문서 = invitation 정책값 (1,1)으로 간주"** 다.

**두 값이 다른 것이 의도임을 혼동하지 말 것:**

| 구분 | `minQuantity` | `maxQuantity` |
|---|---|---|
| mongoose `default` (신규 문서 저장 시) | `1` | **`0`** (무제한) |
| 읽기 경로 폴백 (레거시 문서, 필드 자체가 없을 때) | `1` | **`1`** (고정) |

폴백을 모델 pre/post 훅에 두지 않는다 — `models/CLAUDE.md`의 "모델 훅에 도메인 계산·비즈니스 규칙 금지" 규칙. 서비스 레이어 소관이다.

응답 시점에 정규화되므로 **클라이언트에는 폴백을 깔지 않는다**(ui-designer 합의).

### 7-4. 백필이 필요해지는 조건

기존 invitation 문서를 삭제하지 않기로 방침이 바뀌면 그때 아래 한 줄이면 충분하다(현재는 불필요):
```
db.products.updateMany(
  { minQuantity: { $exists: false } },
  { $set: { minQuantity: 1, maxQuantity: 1, images: [] } }
)
```

---

## 8. 리더 확인 요망 — 3건 전부 확인 완료 (종결)

1. **`.lean()` × default 미적용 리스크(§7-2)** — **승인.** 리더가 `transformProduct` 정규화(`images ?? []` / `minQuantity ?? 1` / `maxQuantity ?? 1`)를 REQ-2 acceptance에 명시 추가했고 backend-impl 킥오프 필수 지시로 편성했다. `maxQuantity ?? 1`(0 아님) 근거도 승인됨. 백필 스크립트 불필요 방침 유지.
2. **복합 인덱스(§5-2)** — **이번 PR 스코프 아웃 확정.** 별도 트랙은 리더가 TODO.md 성능개선 섹션에 추가 예정. 이 설계에서 더 다루지 않는다.
3. **`00_requirements.json` REQ-1 개수 오기(§1-4)** — **정정 완료**(13 → 14).

추가 반영: `order.product.quantity` 경로 정정이 REQ-5 description에 반영 완료(§6).

**모델 충돌·인덱스 중복·필드 타입 불일치는 발견되지 않았다** — 세 필드 모두 신규 path이고 기존 필드명과 겹치지 않는다. 대안 제시가 필요한 충돌 없음.

## 9. 미해결 쟁점 — **없음** (전건 종결)

### 9-1. 갤러리 이미지 순서 편집 — 스코프 아웃 확정 (종결)

`{existing, newFiles}` payload는 "기존 것들 → 새 것들" 순서로만 합쳐진다. 기존 이미지 사이에 새 이미지를 끼워 넣는 정렬 UX는 이 계약으로 표현할 수 없다(`useImageList`의 `items`엔 순서 정보가 있으나 `getPayload()`가 두 배열로 쪼개며 소실).

**결론: "기존 뒤에 신규 append" 규칙으로 확정.** ui-designer 회신으로 종결됐다 — 요구사항 5건 어디에도 순서 편집이 없고, `ImageField`에 삭제 후 재업로드 우회 경로가 이미 있다. 리더도 동의. 순서 편집이 나중에 필요해지면 payload에 순서 인덱스를 싣는 **요청 계약 변경** 사안이며, DB 스키마(`images: string[]`, 배열 순서 = 표시 순서)는 그때도 바뀌지 않는다.

### 9-2. `maxQuantity` 빈 값 = 무제한 오등록 — UI에서 차단 확정 (종결)

`Number("")=== 0`이라 "미입력"과 "무제한"이 구분되지 않는 위험을 제기했고, ui-designer가 **"무제한" Checkbox** 방식으로 확정했다: 체크 시 숫자 Input `disabled` + `hidden name="maxQuantity" value="0"` 전송, 해제 시 `required min="1"` — **빈 문자열 제출 경로가 구조적으로 제거된다.** `minQuantity`도 항상 활성 + `required min="1"`.

DB 관점에서 이 결정이 갖는 의미: `maxQuantity`에 저장되는 `0`은 **항상 "무제한"이라는 명시적 의사표시**이고, 폼 미입력 사고로 들어온 `0`이 아니다. 센티널 값의 신뢰도가 입력 단계에서 보장된다.

### 9-3. 인덱스 후속 트랙 — 리더 TODO.md 소관 (이 문서 범위 밖)

§5-2 복합 인덱스 권고는 이번 PR 스코프 아웃 확정. 리더가 TODO.md 성능개선 섹션으로 이관 예정.
