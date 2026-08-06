# 01 — UI 설계 (화면 플로우 / 컴포넌트 트리 / 상태 전이 / 폼 유효성)

- 브랜치: `feat/product-category-quantity`
- 대상 요구사항: REQ-1(카테고리 라인업), REQ-2/REQ-3(필드·검증) 중 **폼 입력 측면**, **REQ-4(핵심)**, REQ-5(주문 수량 검증)의 **에러 표시 측면**, **REQ-6(invitation 전용 필드 조건부 렌더 — 리더 승인으로 권장→요구사항 승격)**
- 협업 상태: api-designer 계약 5건(A~E) + 정정 2건, db-migrator 4건 **전부 3자 합의 완료**. 리더 판정 2건 반영 완료(REQ-6 승인 / §7-4 스코프아웃). 3자 확정 사항은 §0.

---

## 0. 확정 전제 (api-designer / db-migrator 3자 합의, 2026-08-06)

| 축 | 확정 내용 | 합의 상대 |
|---|---|---|
| DB 필드명 | `images` / `minQuantity` / `maxQuantity` — camelCase, DB↔API↔UI 3중 동일. | db-migrator |
| DB 기본값 | `minQuantity` default 1 / `min: 1`, `maxQuantity` default 0 / `min: 0`(상한 없음), `images` default `[]`. 폼 defaultValue와 일치. | db-migrator |
| 응답 shape | `response/product.schema.ts`에 `images: z.array(z.string())` / `minQuantity: z.number()` / `maxQuantity: z.number()` **전부 non-optional**. 클라이언트에 폴백 없음. | api-designer |
| 레거시 정규화 | `product.service.ts`의 `transformProduct`에서 `minQuantity ?? 1`, `maxQuantity ?? 1`, `images ?? []`. mongoose default(`0`)와 읽기 폴백(`1`)이 다른 건 의도 — 레거시 문서는 전부 invitation이라 1 고정이 맞다. | 양측 |
| **요청 payload — `images`** | **`string[]`이 아니다.** 이 프로젝트 product 액션은 업로드 **전에** zod 검증을 한다(`createProduct.ts:38` 검증 → `:56` Cloudinary 업로드). 따라서 `coupleInfo` 선례와 동일하게 **`images: { existing: string[], newFiles: File[] }`** 형태로 검증한다. 액션이 `newFiles`만 업로드해 `[...existing, ...uploadedUrls]`로 합쳐 DB에 `string[]` 저장. | db-migrator (★정정 반영) |
| 요청 FormData 키 | 신규 파일 `images`(file, 다중) / 유지할 기존 URL `currentImages`(hidden string, 다중) / `minQuantity` / `maxQuantity`. **`existingImages` 아님** — 기존 `currentThumbnail`/`currentPreviewUrl` 접두사와 통일. | 양측 |
| fieldErrors path | `images` / `minQuantity` / `maxQuantity` 3개 확정. 교차검증은 `maxQuantity`에 붙는다. | api-designer |
| REQ-5 에러 | category `VALIDATION`, **`fieldErrors` 없음(undefined)**. `state.error.message`를 그대로 렌더. 서버는 상한과 무관하게 `quantity`가 양의 정수인지도 검증한다(UI clamp는 방어선이 아님). | 양측 |
| 결제 계산식 | `finalPrice = discountedPrice * quantity + optionsTotalPrice` (옵션가는 수량 미곱) — 현행 유지. | api-designer |
| 주문 요청 키 | `useCheckoutForm.ts:53`의 `formData.append("productQuantity", ...)` — **`quantity`가 아니라 `productQuantity`**. 현행 유지, 변경 없음. | api-designer |
| 무제한 UI 상한 | `softMax = 99` 승인. **DB/서버에는 상한 제약이 없다 — 순수 UI 편의 상한이다**(경계면 검증에서 "UI 99 vs 서버 무제한 = 불일치"로 오판하지 말 것). | db-migrator |
| `images` zod 정의 | `z.object({ existing: z.array(z.string().url()).default([]), newFiles: z.array(z.instanceof(File)).default([]) }).default({...})`. 조건부 required refine은 **최상위 `.refine` + `path:["images"]`** — 형제 필드 `category`를 참조해야 해서 중첩 객체 안에 못 붙인다(coupleInfo가 객체 안에 붙일 수 있었던 건 조건이 없어서). | api-designer |
| `maxQuantity` 방어선 | UI "무제한" Checkbox가 **1차**(§3-4), 액션의 빈 문자열/null → `undefined` → zod `.default()`가 **2차**. 폼을 우회한 직접 Server Action 호출이 가능하므로 2차를 생략하지 않는다. | api-designer |

