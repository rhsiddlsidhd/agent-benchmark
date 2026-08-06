# 01_api_contract.md — 상품 카테고리 확장 + quantity 옵션화

> Phase1 산출물 (api-designer) · 브랜치 `feat/product-category-quantity`
> 입력: `_workspace/feat/product-category-quantity/00_requirements.json` (REQ-1~REQ-5)
> 근거 문서: `src/server/boundary.ts`, `docs/ERROR_HANDLING.md`, `docs/DATA_ACCESS.md`, `src/shared/schemas/CLAUDE.md`, `src/app/api/CLAUDE.md`
> 동료 합의: ui-designer(A~E 5건 답신 완료), db-migrator(Q1~Q4 요청 발신, 회신 대기 → §9 참고)

---

## 0. 요약 — 이번 기능에서 건드리는 경계면

**새 엔드포인트는 만들지 않는다.** 기존 3개 Server Action + 2개 Route Handler의 요청/응답 shape만 확장한다.

| # | 경로/함수 | 메서드 | 채널 | 인증 | 응답 성격 | 이번 변경 |
|---|---|---|---|---|---|---|
| 1 | `createProduct` | (Server Action) | A | 필요 (ADMIN) | 즉시 | 요청에 `images`/`minQuantity`/`maxQuantity` 추가 |
| 2 | `updateProduct` | (Server Action) | A | 필요 (ADMIN) | 즉시 | 위와 동일 + `currentImages` / **REQ-7** null 리턴 검사 → `NOT_FOUND` |
| 3 | `createOrder` | (Server Action) | A | 필요 (로그인) | 즉시 | **REQ-5** 수량 범위 검증 추가 |
| 4 | `/api/products` | GET | B | 불필요 | 즉시 | 응답에 3필드 추가 |
| 5 | `/api/products/search` | GET | B | 불필요 | 즉시 | 응답에 3필드 추가 |
| — | 상품 상세 page.tsx | (직접 호출) | 경로1 | 불필요 | 즉시 | 응답 타입만 공유 |

**비동기 결과(폴링/웹훅/백그라운드 잡)는 이번 기능에 하나도 없다.** 5개 전부 **즉시 응답**이다 — 프론트는 어떤 경우에도 "나중에 결과가 도착하는" 상태를 만들지 않는다. Cloudinary 이미지 업로드도 Server Action 내부에서 `await`으로 끝난 뒤 응답이 나가므로, 클라이언트 입장에선 액션 하나의 pending 구간에 포함된다(별도 업로드-완료 콜백 없음).

**손대지 않는 것 (명시)**
- `POST /api/order/create`(`src/app/api/order/create/route.ts`) — 현재 `AppError("DISABLED")`만 던지는 미구현 라우트다. 이번 스코프에서 **활성화하지 않는다.** 주문 생성은 채널 A(`createOrder`) 단일 경로다(`docs/DATA_ACCESS.md` row 2: 브라우저 트리거 mutation은 예외 없이 Server Action).
- `updateProductStatus` / `deleteProduct` / `toggleProductLike` / `incrementProductViews` — 신규 3필드를 읽지도 쓰지도 않는다.
- `POST /api/upload/signature` — 클라이언트 직접 업로드용 서명 발급. 상품 이미지는 Server Action이 서버에서 `uploadProductImage`로 올리는 경로라 이번 기능과 무관.

---

## 1. 필드 계약 (전 레이어 공통)

camelCase 고정. DB(mongoose) 필드명 = 응답 필드명 = 요청 필드명으로 1:1 정렬한다 — `transformProduct`(`src/server/services/product.service.ts:28`)가 lean 문서를 그대로 spread하는 구조라 이름이 갈라지면 서비스에 매핑 코드가 생긴다.

| 필드 | DB | 요청 DTO(admin, zod) | 응답 | 의미 |
|---|---|---|---|---|
| `images` | `string[]` | **`{ existing: string[], newFiles: File[] }`** | `string[]` (항상 존재, 없으면 `[]`) | 상세페이지 갤러리. 목록/카드용 `thumbnail`과 역할 분리 |
| `minQuantity` | `number` | `number` | `number` (항상 존재) | 최소 주문 수량. `>= 1` |
| `maxQuantity` | `number` | `number` | `number` (항상 존재) | 최대 주문 수량. **`0` = 무제한** |

> ★ **`images`는 요청 DTO만 shape이 다르다.** DB/응답은 Cloudinary URL `string[]`이지만, 요청 검증은 **업로드 이전**에 일어나므로(`createProduct.ts:38` 검증 → `:56` 업로드) 아직 URL이 없는 신규 파일과 유지할 기존 URL을 같이 표현해야 한다. 프로젝트에 이미 같은 상황의 선례가 있어 그 형태를 그대로 쓴다 — `request/coupleInfo.schema.ts:53-70`의 `coupleInfoClientSchema`가 `thumbnailImages`/`galleryImages`를 `{ existing, newFiles }` + `existing.length + newFiles.length >= 1` refine으로 처리한다. 새 컨벤션을 만들지 않는다.
> 변환 방향: FormData → `{ existing, newFiles }` (액션) → newFiles만 업로드 → `[...existing, ...uploadedUrls]` (`string[]`) → 서비스 → DB.

### 1-1. 응답 3필드는 전부 non-optional이다 (ui-designer 합의 A)

`productResponseSchema`에서 `.optional()`을 붙이지 않는다. 클라이언트에 `?? 1` / `?? 0` 폴백을 두지 않기 위해서다 — "카테고리 분기를 컴포넌트 if문이 아니라 product 데이터가 결정한다"(TODO.md)는 규칙이 클라 폴백을 깔면 흐려진다.

### 1-2. 레거시 문서 폴백 — mongoose default와 값이 다르다 (의도)

기존 invitation 문서는 백필하지 않으므로(TODO.md 라인 22) 읽기 시점에 `minQuantity`/`maxQuantity`가 `undefined`일 수 있다. **정규화는 서비스 레이어 `transformProduct`에서 한다.**

| | `minQuantity` | `maxQuantity` |
|---|---|---|
| mongoose `default` (신규 문서 저장 시) | `1` | **`0`** (무제한) |
| 읽기 경로 레거시 폴백 (필드 자체가 없을 때) | `1` | **`1`** |