### ★ 의도된 비대칭 2건 — 경계면 검증에서 "불일치"로 판정하지 말 것

3자 합의로 확정된 것이며, 각각 이유가 있다:

1. **`images` 요청 DTO `{ existing, newFiles }` ≠ 응답 `string[]`** — 요청은 업로드 전(파일+기존URL), 응답은 업로드 후(URL 배열)라 같은 이름이지만 다른 단계의 타입이다. `thumbnail`이 요청에선 `File`, 응답에선 `string`인 기존 비대칭과 동일한 패턴.
2. **FormData 키 `currentImages` ≠ DTO 필드명 `existing`** — FormData 키는 기존 `currentThumbnail`/`currentPreviewUrl` 접두사 관행을 따르고, DTO 필드명은 `coupleInfo`의 `{existing, newFiles}` 선례를 따른다. 액션의 매핑 코드(§4-2)가 유일한 접점이다.

---

## 1. 화면 플로우

라우트 그룹 `(main)` / `(products)` / `(admin)` / `(checkout)`은 URL에서 제거된다. **아래 "실제 도달 URL"이 boundary-verifier 대조 기준이다.**

| 파일 경로 | 실제 도달 URL |
|---|---|
| `src/app/(main)/(products)/products/[category]/[id]/page.tsx` | `/products/{category}/{id}` (예: `/products/favor/68a...`) |
| `src/app/(main)/(products)/products/[category]/page.tsx` | `/products/{category}` (예: `/products/guestbook`) |
| `src/app/(admin)/admin/products/new/page.tsx` | `/admin/products/new` |
| `src/app/(admin)/admin/products/page.tsx` | `/admin/products` (수정은 Dialog — **URL 변경 없음**, `useAdminModalStore`) |
| `src/app/(main)/(checkout)/payment/page.tsx` | `/payment` |

### 1-A. 구매자 플로우 (REQ-4 핵심 경로)

```
/products/{category}/{id}   [page.tsx — verifySession 불필요, 공개 페이지]
  └ ProductDetailTemplate (route-local)
      └ _components/ProductSummary (컨테이너: useOrderStore.setOrder + router.push)
          └ organisms/ProductSummary (순수)
              └ organisms/ProductOptions (순수)  ★ REQ-4 변경 지점
                  │
                  ├─ (진입) product.minQuantity/maxQuantity → 수량 모드 파생 (§3-1)
                  │     ├ mode="fixed"  → "1개" 고정 표시, 인터랙션 없음
                  │     ├ mode="range"  → molecules/QuantityStepper [min, max]
                  │     └ mode="open"   → molecules/QuantityStepper [min, softMax]
                  │
                  ├─ (수량 변경) quantity state 갱신 → 총 상품 금액 재계산
                  ├─ (옵션 선택/해제) selectedOptionIds 갱신 → 총 상품 금액 재계산
                  └─ (구매하기) CheckoutItem 조립(quantity 포함) → onPurchase
                                    ↓
              useOrderStore.setOrder(checkoutData)  [sessionStorage persist]
                                    ↓
                            router.push("/payment")
                                    ↓
/payment  [verifySession 통과 필요]
  └ CheckoutForm (컨테이너) → useCheckoutForm → formData.append("productQuantity", String(quantity))
                                    ↓
                          createOrder Server Action
                                    ↓
              ┌───────────────────────────────────────────┐
              │ 성공 → triggerPayment → /payment/success   │
              │ 실패(REQ-5 범위 밖) → state.error.message  │
              │        → organisms/CheckoutForm의          │
              │          errorMessage 배너에 그대로 렌더   │
              └───────────────────────────────────────────┘
```

**REQ-5 에러 표시에 신규 UI 없음.** `CheckoutForm.tsx:49`가 이미 `state.error.message`를 `errorMessage`로 뽑아 순수 `organisms/CheckoutForm.tsx:51-59`의 destructive 배너에 렌더한다. 토스트를 새로 붙이지 않는다 — 기존 경로가 이미 정확히 이 용도다. 서버가 내려주는 문구(하한 미달 / 상한 초과)를 클라이언트가 조립하지 않고 그대로 표시한다(`src/client/CLAUDE.md` 규칙).

### 1-B. 관리자 등록 플로우

```
/admin/products/new   [page.tsx — verifySession() 게이트 필수, docs/PAGE_ACCESS_CONTROL.md]
  └ _components/ProductRegistrationForm (컨테이너: useActionState(createProduct))
      └ organisms/ProductRegistrationForm (순수, 로컬 UI state 보유)
          ├ 카테고리 선택(SelectField) → selectedCategory
          │     └ 변경 시: 서브카테고리 옵션 교체 + images 필수 표기 토글
          │                + invitation 전용 필드(theme/previewUrl) 토글 ★REQ-6, §5
          ├ 상세 이미지 갤러리(ImageField + useImageList)  ★ 신규
          ├ 최소 구매 수량 Input + 최대 구매 수량 Input + "무제한" Checkbox  ★ 신규 (§3-5)
          └ submit → FormData → createProduct
                ├ 성공 → toast.success + router.push("/admin/products")
                └ VALIDATION 실패 → fieldErrors를 getFieldError()로 각 필드 하단 인라인 렌더
```

### 1-C. 관리자 수정 플로우

```
/admin/products  → 행 액션 클릭 → useAdminModalStore.openModal (URL 불변)
  └ _components/ProductEditDialog (컨테이너 겸 UI — 현행 구조 유지)
      ├ 기존 images URL → useImageList(product.images)로 초기화(existing 아이템)
      │     → 유지분은 hidden `currentImages` 반복 전송, 신규분은 file `images` 다중 전송
      ├ minQuantity → defaultValue={product.minQuantity}
      ├ "무제한" Checkbox → 초기값 product.maxQuantity === 0
      └ submit → updateProduct → 성공 시 toast + closeModal
```

---

## 2. 컴포넌트 트리

### 2-1. 재사용 (신규 생성 금지)

| 컴포넌트 | 티어 | 이번 용도 |
|---|---|---|
| `ImageField` | molecules | 상세 이미지 갤러리 업로드 UI. `items/onAdd/onRemove/maxCount` props로 이미 완성 — 그대로 쓴다. |
| `ImagePreviewItem` | molecules | `ImageField` 내부. 손 안 댐. |
| `useImageList` | hooks | `images` 상태(existing/new 구분, blob revoke, `getPayload()`) 전담. 이미 couple-info에서 검증된 훅. |
| `FormField` | molecules | label + required asterisk + `Alert` 에러 묶음. 신규 수량 필드에 사용. |
| `SelectField` | molecules | 카테고리/서브카테고리 — 변경 없음(§5 참고). |
| `Input` / `Label` / `Button` / `Card` / `Alert` | atoms/molecules | 수량 입력 필드 구성. |
| `getFieldError(state, key)` | shared/utils | 서버 fieldErrors → 인라인 문구. |
| `organisms/CheckoutForm`의 `errorMessage` 배너 | organisms | REQ-5 에러 표시(§1-A). 손 안 댐. |

### 2-2. 신규 — `src/client/components/molecules/QuantityStepper.tsx` 1개뿐

**왜 새로 필요한가:** 기존 molecules 어디에도 "숫자 증감 + 범위 clamp" 위젯이 없다(`StatusSelect`/`SelectField`는 enum 선택, `Input type=number`는 clamp/disabled 파생 로직이 없음). `Input type="number"` 하나로 대신하면 `min`/`max` 속성이 브라우저 네이티브 검증에만 걸려서 **버튼 disabled 상태·상한 없는 모드·fixed 모드를 컴포넌트 밖에서 매번 재구현**해야 한다. 단일 책임("수량 하나를 범위 안에서 고른다")이므로 축 A 기준 molecule이다(organism 아님 — 책임이 하나다).

**배치 근거(축 B):** 유일한 소비자가 라우트가 아니라 이미 공용 티어에 있는 `organisms/ProductOptions`이므로, `src/client/components/CLAUDE.md`의 "유일한 소비자가 다른 공유 컴포넌트면 승격-보류 규칙 대상 아님" 예외에 해당한다(`DateField`/`BasicInfoSection` 선례와 동일). 따라서 `molecules/`에 둔다. 배럴 `molecules/index.ts`에 등록.

**순수성:** props만 받는 controlled 컴포넌트. 도메인 로직/페칭/Server Action 없음.

```ts
interface QuantityStepperProps {
  id: string;
  value: number;
  min: number;
  max: number;          // 실제 상한(무제한 모드는 소프트 상한이 들어온다 — §7)
  onChange: (next: number) => void;
  disabled?: boolean;   // fixed 모드에서 true
  unlimited?: boolean;  // true면 상한 안내 문구/aria에 상한을 노출하지 않는다
}
```

### 2-3. 수정 대상

| 파일 | 변경 내용 |
|---|---|
| `src/client/components/organisms/ProductOptions.tsx` | **REQ-4 핵심.** `const quantity = 1`(87행) 제거 → `useState` + 파생 모드. 총 금액 계산에 quantity 반영. §3 참고. |
| `src/client/components/organisms/ProductRegistrationForm.tsx` | images 갤러리 카드 + 수량 카드(무제한 Checkbox 포함) 추가, **REQ-6** `theme`/`previewUrl` 조건부 렌더. |
| `src/app/(admin)/admin/products/_components/ProductEditDialog.tsx` | 동일 필드 추가 + `currentImages` hidden 전송, **REQ-6** `theme` 조건부 렌더(`previewUrl` UI는 원래 없음). |
| `src/client/components/molecules/index.ts` | `QuantityStepper` export 추가. |
| `src/shared/utils/category.ts` | REQ-1 — `productCategoryLabels`/`subCategoryLabels`에 **신규 4+13개 라벨 전부** 추가(§5의 회귀 위험 참고). |