두 값이 다른 건 실수가 아니라 의도다. 현존 레거시 문서는 전부 `invitation`이고(카테고리가 그것 하나뿐이었음) invitation은 `min=max=1`이 정답이다. `?? 0`으로 폴백하면 무제한이 돼서 레거시 invitation 상세페이지가 상한 없는 stepper로 렌더된다 — REQ-4의 "invitation 회귀 없음" 조건 위반.

폴백을 mongoose pre/post 훅에 두지 않는다 — `src/server/models/CLAUDE.md`의 "모델 훅에 도메인 로직 두지 않는다" 규칙. `transformProduct` 한 곳에만 둔다(모든 읽기 경로가 이 함수를 통과한다).

```ts
// src/server/services/product.service.ts — transformProduct 안
images: product.images ?? [],
minQuantity: product.minQuantity ?? 1,
maxQuantity: product.maxQuantity ?? 1,
```

### 1-3. `category` / `subCategory` 값 범위 (REQ-1)

`src/shared/utils/category.ts`의 `PRODUCT_CATEGORIES` / `SUB_CATEGORY_MAP`이 **단일 원본**이다. API 레이어에서 카테고리 값을 재하드코딩하지 않는다 — 이미 `product.schema.ts:8`이 `z.enum(PRODUCT_CATEGORIES)`, `product.model.ts:88`이 `enum: PRODUCT_CATEGORIES`로 import 참조 중이므로 **API 쪽은 별도 수정이 필요 없다**(원본 배열만 늘리면 요청 검증 범위가 자동 확장).

확정 라인업 (TODO.md):

| category | subCategory |
|---|---|
| `invitation` | `wedding`, `first-birthday` |
| `favor` | `candle`, `diffuser`, `soap`, `magnet`, `handkerchief` |
| `accessory` | `ring-pillow`, `welcome-board`, `polaroid-frame` |
| `guestbook` | `book`, `stamp` |
| `ceremony` | `candle-holder`, `escort-card`, `program-book`, `aisle-runner` |

> **개수**: 신규 서브카테고리는 **14개**다(favor 5 + accessory 3 + guestbook 2 + ceremony 4). 최종 상태는 **카테고리 5개(신규 4) / 서브카테고리 16개(신규 14)**. (`00_requirements.json` REQ-1이 한때 "13개"로 적혀 있었으나 이미 14로 수정 완료 — 라인업 자체는 처음부터 정확했다.)

API 검증 규칙 2단:
1. `category` — `z.enum(PRODUCT_CATEGORIES)` 자체 검증. 범위 밖이면 `fieldErrors.category`.
2. `subCategory` — 기존 `.refine`(`product.schema.ts:39-48`)이 `SUB_CATEGORY_MAP[category]`에 속하는지 교차 검증. 범위 밖이면 `fieldErrors.subCategory`, 메시지 `"해당 카테고리에서 허용되지 않는 서브 카테고리입니다."` **이 refine은 이번에 수정 불필요** — 원본 map을 참조하므로 자동으로 새 카테고리를 커버한다.
3. `subCategoryLabels` / `productCategoryLabels`에 신규 키 라벨이 빠지면 `findProductCategoriesByTerm` / `findSubCategoriesByTerm`(검색 라벨 역조회, `/api/products/search`가 사용)이 신규 카테고리를 못 찾는다. **REQ-1 구현 시 라벨 map도 같이 채워야 검색 API가 정상 동작한다** — 타입상 `Record<ProductCategory, string>`이라 컴파일 에러로 잡히지만, 경계면 관점에서 명시해 둔다.

---

## 2. 엔드포인트 #1 — `createProduct` (채널 A)

| 항목 | 값 |
|---|---|
| 경로/함수 | `src/server/actions/createProduct.ts` → `createProduct(_prev, formData)` |
| 메서드 | Server Action (`useActionState`, `(prevState, formData)` 순서 고정) |
| 채널 | **A** — 어드민 폼 제출. `docs/DATA_ACCESS.md` row 2(브라우저 트리거 mutation) |
| 인증 | **필요.** `requireAuth()` → `role !== "ADMIN"`이면 거부 |
| 응답 성격 | **즉시** |

### 요청 shape — FormData 키

기존 키는 그대로 두고 아래 3개만 추가한다.

| FormData 키 | 추출 방법 | zod DTO 위치 |
|---|---|---|
| `images` | `formData.getAll("images") as File[]` (다중 `type="file"`) | `images.newFiles` |
| `currentImages` | `formData.getAll("currentImages") as string[]` | `images.existing` |
| `minQuantity` | `Number(...)`, 빈 문자열/null이면 `undefined` | `minQuantity` |
| `maxQuantity` | `Number(...)`, 빈 문자열/null이면 `undefined` | `maxQuantity` |

액션에서의 조립:
```ts
images: {
  existing: formData.getAll("currentImages") as string[],
  newFiles: (formData.getAll("images") as File[]).filter((f) => f.size > 0),
},
```
`currentImages`는 create 흐름에선 항상 빈 배열이다(유지할 기존 이미지가 없음). 키 자체는 create/update가 공유한다 — 액션 두 개가 같은 `productSchema`를 쓰므로 DTO 형태를 갈라놓지 않는다.
`size > 0` 필터는 필수다 — 빈 `<input type="file">`도 FormData에 크기 0짜리 `File` 엔트리를 만들어서, 안 거르면 "이미지 1장 있음"으로 오판된다(`thumbnail`이 `.refine(file => file.size > 0)`을 두는 것과 같은 이유).

> **빈 값 방어 (필수)**: `Number(formData.get("minQuantity"))`를 그대로 쓰면 값이 없을 때 `Number(null) === 0`, `Number("") === 0`이 되어 `minQuantity: 0`으로 검증 실패한다. 액션에서 `const raw = formData.get("minQuantity"); const minQuantity = raw ? Number(raw) : undefined;` 형태로 `undefined`를 넘겨 zod `.default()`가 동작하게 한다. ui-designer가 폼에서 `defaultValue`를 채워 보내는 것과 이중 방어.