### 2-4. 손대지 않는 것 (회귀 방지 경계)

- `_components/ProductSummary.tsx`(컨테이너), `organisms/ProductSummary.tsx` — `ProductOptions`에 `product`를 이미 통째로 넘기고 있어 prop 추가가 불필요하다.
- `useCheckoutForm.ts`, `createOrder` 요청 조립 — `productQuantity` 키 그대로.
- `organisms/OrderSummary.tsx` — §7-3의 문구 이슈만 별건으로 기록.

---

## 3. 클라이언트 상태 머신

### 3-1. 수량 모드 파생 (`ProductOptions` 내부, 순수 파생 — state 아님)

```
mode = derive(product.minQuantity, product.maxQuantity)
```

| # | 조건(위에서부터 평가) | mode | 렌더 | 근거 |
|---|---|---|---|---|
| 1 | `minQuantity === 1 && maxQuantity === 1` | `fixed` | 텍스트 "1개", `disabled` 고정, stepper 미렌더 | TODO.md 확정 규칙(invitation 회귀 없음) |
| 2 | `maxQuantity === 0` | `open` | stepper `[minQuantity, softMax]`, 상한 문구 없음 | TODO.md "상한 없는 stepper" |
| 3 | 그 외 | `range` | stepper `[minQuantity, maxQuantity]` | TODO.md |

- 규칙 2·3의 `minQuantity === maxQuantity`(예: 5개 세트 고정) 케이스는 별도 분기를 두지 않는다 — clamp 결과로 `+`/`-` 둘 다 자연히 disabled 되어 fixed와 동일하게 동작한다. **컴포넌트에 `category` if문을 넣지 않는다** — 분기 입력은 오직 `minQuantity`/`maxQuantity` 두 숫자다(TODO.md 확정 원칙).
- `mode`는 `useMemo(() => ..., [product.minQuantity, product.maxQuantity])`로 파생한다.

### 3-2. `quantity` 상태 전이표 (`ProductOptions` 소유, `QuantityStepper`는 controlled)

`upper = mode==="open" ? softMax : maxQuantity` (fixed 모드는 전이 자체가 없음)

| 현재 상태 | 트리거 | 다음 상태 | 가드/비고 |
|---|---|---|---|
| — (마운트) | 초기화 | `quantity = product.minQuantity` | `useState(product.minQuantity)`. `1`로 초기화하지 않는다 — min이 2 이상인 상품에서 즉시 범위 밖이 된다. |
| `quantity = v` | `-` 클릭 | `max(min, v - 1)` | `v <= min`이면 버튼 `disabled` |
| `quantity = v` | `+` 클릭 | `min(upper, v + 1)` | `v >= upper`이면 버튼 `disabled` |
| `quantity = v` | 직접 입력(onChange, 숫자 n) | `n` (미확정 값, 표시만) | 입력 중 clamp하면 "1"을 지우고 "12" 치는 게 불가능해진다 |
| `quantity = v` | 직접 입력 blur | `NaN\|<min → min`, `>upper → upper`, else `n` | 확정 clamp 지점 |
| `quantity = v` | 옵션 선택/해제 | `v` 유지 | 수량과 옵션은 독립 |
| `quantity = v` | mode==="fixed" | `1` 고정, 전이 없음 | UI 자체를 렌더하지 않음 |

### 3-3. 파생 값 재계산 (경계면 정합 — ★ 회귀 위험 지점)

| 값 | 현재 코드 | 변경 후 | 이유 |
|---|---|---|---|
| `totalPrice` (화면 "총 상품 금액") | `discountedPrice + optionSum` (84행 useMemo) | `discountedPrice * quantity + optionSum` | **현재 화면 표시가 수량을 안 곱하면 결제 페이지 `finalPrice`와 숫자가 달라진다.** deps에 `quantity` 추가 필수. |
| `CheckoutItem.finalPrice` | `discountedPrice * 1 + optionsTotalPrice` | `discountedPrice * quantity + optionsTotalPrice` | api-designer 합의 E — 옵션가는 수량 미곱. |
| `CheckoutItem.quantity` | `1` 하드코딩 | `quantity` state | REQ-4 |
| `handlePurchase` useCallback deps | `[product, discountedPrice, selectedOptionsDetails, onPurchase]` | `+ quantity` | deps 누락 시 stale quantity가 주문에 실린다 — **boundary-verifier 필수 확인 항목**. |

### 3-4. admin 폼 — `maxQuantity` 입력 상태 머신 (★ db-migrator 지적 대응)

**문제:** `maxQuantity` 필드를 비운 채 제출하면 `Number("")===0`이라 **"입력 안 함"이 조용히 "무제한 등록"이 된다.** DB는 0의 의미를 모르고 zod/서비스만 해석하므로 이 오입력은 어디서도 안 걸린다.

**해결(UI 소관 결정):** 숫자 입력만 두지 않고 **"무제한" Checkbox와 짝지어** 0의 의미를 명시적으로 만든다. 빈 문자열이 제출되는 경로 자체를 없앤다.

로컬 state: `isUnlimitedMax: boolean` (등록 폼 초기값 `true` — mongoose default 0과 일치 / 수정 폼 초기값 `product.maxQuantity === 0`)

| 현재 상태 | 트리거 | 다음 상태 | 렌더 / 제출값 |
|---|---|---|---|
| `isUnlimitedMax = true` | — | — | 숫자 Input `disabled` + placeholder "무제한". 제출은 `<input type="hidden" name="maxQuantity" value="0">` |
| `isUnlimitedMax = true` | 체크 해제 | `false` | 숫자 Input 활성화, `required min="1" step="1"`, defaultValue는 `max(1, minQuantity)` |
| `isUnlimitedMax = false` | 체크 | `true` | 숫자 Input 비활성 + hidden `0` 전송 (입력했던 값은 버린다) |
| `isUnlimitedMax = false` | 숫자 입력 | — | 값 그대로. **클라이언트에서 `>= minQuantity` 검증을 하지 않는다** — 서버 zod가 원본이다(§4-1) |

- 두 상태 모두 `maxQuantity` 키가 정확히 1개 전송된다(hidden과 활성 Input이 동시에 렌더되지 않게 할 것 — 둘 다 렌더되면 `formData.get`이 첫 값을 집어 무제한으로 오등록된다. **boundary-verifier 확인 항목**).
- `minQuantity`는 항상 활성 + `required min="1"`이라 빈 값 경로가 없다.

### 3-5. 로딩/에러/빈 상태 (API 응답 shape 1:1 매핑)

| 상태 | 발생 위치 | 응답 조건 | UI |
|---|---|---|---|
| 정상 | 상세 page.tsx (Server Component) | `product` 존재 | 수량 UI를 mode에 따라 렌더 |
| NOT_FOUND | 상세 page.tsx | 상품 없음/삭제 | 기존 `notFound()` 경로 유지 — 변경 없음 |
| 빈 갤러리 | 상세 | `images.length === 0` (invitation 정상 케이스) | **갤러리 섹션 자체를 렌더하지 않는다.** 빈 상태 문구를 두지 않는다 — invitation에선 정상이라 "이미지 없음"이 오히려 결함처럼 보인다. |
| 등록/수정 VALIDATION | admin 폼 | `state.success === false && error.category === "VALIDATION"` | `fieldErrors[key]` → 해당 필드 하단 `Alert type="error"` |
| 등록/수정 FORBIDDEN·INTERNAL | admin 폼 | 그 외 category | 기존 처리 유지(fieldErrors 없음) |
| 주문 범위 위반 | /payment | `error.category === "VALIDATION"`, `fieldErrors === undefined` | `errorMessage` 배너(§1-A). **`getFieldError(state,"quantity")` 경로를 만들지 않는다 — 항상 undefined다.** |
| 그 외 주문 실패 | /payment | `UNAUTHENTICATED` / `INTERNAL` 등 | **같은 배너에 표시된다.** `CheckoutForm.tsx:49`가 `state.success === false`만 보고 category를 가리지 않기 때문(api-designer 지적). 기존 동작이며 이번 변경으로 나빠지지 않는다. → **REQ-5 문구 3종만 뜬다고 가정하고 category 필터를 새로 넣지 말 것** — 필터를 넣으면 인증 만료 등이 조용히 삼켜진다. |
| pending | admin 폼 / 결제 | `useActionState` pending | 기존 버튼 disabled + 문구 전환 유지 |

---

## 4. 폼 유효성 규칙

### 4-1. 원칙

**클라이언트에 zod 스키마를 새로 정의하지 않는다.** 검증 원본은 `src/shared/schemas/request/product.schema.ts`(`productSchema`) 하나이고, 폼은 Server Action → `validateAndFlatten` → `fieldErrors` 경로로 받은 결과만 렌더한다. 클라이언트가 하는 일은 **네이티브 입력 제약(`min`/`step`/`type`)과 required 표기**뿐이며, 이건 UX 보조이지 검증 권한이 아니다.