### 처리 순서 (기존 액션 구조 유지)

1. FormData → 평면 객체
2. `validateAndFlatten(productSchema, data)` — 실패 시 `{ success:false, error:{ category:"VALIDATION", message:"입력값을 확인해주세요", fieldErrors } }` **즉시 리턴**(try 블록 밖, 기존과 동일)
3. `requireAuth()` → ADMIN 체크
4. `uploadProductImage(thumbnailFile, "thumbnail")`
5. **신규**: `parsed.data.images.newFiles`를 업로드 → URL 배열. 폴더 인자는 `"images"`(또는 `"gallery"`) — 최종 값은 backend-impl이 `uploadProductImage` 시그니처에 맞춰 확정
6. **신규**: `const images = [...parsed.data.images.existing, ...uploadedUrls]` (순서 보존)
7. `createProductService({ ...parsed.data, images, authorId, thumbnail, previewUrl })`
8. `revalidatePath` 2건 (기존)

> **주의**: `parsed.data.images`는 `{ existing, newFiles }` 객체이고 서비스로 넘어가는 `images`는 `string[]`이다 — 타입이 갈린다. `createProductService`의 파라미터 타입이 이미 `Omit<ProductDto, "thumbnail"> & { thumbnail: string; ... }` 패턴이므로 `Omit<ProductDto, "thumbnail" | "images"> & { thumbnail: string; images: string[]; ... }`로 확장한다. 서비스·DB·응답은 끝까지 `string[]`만 본다.

### 응답 shape

성공(변경 없음):
```ts
{ success: true, data: { message: "상품이 성공적으로 등록되었습니다." } }
```
실패:
```ts
{ success: false, error: { category, message, fieldErrors? } }   // ErrorPayload
```

### 에러 카테고리 매핑

| 조건 | category | fieldErrors | message |
|---|---|---|---|
| zod 검증 실패 | `VALIDATION` | **있음** (`images`/`minQuantity`/`maxQuantity`/`category`/`subCategory`/…) | `"입력값을 확인해주세요"` |
| 미로그인 | `UNAUTHENTICATED` | 없음 | `requireAuth()` 원문 |
| 로그인했으나 ADMIN 아님 | `FORBIDDEN` | 없음 | `"관리자 권한이 필요합니다."` |
| Cloudinary 업로드 실패 | `EXTERNAL_SERVICE` 또는 `INTERNAL` | 없음 | **일반화된 문구로 치환됨** (`ERROR_SAFE_MESSAGES`) |
| mongoose 저장 실패 | `INTERNAL` | 없음 | **일반화된 문구로 치환됨** |

---

## 3. 엔드포인트 #2 — `updateProduct` (채널 A)

`createProduct`와 동일(채널 A / ADMIN 필요 / 즉시 응답). 차이만 적는다.

### 요청 shape — 추가 FormData 키

| FormData 키 | 추출 방법 | zod DTO 위치 | 용도 |
|---|---|---|---|
| `images` | `formData.getAll("images") as File[]` | `images.newFiles` | **신규 업로드 파일만** |
| `currentImages` | `formData.getAll("currentImages") as string[]` | `images.existing` | **유지할 기존 URL** (hidden input 반복 전송) |
| `minQuantity` / `maxQuantity` | create와 동일 | 동일 | |

**키 이름 근거**: ui-designer가 `existingImages`를 제안했으나 `currentImages`로 확정했다 — `updateProduct.ts:55,60`이 이미 `currentThumbnail` / `currentPreviewUrl`이라는 `current*` 접두사를 쓰고 있어 같은 역할에 새 접두사를 만들지 않는다. (FormData 키는 `currentImages`, zod DTO 안 필드명은 `existing` — 후자는 `coupleInfoClientSchema` 선례를 따른 것이라 둘이 다른 게 정상이다.)

### 최종 `images` 조립 (순서 보존)

```
images = [...images.existing, ...uploadedNewImageUrls]
```

기존 URL이 앞, 신규 업로드가 뒤. 삭제는 `currentImages`에서 그 URL을 빼서 보내는 것으로 표현한다(별도 delete 엔드포인트 없음 — Cloudinary 원본은 남지만 이번 스코프 아웃).

**이미지를 전혀 건드리지 않는 수정도 통과해야 한다** — 그 경우 `newFiles`가 비고 `existing`에 기존 URL 전부가 실려 오므로 합계 검증(`existing.length + newFiles.length >= 1`)을 통과한다. 폼이 `currentImages` hidden input을 안 보내면 물리 상품 수정이 전부 막히므로, ui-designer 쪽 폼 구현에서 이 hidden input 누락이 없어야 한다(§8 체크리스트 9번).

### 응답 shape
```ts
{ success: true, data: { message: "상품이 성공적으로 수정되었습니다." } }
```
에러 매핑은 §2와 동일 + 아래 `NOT_FOUND` 1행 추가.

### ★REQ-7★ `updateProductService`의 `null` 리턴을 반드시 검사한다

**현재 `updateProduct.ts:67`은 서비스 리턴값을 버리고 무조건 `success: true`를 돌려준다.** 수정이 실제로 일어나지 않아도 어드민에게는 "수정 완료"가 뜬다. 카테고리가 `invitation` 하나뿐일 땐 도달 불가능했지만 **REQ-1이 카테고리를 5개로 늘리면서 처음 열리는 경로**다(기존 부채가 아니라 이번 피처가 만든 신규 리스크).

**메커니즘**: `product.model.ts:142`가 `discriminatorKey: "category"`라, mongoose는 discriminator 모델의 쿼리에 판별 조건을 강제 주입한다 — `node_modules/mongoose/lib/query.js:3347-3348`:
```js
if (schema && schema.discriminatorMapping && !schema.discriminatorMapping.isRoot) {
  query._conditions[schema.discriminatorMapping.key] = schema.discriminatorMapping.value;
}
```
따라서 `favor` 상품을 `invitation`으로 바꾸려 하면:
1. `getWritableProductModel("invitation")` → `InvitationProductModel` 선택 (`product.service.ts:25-26`) — **바뀐 category 기준**
2. 쿼리에 `category: "invitation"` 자동 주입
3. 대상 문서는 아직 `category: "favor"` → **매칭 실패 → `null`**
4. 액션이 검사 없이 `success: true` → **무증상 데이터 불일치**