### 4-2. 신규 필드 규칙표

| 필드 | FormData 키 | 입력 UI | 클라이언트 제약(보조) | 서버 zod 규칙(원본) | 에러 표시 위치 |
|---|---|---|---|---|---|
| 상세 이미지 | `images` (file, 다중) + `currentImages` (hidden string, 다중) | `ImageField` + `useImageList` | 없음(개수 상한 미설정) | zod 검증 대상은 **`{ existing, newFiles }` 객체**. `category !== "invitation"`이면 `existing.length + newFiles.length >= 1`(합계). `path: ["images"]`, "상세 이미지를 1장 이상 등록해주세요." | 갤러리 카드 하단 `Alert` |
| 최소 구매 수량 | `minQuantity` | `Input type="number"` | `required min="1" step="1"` `defaultValue={1}` | `.int().min(1)`, `path: ["minQuantity"]` | 필드 하단 `Alert` |
| 최대 구매 수량 | `maxQuantity` | `Input type="number"` + **"무제한" Checkbox** (§3-4) | 무제한 체크 시 hidden `value="0"`, 해제 시 `required min="1" step="1"` | `maxQuantity !== 0 && maxQuantity < minQuantity` → 실패. `path: ["maxQuantity"]`, "최대 구매 수량은 최소 구매 수량보다 크거나 같아야 합니다." | **max 필드 하단** `Alert` |

- required 표기: `images`의 asterisk는 `selectedCategory !== "invitation"`일 때만 렌더한다(`FormField`의 `required` prop을 조건부로). 표기만 바꾸고 검증은 서버가 한다.
- 수량 2필드는 전 카테고리 공통 required — invitation도 `1`/`1`을 실제로 입력해서 저장한다(강제 로직 아님, TODO.md 확정). invitation 등록 시엔 "무제한" 체크를 해제하고 `1`을 넣어야 한다.
- 빈 문자열 방어: 폼 구조상 빈 값 제출 경로가 없고(§3-4), 액션 쪽에서도 빈 값이면 `undefined`로 넘겨 zod `.default()`가 먹게 한다(이중 방어, api-designer 합의 B).
- 액션의 FormData → zod 입력 매핑:
  ```ts
  images: {
    existing: formData.getAll("currentImages") as string[],
    newFiles: (formData.getAll("images") as File[]).filter((f) => f.size > 0),
  }
  ```
  (`size > 0` 필터는 빈 file input이 0바이트 File을 실어 보내는 기존 `previewUrl` 처리 관행과 동일하다.)

### 4-3. 등록 폼 ↔ 수정 폼 차이

| 항목 | `/admin/products/new` | `/admin/products` 수정 Dialog |
|---|---|---|
| `images` 초기값 | 빈 배열 | `useImageList(product.images)` |
| `currentImages` | 전송 안 함 | 유지된 existing 아이템 URL을 hidden으로 반복 전송 |
| 수량 초기값 | `1` / `0` | `product.minQuantity` / `product.maxQuantity` |

---

## 5. 카테고리 4종 확장의 UI 반영

**결론: 카테고리/서브카테고리 선택 UI는 코드 변경이 필요 없다.** `getCategoryOptions()`/`getSubCategoryOptions(category)`가 이미 `category.ts` 원본에서 파생되므로, `PRODUCT_CATEGORIES`/`SUB_CATEGORY_MAP`만 넓히면 아래가 자동 반영된다:

- `organisms/ProductRegistrationForm.tsx:138,149`
- `ProductEditDialog.tsx:201,216`
- `organisms/ProductFilters.tsx:84`

### ★ 회귀 위험 1 — 라벨 맵 누락 시 빈 옵션

`getSubCategoryOptions`는 `label: subCategoryLabels[value]`로 라벨을 조회한다. `SUB_CATEGORY_MAP`만 넓히고 라벨 맵을 안 채우면 **select 옵션의 라벨이 `undefined`가 되어 빈 항목으로 렌더**된다(런타임 무증상, 화면만 깨짐). `isProductCategory`/`isSubCategory`도 `Object.keys(labels)` 기반이라 라벨이 없으면 **타입 가드가 false를 반환**해 `organisms/ProductSummary.tsx:59`의 카테고리 뱃지가 사라지고, `/products/{category}` 페이지의 카테고리 검증도 통과 못 한다.

→ **REQ-1 구현 시 필수 동반 작업(리더가 REQ-1 acceptance에 반영 완료):**
- `productCategoryLabels` — **총 5개**(기존 `invitation` + 신규 4개)
- `subCategoryLabels` — **총 16개**(기존 invitation 2개 + 신규 14개). 신규 14개만 채우면 기존 2개가 빠져 조용히 깨진다(db-migrator 지적).