**확정 조치 (리더 판정: 최소조치)**
```ts
const updated = await updateProductService(productId, { ... });
if (!updated) {
  throw new AppError("NOT_FOUND", "상품을 찾을 수 없습니다.");
}
```
- try 블록 **안**에서 throw한다 — 기존 `catch (e) { return actionError(e); }`가 받아 `{ success:false, error }`로 번역한다(`ERROR_HANDLING.md` §채널 A: 핵심 로직은 throw만 한다).
- `updateProductService`는 `isObjectIdOrHexString` 실패 시에도 `null`을 리턴하므로(`product.service.ts:238-240`) 이 검사가 잘못된 productId까지 같이 커버한다.

| 조건 | category | fieldErrors | message |
|---|---|---|---|
| 대상 문서 없음 / 카테고리 변경으로 매칭 실패 / 잘못된 productId | `NOT_FOUND` | 없음 | `"상품을 찾을 수 없습니다."` |

**스코프 경계**: 카테고리 변경이 **성공하게** 만드는 건 이번 스코프가 아니다(리더 판정 — 완전 해결책인 delete+recreate 또는 폼에서 category 잠금은 별건). 이번 목표는 **"실패를 조용히 삼키지 않는 것"까지**다. 즉 REQ-7 적용 후에도 카테고리 변경 시도는 여전히 실패하며, 다만 `NOT_FOUND` 에러로 명시적으로 실패한다.

---

## 4. 엔드포인트 #3 — `createOrder` (채널 A) ★REQ-5★

| 항목 | 값 |
|---|---|
| 경로/함수 | `src/server/actions/createOrder.ts` → `createOrder(_prev, formData)` |
| 메서드 | Server Action |
| 채널 | **A** |
| 인증 | **필요.** 쿠키 없으면 `redirect(routes.login)`(try 밖), 이후 `requireAuth()` |
| 응답 성격 | **즉시** (결제 자체는 이후 PortOne SDK + `completePayment` 별도 흐름 — 이번 스코프 아웃) |

### 요청 shape — 변경 없음

FormData 키는 전부 현행 유지다. 수량 키는 **`productQuantity`**이지 `quantity`가 아니다 — 헷갈리기 쉬운 지점이라 명시한다.

```
useCheckoutForm.ts:53  formData.append("productQuantity", String(quantity))
   → createOrder.ts:54  data.product.quantity = Number(formData.get("productQuantity"))
   → createOrderSchema  product.quantity: z.number().min(1).default(1)
   → DB 저장 경로        order.product.quantity   (ProductSnapShotSchema)
```

> **수량 필드의 정확한 경로는 `order.product.quantity`다 — top-level `Order.quantity`가 아니다.** TODO.md가 "`Order.quantity`(`order.model.ts:20`)"로 표기했지만 그 라인은 `ProductSnapShot` 인터페이스 **안**이고, `IOrder`에 top-level `quantity`는 존재하지 않는다(db-migrator 확인). `order.model.ts` 스키마 변경은 불필요하다 — 필드가 이미 있고 `{ type: Number, required: true, default: 1 }`이다.

`createOrderSchema`(`request/order.schema.ts`)도 수정하지 않는다. **상품별 범위는 zod로 검증할 수 없다** — 상품 문서를 읽어야 알 수 있는 값이라 스키마의 정적 제약으로 표현 불가능하다. 그래서 서비스 레이어 검증이다.

### REQ-5 검증 위치 — 서비스 레이어

`createOrderService`(`src/server/services/order.service.ts:15`) 안에서, `OrderModel.create` **이전에** 검증한다.

**클라이언트가 보낸 `minQuantity`/`maxQuantity`를 신뢰하지 않는다** — 요청 본문에 그 두 값을 싣지 않고, `product.productId`로 DB에서 다시 읽는다(`src/server/actions/CLAUDE.md`: "클라이언트가 넘긴 값을 소유권 판단 없이 그대로 쓰지 않는다"). 필요한 조회:

```ts
ProductModel.findOne({ _id: productId, deletedAt: null })
  .select("minQuantity maxQuantity")
  .lean();
```

배치: `product.service.ts`에 얇은 조회 함수를 추가하고 `order.service.ts`가 호출한다(Product 소유 데이터 + 폴백 규칙(§1-2)이 이미 product 쪽 관심사 — db-migrator 합의).

**구현 조건 2개 (누락 시 검증이 조용히 무력화된다)**
1. **`.lean()` 결과에는 mongoose `default`가 적용되지 않는다** — Document를 만들지 않기 때문이다. 따라서 레거시 invitation 문서는 여기서도 `undefined`가 나온다. `?? 1` / `?? 1` 폴백을 **반드시** 적용한다. 안 하면 `quantity < undefined`, `quantity > undefined`가 둘 다 `false`라 **모든 수량이 검증을 통과한다** — 실패가 아니라 무증상 통과라 테스트로 잡기 어렵다.
2. 조회 앞에 `mongoose.isObjectIdOrHexString(productId)` 가드를 둔다 — 이 파일의 기존 패턴(`incrementProductViewsService`, `getProductService`).

### 검증 규칙

```
product = 조회 결과
if (!product)                              → AppError("NOT_FOUND", "상품을 찾을 수 없습니다.")
min = product.minQuantity ?? 1
max = product.maxQuantity ?? 1              // §1-2 레거시 폴백과 동일 규칙
if (quantity < min)                        → AppError("VALIDATION", `이 상품은 최소 ${min}개부터 주문할 수 있습니다.`)
if (max !== 0 && quantity > max)           → AppError("VALIDATION", `이 상품은 최대 ${max}개까지 주문할 수 있습니다.`)
// max === 0 이면 상한 검증 스킵 (무제한)
```

### 에러 카테고리 매핑 (REQ-5 핵심)