### ★ 회귀 위험 2 — `src/app/(main)/_constants/subCategoryIcons.ts`

서브카테고리 아이콘 맵이 `subCategoryLabels`와 키를 맞추도록 되어 있다(파일 주석: "컴파일 에러로 잡힌다"). 신규 14개 서브카테고리를 이 맵에도 같이 채워야 빌드가 통과한다. `(main)` 네비게이션의 `SubCategoryNavItem`이 소비처다.

### REQ-6 — invitation 전용 필드 조건부 렌더 (리더 승인, 권장→요구사항 승격)

`theme` SelectField와 `previewUrl` 업로드 카드는 invitation 전용 필드다(`IInvitationProduct`). 카테고리가 4종 늘어난 뒤에도 `favor`/`guestbook` 등록 화면에 "테마: 청첩장 테마"가 그대로 보이면 관리자가 무의미한 값을 넣게 된다.

**확정 규칙 — 두 폼 공통:**

| 대상 | 파일:위치 | 조건 |
|---|---|---|
| `theme` SelectField | `organisms/ProductRegistrationForm.tsx:156-165` | `selectedCategory === "invitation"`일 때만 렌더 |
| `previewUrl` 업로드 Card | `organisms/ProductRegistrationForm.tsx:365-410` | 동일 |
| `theme` SelectField | `ProductEditDialog.tsx:224-235` | `selectedCategory === "invitation"`일 때만 렌더 |

- `selectedCategory`는 두 폼 모두 이미 state로 들고 있다 — **추가 상태 없음**. 카테고리 SelectField의 기존 `onValueChange`가 그대로 트리거다.
- 상태 전이: `selectedCategory !== "invitation"`으로 바뀌면 두 필드가 언마운트되어 **FormData에 `theme`/`previewUrl` 키 자체가 실리지 않는다**. `theme`은 zod에서 `.optional()`이고 액션도 `(formData.get("theme") as string) || undefined` 처리라 **서버 계약 변경 불필요**. `previewUrl`도 `previewFile && previewFile.size > 0` 가드가 이미 있다.
- 언마운트 시 로컬 state(`selectedTheme`, `previewFile`, `previewPreview`)는 굳이 초기화하지 않는다 — 전송되지 않으므로 무해하고, invitation으로 되돌리면 입력값이 복원돼 오히려 낫다. **단 `previewFile`은 언마운트돼도 hidden file input의 DataTransfer ref가 살아있으면 전송될 수 있으니, 업로드 카드 전체(hidden input 포함)를 함께 조건부 렌더할 것.**
- `ProductEditDialog`는 `previewUrl` 업로드 UI가 원래 없다 — `theme`만 조건부 처리하면 된다.

---

## 6. Phase2/3 검증 체크리스트 (boundary-verifier 대조용)

1. `ProductOptions.tsx`에 `const quantity = 1`이 남아있지 않다.
2. `ProductOptions.tsx`에 `product.category`를 읽는 분기가 없다(분기 입력은 `minQuantity`/`maxQuantity`뿐).
3. `quantity` 초기값이 `1`이 아니라 `product.minQuantity`다.
4. `totalPrice` useMemo와 `handlePurchase` useCallback **둘 다** deps에 `quantity`가 있다.
5. 화면 "총 상품 금액" == `/payment`의 `finalPrice`(배송비 제외) — 수량 2 이상에서 수동 확인.
6. 폼 input `name`이 `images` / `currentImages` / `minQuantity` / `maxQuantity`와 정확히 일치한다(`existingImages` 아님).
7. 액션이 `images`를 `{ existing, newFiles }` 객체로 조립해 zod에 넘긴다(`string[]` 아님) — `existing`은 `currentImages`에서, `newFiles`는 `images`에서.
8. `maxQuantity` 필드가 **어떤 상태에서도 정확히 1개만** FormData에 실린다(무제한 hidden과 활성 Input이 동시 렌더 안 됨, §3-4).
9. `fieldErrors` 키 3종(`images`/`minQuantity`/`maxQuantity`)이 `getFieldError` 호출 키와 일치한다.
10. `/payment`에서 REQ-5 에러를 `getFieldError(state, "quantity")`로 읽으려는 코드가 없다(항상 undefined).
11. `/payment` 배너에 `error.category` 필터를 새로 넣지 않았다 — REQ-5 3종 외 `UNAUTHENTICATED`/`INTERNAL`도 계속 표시돼야 한다(§3-5).
12. `productCategoryLabels` 5개 / `subCategoryLabels` **16개**(기존 2 + 신규 14) / `subCategoryIcons.ts` 키가 전부 채워졌다(§5).
13. invitation 상품 상세에서 수량 UI가 "1개" disabled로 렌더된다(회귀 없음).
14. `UNLIMITED_SOFT_MAX = 99` 옆에 "DB/서버 제약 아님" 주석이 있다(§7-1).
15. **REQ-6** — 두 폼에서 `theme`(+등록 폼의 `previewUrl` 카드)이 `selectedCategory === "invitation"`일 때만 렌더된다. `previewUrl`은 hidden file input(DataTransfer ref 포함)까지 함께 언마운트돼야 한다(§5).
16. `OrderSummary.tsx`가 이번 diff에 **포함되지 않았다**(§7-4 스코프 아웃).

**오판 금지 항목(§0 하단):** `images` 요청 DTO `{existing,newFiles}` ≠ 응답 `string[]`, FormData 키 `currentImages` ≠ DTO 필드명 `existing`, UI 소프트 상한 99 ≠ 서버 무제한 — 3건 모두 의도된 비대칭이다.

---

## 7. 미해결 쟁점

### 7-1. ~~무제한 소프트 상한~~ — **해소(db-migrator 승인)**

**`softMax = 99`로 확정.** `ProductOptions.tsx` 로컬 상수 `UNLIMITED_SOFT_MAX`(SCREAMING_SNAKE_CASE, `src/CLAUDE.md` 규칙)로 둔다.

**반드시 코드 주석과 함께 남길 것:** 이 99는 **UI 편의 상한이지 DB/서버 제약이 아니다.** `maxQuantity`의 DB 제약은 `min: 0`뿐이고 상한이 없으며, `createOrder`도 `maxQuantity === 0`이면 상한 검증을 스킵한다. 경계면 검증에서 "UI 99 vs 서버 무제한 = 불일치"로 오판되는 걸 막기 위한 명시다. 서버 측 실제 방어선은 별도로 "`quantity`는 양의 정수"(소수/음수/NaN 거부) 검증이며, UI clamp는 방어선으로 치지 않는다.

### 7-2. 갤러리 순서 편집 — **스코프 아웃(확정)**

`{ existing, newFiles }` payload는 "기존 뒤에 신규 append" 순서만 표현 가능하다 — `useImageList`의 `items` 배열엔 순서 정보가 있지만 `getPayload()`가 두 배열로 쪼개면서 소실된다. **기존 이미지 사이에 신규 이미지를 끼워 넣는 정렬 UX는 이번 스코프에 넣지 않는다.** 근거: 요구사항 5건 어디에도 순서 편집이 없고, 도입하면 payload에 순서 인덱스를 실어야 해서 계약이 바뀐다. `ImageField`는 삭제 후 재업로드로 순서를 바꿀 수 있어 우회 경로도 있다. → **"기존 뒤에 신규 append" 규칙으로 확정.**

### 7-3. `images` 최대 개수 미정

`ImageField`는 `maxCount` prop을 지원하지만 이번 스코프에서 상한을 정하지 않았다(couple-info 갤러리도 무제한). Cloudinary 업로드 비용/응답 크기 관점에서 상한이 필요해지면 그때 `maxCount`만 넘기면 되므로 컴포넌트 변경은 불필요하다. **현재는 무제한으로 진행.**

### 7-4. `organisms/OrderSummary.tsx`의 하드코딩 문구 — **스코프 아웃 확정(리더 판정)**

`OrderSummary.tsx`가 상품명 아래에 `"청첩장 템플릿"`을 **하드코딩**해 렌더한다. 카테고리가 4종 늘면 답례품 주문서에도 "청첩장 템플릿"이 뜬다. `CheckoutItem`에 카테고리 정보가 없어서 수정하려면 `CheckoutItem` 계약 변경이 필요하다.

**리더 판정: 이번 PR 스코프 아웃.** `CheckoutItem` 계약 변경이 필요한 별개 버그이므로 최종 보고 때 리더가 `TODO.md` 버그 수정 섹션에 직접 추가한다. **구현자는 이 파일을 건드리지 않는다.**

### 7-5. 수량과 프리미엄 옵션가의 관계 — 확정(쟁점 아님)

옵션가는 수량에 곱하지 않는다(`finalPrice = discountedPrice * quantity + optionsTotalPrice`). 현행 `order.service.ts` 계산식과 동일하며 api-designer와 합의 완료. 물리 상품 3개 주문 시 프리미엄 옵션이 1회분만 계산되는 게 어색해질 수 있으나, 프리미엄 옵션은 invitation 전용 개념(`isPremium`)이고 invitation은 수량 1 고정이라 실제로 충돌하는 조합이 발생하지 않는다.