| 조건 | category | HTTP 상당 | fieldErrors | message |
|---|---|---|---|---|
| 수량이 `minQuantity` 미만 | **`VALIDATION`** | (400) | **없음 (`undefined`)** | `"이 상품은 최소 {min}개부터 주문할 수 있습니다."` |
| 수량이 `maxQuantity` 초과 (`max !== 0`) | **`VALIDATION`** | (400) | **없음** | `"이 상품은 최대 {max}개까지 주문할 수 있습니다."` |
| 상품 없음/삭제됨 | `NOT_FOUND` | (404) | 없음 | `"상품을 찾을 수 없습니다."` |
| 미로그인 | `UNAUTHENTICATED` | (401) | 없음 | `requireAuth()` 원문 |
| 그 외 저장 실패 | `INTERNAL` | (500) | 없음 | 일반화 문구 |

**설계 근거 3가지 (경계면 검증 대상)**

1. **새 에러 카테고리를 만들지 않는다.** taxonomy는 `VALIDATION` / `UNAUTHENTICATED` / `FORBIDDEN` / `NOT_FOUND` / `INTERNAL` / `DISABLED` / `EXTERNAL_SERVICE` 7개 고정이다(`src/shared/types/error.ts`, `ERROR_STATUS_MAP`). `BAD_REQUEST` 같은 이름은 이 프로젝트에 없다.
2. **`fieldErrors`를 채우지 않는다.** `docs/ERROR_HANDLING.md`: "필드별 검증 에러(폼 input 단위)는 `AppError`에 넣지 않는다 — zod 검증 실패는 services를 거치지 않고 Server Action 안에서 바로 만들어지는 별개 경로이기 때문이다." 이 검증은 services가 던지므로 message만 실린다. 클라이언트에서 `getFieldError(state, "quantity")`는 **항상 `undefined`** — 인라인 필드 에러 렌더 경로를 만들지 않는다.
3. **message 원문이 클라이언트까지 그대로 간다.** `ERROR_SAFE_MESSAGES`는 `INTERNAL` / `EXTERNAL_SERVICE` 2개만 일반화한다(`src/shared/constants/error.ts`). `VALIDATION`은 대상이 아니므로 위 문구가 그대로 렌더된다 — 그래서 문구 조립은 전적으로 서버 몫이고 클라이언트는 조립하지 않는다(`src/client/CLAUDE.md`).

### 표시 경로 — 신규 UI 0개 (ui-designer 정정 확인 완료)

에러 3종(하한/상한/NOT_FOUND)은 **기존 결제 화면의 destructive 배너에 그대로 뜬다.** 토스트를 새로 붙이지 않는다.

```
createOrder 리턴 { success:false, error }
  → payment/_components/CheckoutForm.tsx:49  setErrorMessage(state.error.message)
  → organisms/CheckoutForm.tsx:51-59         destructive 배너에 errorMessage 렌더
```

즉 **프론트 코드 변경 없이** 서버 message가 그대로 노출된다. 이 경로는 `success === false`이기만 하면 category를 안 가리므로, 위 표의 어떤 category든 동일하게 배너에 뜬다.

### 응답 shape — 변경 없음

```ts
{ success: true, data: { merchantUid, finalPrice, payMethod, buyerName, buyerEmail,
                         buyerPhone, title, userId, productId, message } }
```

### 가격 계산 — 변경 없음 (ui-designer 합의 E)

`order.service.ts:28-37` 현행 유지:
```
productTotal = discountedPrice * quantity     // 상품가는 수량 곱
optionsTotal = Σ selectedFeatures[].price     // 옵션가는 수량 미곱
finalPrice   = max(0, floor((productTotal + optionsTotal) * (1 - discountRate) - discountAmount))
```
옵션가에 수량을 곱하는 정책 변경은 이번 스코프 아웃.

---

## 5. 엔드포인트 #4 — `GET /api/products` (채널 B)

| 항목 | 값 |
|---|---|
| 경로 | `/api/products?category={category}` |
| 메서드 | `GET` |
| 채널 | **B** — `useSWR` 캐싱/재검증이 필요한 조회(`docs/DATA_ACCESS.md` row 3) |
| 인증 | **불필요.** `requireAuth()` 호출 없음 (공개 카탈로그) |
| 응답 성격 | **즉시** |

### 요청

쿼리 파라미터 `category` (optional). 값 범위는 §1-3의 `PRODUCT_CATEGORIES`. **현재 라우트는 `category`를 zod로 검증하지 않고 `getAllProductsService`에 그대로 넘긴다** — 범위 밖 값이 오면 에러가 아니라 빈 배열이 나온다. 이번 스코프에서 이 동작을 바꾸지 않는다(변경하면 기존 소비처 회귀 위험, 별도 항목).

### 응답 shape — ★페이지네이션/wrapping 규칙★

**배열을 그대로 싣는다. `{ items, total }` 같은 추가 wrapping을 도입하지 않는다.**

```ts
{ success: true, data: ProductResponse[] }    // ← data가 곧 배열
```

- 페이지네이션 없음. `limit`/`offset`/`cursor` 파라미터 없음. 전체를 한 번에 내려준다.
- 프론트는 `response.data`를 배열로 바로 순회한다. `response.data.items` 아님.
- `total`을 별도로 내려주지 않는다 — 필요하면 `data.length`.
- 신규 카테고리 4종이 붙으면서 문서 수가 늘어나므로 향후 페이지네이션이 필요해질 수 있으나, **이번 기능에서 도입하지 않는다**(도입하면 wrapping 변경 = 모든 소비처 회귀). §9 미해결 쟁점 아님, 명시적 스코프 아웃.

### 에러 카테고리

| 조건 | category | HTTP status |
|---|---|---|
| DB 조회 실패 | `INTERNAL` | 500 |

`routeError`가 `ERROR_STATUS_MAP`으로 status를 매핑한다. 라우트 안에서 `Response.json`을 직접 호출하지 않는다(`src/app/api/CLAUDE.md`).

---

## 6. 엔드포인트 #5 — `GET /api/products/search` (채널 B)

| 항목 | 값 |
|---|---|
| 경로 | `/api/products/search?q={term}` |
| 메서드 | `GET` |
| 채널 | **B** |
| 인증 | **불필요** |
| 응답 성격 | **즉시** |

### 요청
`q` — `productSearchRequestSchema`로 검증. 실패 시 `AppError("VALIDATION", "검색어를 확인해주세요.", fieldErrors)`.

### 응답 shape
`/api/products`와 **동일하게 배열 그대로**. wrapping 없음, 페이지네이션 없음.
```ts
{ success: true, data: ProductResponse[] }
```

### 에러 카테고리

| 조건 | category | HTTP status | fieldErrors |
|---|---|---|---|
| `q` 검증 실패 | `VALIDATION` | 400 | 있음 (`q`) |
| DB 조회 실패 | `INTERNAL` | 500 | 없음 |

### 이번 기능과의 접점
신규 카테고리/서브카테고리가 `productCategoryLabels` / `subCategoryLabels`에 등록돼야 `findProductCategoriesByTerm` / `findSubCategoriesByTerm` 역조회가 동작한다(§1-3 3번).

---

## 7. zod 스키마 초안

> 설계 단계 초안이다. Phase2에서 backend-impl이 다듬을 수 있음을 전제한다.
> **실제 소스 파일에는 쓰지 않았다** — Phase1 병렬 작업(db-migrator가 model, ui-designer가 component) 중 동일 파일 충돌을 피하기 위해 계약서에 붙여넣기 가능한 형태로만 남긴다. Phase2 backend-impl이 아래를 그대로 적용한다.

### 7-1. `src/shared/schemas/request/product.schema.ts` (수정)

`.refine` 2개는 그대로 두고 **필드 3개 + `.superRefine` 검증 2개**를 추가한다.

```ts
import * as z from "zod";
import { SUB_CATEGORY_MAP, SubCategory, PRODUCT_CATEGORIES } from "@/shared/utils";

export const productSchema = z
  .object({
    // ── 기존 필드 (변경 없음) ─────────────────────────────
    title: z.string().min(1, "상품명을 입력해주세요."),
    description: z.string().min(10, "상품 설명은 최소 10자 이상이어야 합니다."),
    category: z.enum(PRODUCT_CATEGORIES),
    subCategory: z.string().min(1, "서브 카테고리를 선택해주세요."),
    theme: z.enum(["blossom", "default"]).optional(),
    price: z.number().min(0, "가격은 0 이상이어야 합니다."),
    isPremium: z.boolean(),
    featureIds: z.array(z.string()).optional(),
    isFeatured: z.boolean(),
    priority: z.number(),
    discount: z.object({
      discountType: z.enum(["rate", "amount"]),
      value: z.number().min(0),
    }).optional(),
    status: z.enum(["active", "inactive", "soldOut", "deleted"]).optional(),
    thumbnail: z
      .instanceof(File, { message: "썸네일 이미지를 등록해주세요." })
      .refine((file) => file.size > 0, { message: "썸네일 이미지를 등록해주세요." }),

    // ── 신규 (REQ-2 / REQ-3) ─────────────────────────────
    // 업로드 이전에 검증하므로 "유지할 기존 URL"과 "신규 파일"을 같이 받는다.
    // 형태는 request/coupleInfo.schema.ts:53-70 (coupleInfoClientSchema) 선례 그대로.
    images: z.object({
      existing: z.array(z.string().url("유효한 URL이어야 합니다.")).default([]),
      newFiles: z.array(z.instanceof(File)).default([]),
    }).default({ existing: [], newFiles: [] }),
    minQuantity: z
      .number()
      .int("최소 구매 수량은 정수여야 합니다.")
      .min(1, "최소 구매 수량은 1 이상이어야 합니다.")
      .default(1),
    maxQuantity: z
      .number()
      .int("최대 구매 수량은 정수여야 합니다.")
      .min(0, "최대 구매 수량은 0 이상이어야 합니다.")   // 0 = 무제한
      .default(0),
  })
  // ── 기존 refine 2개 (변경 없음) ────────────────────────
  .refine(
    (data) => !(data.isPremium && (!data.featureIds || data.featureIds.length === 0)),
    { message: "옵션을 선택해주세요.", path: ["featureIds"] },
  )
  .refine(
    (data) => {
      const allowed = SUB_CATEGORY_MAP[data.category as keyof typeof SUB_CATEGORY_MAP];
      return allowed?.includes(data.subCategory as SubCategory) ?? false;
    },
    { message: "해당 카테고리에서 허용되지 않는 서브 카테고리입니다.", path: ["subCategory"] },
  )
  // ── 신규 (REQ-3) ─────────────────────────────────────
  // invitation은 previewUrl이 상세 확인을 대신하므로 images 없이도 판매 성립.
  // 물리 상품 4종(favor/accessory/guestbook/ceremony)은 최소 1장 필요.
  // 수정 흐름(이미지 안 건드림)을 위해 "유지 URL + 신규 파일" 합계로 센다.
  // category를 참조하므로 중첩 객체 안이 아니라 최상위 refine이어야 한다.
  .refine(
    (data) =>
      data.category === "invitation" ||
      data.images.existing.length + data.images.newFiles.length > 0,
    { message: "상세 이미지를 1장 이상 등록해주세요.", path: ["images"] },
  )
  // maxQuantity 0(무제한)은 하한 비교 대상이 아니다.
  .refine(
    (data) => data.maxQuantity === 0 || data.maxQuantity >= data.minQuantity,
    {
      message: "최대 구매 수량은 최소 구매 수량보다 크거나 같아야 합니다.",
      path: ["maxQuantity"],
    },
  );

export type ProductDto = z.infer<typeof productSchema>;
```

**`fieldErrors` 키 계약 (ui-designer 합의 C — 고정)**: `images`, `minQuantity`, `maxQuantity`. `getFieldError(state, key)`가 이 3개 키로 인라인 렌더한다.

> **구현 주의 (backend-impl)**: `.refine`/`.superRefine` 이후 스키마는 `ZodEffects`라 `.extend()`/`.partial()`이 불가능하다. 기존 코드도 이미 그 형태이므로 새 제약은 아니다.

### 7-2. `src/shared/schemas/response/product.schema.ts` (수정)

```ts
export const productResponseSchema = z.object({
  // ... 기존 필드 전부 유지 ...

  // ── 신규 (REQ-2) — 셋 다 non-optional ──────────────────
  images: z.array(z.string()),
  minQuantity: z.number(),
  maxQuantity: z.number(),
});

// 배열 응답은 지금처럼 z.array로만 감싼다 — { items, total } wrapping 도입 안 함.
export const productsResponseSchema = z.array(productResponseSchema);

export type ProductResponse = z.infer<typeof productResponseSchema>;
```

**요청/응답 shape 비대칭은 의도다** — `images`가 요청 DTO에선 `{ existing, newFiles }`, 응답에선 `string[]`이다. 경계면 검증에서 "불일치"로 오판하지 말 것(§1 표 아래 근거 참고).

> **`ProductJSON`(`src/server/models/product.model.ts:66`)에는 세 필드를 따로 선언하지 않는다** — `Omit<ProductDB, "likes" | "featureIds" | "deletedAt">` 기반이라 `ProductDB`에 필드가 추가되면 자동 반영된다. 중복 선언하면 두 곳이 갈릴 여지만 생긴다. (db-migrator 확인 사항)

### 7-3. `src/shared/schemas/request/order.schema.ts` — **변경 없음**

`product.quantity: z.number().min(1).default(1)` 그대로. 상품별 범위는 정적 스키마로 표현 불가(§4).

---

## 8. 경계면 체크리스트 (boundary-verifier용)

Phase3에서 확인할 항목을 미리 고정한다.

| # | 체크 항목 | 기대값 |
|---|---|---|
| 1 | 목록 응답 wrapping | `data`가 **배열 그대로**. `data.items` 아님. `/api/products`, `/api/products/search` 둘 다 |
| 2 | 필드명 케이스 | `images` / `minQuantity` / `maxQuantity` — DB·요청·응답 3곳 전부 camelCase 동일. snake_case 유입 0건 |
| 3 | 응답 optional 여부 | 3필드 전부 non-optional. **클라이언트 쪽 폴백 코드 0건**(`?? 1`이든 `?? 0`이든 `?.`이든) |
| 4 | 레거시 폴백 위치 | `transformProduct` 한 곳에만. mongoose 훅/클라이언트에 중복 폴백 없음. 값은 `?? 1` / `?? 1` |
| 5 | REQ-5 에러 category | `VALIDATION` (신규 카테고리 도입 0건) |
| 6 | REQ-5 `fieldErrors` | `undefined`. UI에 `getFieldError(state, "quantity")` 호출 0건 |
| 7 | REQ-5 검증 데이터 출처 | 클라이언트 FormData가 아니라 **DB 재조회**. 요청 본문에 `minQuantity`/`maxQuantity` 없음 |
| 8 | 수량 FormData 키 / 저장 경로 | 키는 `productQuantity`(`quantity` 아님), 저장 경로는 `order.product.quantity`(top-level 아님) |
| 9 | 이미지 유지 키 | FormData 키 `currentImages`(`existingImages` 아님) ↔ zod DTO `images.existing`. 수정 폼이 hidden input을 실제로 보내는지 확인 — 누락 시 물리상품 수정이 전부 막힘 |
| 10 | `images` 요청/응답 비대칭 | 요청 DTO `{existing,newFiles}` ↔ DB/응답 `string[]`. **의도된 비대칭**이므로 불일치로 판정하지 말 것 |
| 11 | `.lean()` + default 함정 | REQ-5 조회와 `transformProduct` **양쪽 모두** `?? 1` 폴백 존재. 빠지면 수량 검증이 무증상 통과 |
| 12 | 위 함정의 테스트 커버 | **test-suite 요청 사항**: `minQuantity`/`maxQuantity` 필드가 아예 없는 레거시 Product 문서 픽스처가 있어야 한다. 정상 케이스(필드 있는 신규 문서)만으로는 이 결함이 절대 드러나지 않는다 |
| 13 | 빈 File 엔트리 필터 | 액션에서 `newFiles`를 `size > 0`으로 필터. 안 하면 빈 file input이 "이미지 있음"으로 오판됨 |
| 14 | `maxQuantity === 0` 처리 | 상한 검증 스킵(주문) + 상한 없는 stepper(UI). "0개까지"로 해석하는 코드 0건 |
| 15 | 카테고리 원본 | `category.ts` 단일 원본. model/schema/route에 카테고리 문자열 재하드코딩 0건 |
| 16 | 라벨 map 동기화 | `productCategoryLabels`/`subCategoryLabels`에 **신규 4카테고리 + 신규 14서브카테고리**(최종 5 / **16 — invitation 기존 2개 포함**) 전부 존재. 신규 14개만 채우면 라벨 누락으로 조용히 깨짐. 검색 역조회(`findSubCategoriesByTerm`)와 타입가드(`isProductCategory`/`isSubCategory`)가 여기 의존. `src/app/(main)/_constants/subCategoryIcons.ts` 키 동기화도 필요(ui-designer §5, 누락 시 빌드 실패) |
| 17 | `Number("")` 사고 | 액션에서 빈 값 → `undefined` 처리. `minQuantity: 0`으로 파싱되는 경로 0건 |
| 18 | 채널 준수 | 주문/상품 mutation은 전부 채널 A. 클라이언트 raw `fetch` 0건. `/api/order/create`는 DISABLED 유지 |
| 19 | **REQ-7** 무증상 성공 제거 | `updateProduct`가 `updateProductService`의 `null`을 검사해 `AppError("NOT_FOUND")` throw. **리턴값을 버리는 코드 0건.** `success: true`가 실제 DB 변경 없이 나가는 경로 0건 |
| 20 | REQ-7 회귀 테스트 | **test-suite 요청**: 기존 category와 **다른** category로 `updateProduct`를 호출하는 케이스 필요. 같은 category로만 테스트하면 이 결함이 드러나지 않는다(기대값은 "변경 성공"이 아니라 **`NOT_FOUND` 반환**) |

---

## 9. 쟁점 처리 현황 — **미해결 0건 (리더 판정 완료)**

| # | 쟁점 | 현재 확정안 | 상태 |
|---|---|---|---|
| 1 | mongoose `images` required 여부 (db-migrator Q1) | DB엔 required 걸지 않고 `default: []`만. 조건부 required는 zod에서만 | **합의 완료.** db-migrator가 근거 보강: mongoose 배열 path의 `required`는 빈 배열 `[]`도 통과시켜서 어차피 "1장 이상"을 집행 못 한다 → zod가 유일한 집행 지점 |
| 2 | 복합 인덱스 (db-migrator Q3) | `{ deletedAt: 1, category: 1, isFeatured: -1, priority: -1, createdAt: -1 }` — ESR 순서 타당하나 **이번 PR 스코프 아웃** | db-migrator가 `01_db_schema.md §5-2`로 리더 이관. 근거: 현재 `productSchema`에 인덱스가 `_id` 외 0개(기존 부채)고, 성능 변경을 기능 PR에 섞으면 회귀 원인 분리가 안 됨. 또 저 인덱스는 category 지정 호출만 커버(전체 목록은 여전히 in-memory sort) → 둘 다 커버하려면 2개, 데이터 규모 보고 판단할 일. ✅ **리더 판정: 스코프 아웃 확정.** |
| 3 | `uploadProductImage` 폴더 인자 값 | `"images"` 제안 | backend-impl이 `src/server/lib/cloudinary/upload.ts` 시그니처 확인 후 확정. **계약 블로킹 아님** |
| 4 | 이미지 삭제 시 Cloudinary 원본 정리 | 안 함(`currentImages`에서 빼면 참조만 끊김) | **스코프 아웃** — 별도 항목으로 TODO 등록 권장 |
| 5 | 상품 목록 페이지네이션 | 도입 안 함(배열 그대로) | **스코프 아웃**. 카테고리 확장으로 문서 수가 늘면 재검토 필요 — 리더 판단 요청 |
| 6 | `updateProduct`의 `thumbnail` required 부채 | 기존 `productSchema`가 `thumbnail: File(size>0)` required라 수정 시에도 썸네일 재업로드가 강제되는 구조. `images`는 `existing` 합산으로 이 부채를 반복하지 않게 설계했으나, thumbnail 자체는 손대지 않음 | ✅ **리더 판정: 스코프 아웃 확정.** 이번 피처(quantity/카테고리)와 무관한 기존 버그라 리더가 최종보고 때 `TODO.md` 버그수정 섹션에 별도 등록. **backend-impl은 이번 PR에서 thumbnail을 건드리지 않는다** |
| 7 | REQ-1 서브카테고리 개수 표기 오류 | 라인업은 정확하나 개수가 13이 아니라 **14** | ✅ **해소됨.** `00_requirements.json`이 이미 14개로 수정 완료(db-migrator 최초 지적 시 반영). §1-3의 "개수" 노트는 이력 참고용 |
| 8 | 카테고리 변경 시 `updateProduct`가 조용히 성공 응답 | `updateProductService`의 `null` 리턴을 검사해 `AppError("NOT_FOUND")` (§3 ★REQ-7★) | ✅ **리더 판정: 최소조치 채택 → `REQ-7`로 승격.** 완전 해결(카테고리 변경 차단/폼 잠금)은 이번 PR엔 무거워 기각, 스코프 아웃은 무증상 데이터 불일치를 안고 가는 거라 기각. **이번 목표는 "실패를 명시적으로 알리는 것"까지** |

---

## 10. 동료 합의 로그

| 상대 | 쟁점 | 결과 | 라운드 |
|---|---|---|---|
| ui-designer | A. 응답 3필드 non-optional | 합의 | 1 |
| ui-designer | A. 레거시 폴백 값 `maxQuantity ?? 1` | **ui-designer 안 채택** (내 초안 `?? 0` 철회 — invitation 회귀 유발) | 1 |
| ui-designer | B. FormData 키 `existingImages` → `currentImages` | **내 안 채택** (`current*` 기존 컨벤션) | 1 |
| db-migrator | 요청 `images` zod shape: flat 2필드 vs `{existing,newFiles}` | **db-migrator 안 채택** — `coupleInfoClientSchema`(`request/coupleInfo.schema.ts:53-70`) 선례 존재. 새 컨벤션 만들지 않는다는 원칙 우선. FormData 키(`images`/`currentImages`)는 내 안 유지 | 2 |
| db-migrator | 필드명 3개 camelCase, DB↔응답 1:1 | 합의 (매핑 코드 0) | 1 |
| db-migrator | `Order.quantity` 경로 | **db-migrator 정정 채택** — `order.product.quantity`(top-level 아님). TODO.md 표기가 부정확했음. `order.model.ts` 변경 불필요 | 1 |
| db-migrator | `.lean()`에는 mongoose default 미적용 | **db-migrator 근거 채택** — (a)안(서비스 폴백)이 선택이 아니라 필수임이 확정됨. REQ-5 조회에도 동일 폴백 필요(누락 시 검증 무증상 통과) | 1 |
| ui-designer | C. `fieldErrors` path 3개 | 합의 (`images`/`minQuantity`/`maxQuantity`) | 1 |
| ui-designer | D. REQ-5 에러 category `BAD_REQUEST` | **내 정정 채택** → `VALIDATION` (taxonomy 7개 고정, 신규 불가) | 1 |
| ui-designer | D. REQ-5 에러 표시 수단 | **ui-designer 재정정 채택** — 토스트 아님. 기존 결제 배너(`organisms/CheckoutForm.tsx:51-59`)에 자동 노출, 프론트 변경 0. 코드 확인 완료 | 2 |
| ui-designer | 요청 `images` shape | db-migrator와 동일 결론(`{existing,newFiles}`)에 독립 도달 → 3자 합의 | 2 |
| ui-designer | `maxQuantity` 무제한 Checkbox (빈 값 1차 방어) | 합의 — 액션의 `undefined` 처리는 2차 방어로 유지(이중 방어) | 1 |
| ui-designer | E. 옵션가 수량 미곱 유지 | 합의 (현행 유지) | 1 |
| db-migrator | Q1~Q4 (필드명/required/인덱스/폴백) | 발신 + `maxQuantity ?? 1` 정정 발신. 회신 대기 | 1 |

3라운드 초과 왕복 없음.
