# 01_db_schema.md — feat/subcategory-navigation-section DB 설계

> 작성: db-migrator (Phase1 설계 팬아웃, 2026-08-05)
> **상태: 확정 (리더 승인 완료, 2026-08-05)** — 미해결 쟁점 **0건**. api-designer 계약 합의 6건 + 리더 판정 2건 전건 종결(§9). backend-impl 착수 가능.
> 근거 파일: `src/shared/utils/category.ts`, `src/server/models/product.model.ts`, `src/shared/schemas/request/product.schema.ts`, `src/shared/schemas/response/product.schema.ts`, `src/server/services/product.service.ts`, `src/server/models/CLAUDE.md`
> 선행 문서: `_workspace/feat/product-search/01_db_schema.md` §7 (이 브랜치를 "VIP/비즈니스 제거 = 마이그레이션 필요 작업"으로 예고했음 — 본 문서가 그 예고를 **불필요로 정정**한다)

---

## 0. 결론 요약

| 항목 | 판단 |
|---|---|
| 신규 모델 | **불필요** — 기존 `Product` 확장으로 전부 해결 |
| 신규 필드 | **0개** — `category`/`subCategory` 둘 다 이미 존재 |
| **마이그레이션 / backfill** | **불필요** (dev DB 확인 완료 — §5) |
| 인덱스 추가 | **불필요** — REQ-4가 DB 쿼리를 새로 만들지 않는다(§6, api-designer 확정) |
| 모델 파일 변경 | `product.model.ts` **1줄** (`enum: ["invitation"]` → `enum: PRODUCT_CATEGORIES`) |
| REQ-2 교체 대상 | **3파일** — 리더가 `response/product.schema.ts:16`을 범위에 추가 (§3-4 체크리스트) |
| 테스트 회귀 | **6곳 수정 필요.** 5곳은 픽스처 치환, 1곳은 **재설계 지시** (§8, §8-1) |
| `subCategory` validator | **손대지 않는다** — 이미 `SUB_CATEGORY_MAP` 동적 참조라 REQ-1이 자동 반영됨 (§4) |
| API 필드명 정렬 | ✅ **합의 완료** — 쿼리파라미터 `subCategory`, 값은 enum key (§7) |
| 새 DB 쿼리 | **0건** — REQ-4는 클라이언트 메모리 필터의 초기값 주입 방식 (§6-2) |

이번 기능의 DB 작업은 **"값을 옮겨 적는 것을 멈추는" 리팩토링**이다. 저장되는 데이터의 shape도, 값도, 문서 개수도, 쿼리도 변하지 않는다.

---

## 1. 마이그레이션 불필요 — 명시 (요구사항 지정 항목)

> ## ✅ **마이그레이션 불필요 (vip/business 0건, dev DB 확인완료)**
>
> `00_requirements.json` background[0] (2026-08-05 조사): **products 컬렉션 2건, 전부 `subCategory: "wedding"`. `subCategory`가 `vip` 또는 `business`인 문서 0건.**
>
> → `SubCategory` 유니온과 `SUB_CATEGORY_MAP.invitation` 배열에서 `vip`/`business`를 제거해도 **재작성해야 할 기존 문서가 없다.** backfill 스크립트, 데이터 변환, 다운타임 전부 해당 없음.

MongoDB는 스키마리스라 "컬럼 DROP" 개념 자체가 없다. `subCategory`는 필드가 사라지는 게 아니라 **허용값 집합만 좁아진다**(`SUB_CATEGORY_MAP` 참조 validator 경유). 문서에 그 값이 하나도 없으므로 좁혀도 아무 문서가 무효화되지 않는다.

### 1-1. 그래도 배포 전에 한 번 더 돌릴 것 — 확인 쿼리 (backfill 아님)

dev DB에서만 확인됐다. 다른 환경(staging/prod)이 존재한다면 **동일 쿼리로 0건을 재확인한 뒤 머지**한다. 데이터를 바꾸지 않는 읽기 전용 카운트다.

```js
// mongosh — 배포 전 게이트. 결과가 전부 0이어야 한다.
db.products.countDocuments({ subCategory: { $in: ["vip", "business"] } });   // 기대: 0
db.products.countDocuments({ category: { $nin: ["invitation"] } });          // 기대: 0
db.products.distinct("subCategory");                                          // 기대: ["wedding"] 또는 ["wedding","first-birthday"]
```

### 1-2. 만약 0건이 아니었다면 (컨틴전시 — 지금은 실행 대상 아님)

기록용으로만 남긴다. dev 기준 실행할 이유 없음.

```js
// 레거시 subCategory를 wedding으로 접는 backfill 초안 (조건부, 미실행)
db.products.updateMany(
  { subCategory: { $in: ["vip", "business"] } },
  { $set: { subCategory: "wedding" } }
);
```

이 스크립트가 필요해지는 상황의 위험은 "읽기가 깨진다"가 아니라 **"수정이 막힌다"** 다 — 자세한 이유는 §4-3.

---

## 2. REQ-1 — `category.ts` 값-원본 / 타입-파생 구조

### 2-1. 현재 구조의 문제

`src/shared/utils/category.ts` L1-6은 **타입이 원본이고 값이 그걸 베껴 적는** 방향이다.

```ts
export type SubCategory = "wedding" | "first-birthday" | "vip" | "business";   // 원본
export const SUB_CATEGORY_MAP: Record<ProductCategory, SubCategory[]> = {
  "invitation": ["wedding", "first-birthday", "vip", "business"],              // 같은 값 재입력
};
```

`Record<ProductCategory, SubCategory[]>` 어노테이션은 배열 원소가 유니온의 **부분집합**인지만 검사한다. 유니온에서 값을 지워도 배열은 알아서 좁아지지 않고(반대로 배열에서 지워도 유니온은 안 좁아진다), 결과적으로 **두 군데를 손으로 맞춰야 하는 구조**다. 지금 vip/business를 지우는 작업이 두 곳 + 라벨 맵까지 3곳을 건드려야 하는 이유가 이것이다.

### 2-2. 목표 구조 (타입체크 검증 완료 ✅)

아래 스니펫은 이 프로젝트의 실제 `tsconfig` strict 설정으로 `tsc --noEmit` 통과를 **직접 확인했다**(소비처 4종 시뮬레이션 포함).

```ts
// ---- 값이 원본 ----
export const PRODUCT_CATEGORIES = ["invitation"] as const;

export const SUB_CATEGORY_MAP = {
  invitation: ["wedding", "first-birthday"],
} as const satisfies Record<ProductCategory, readonly string[]>;

// ---- 타입은 파생 ----
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type SubCategory = (typeof SUB_CATEGORY_MAP)[ProductCategory][number];
```

설계 포인트 3가지:

1. **`satisfies`의 타깃은 `Record<ProductCategory, readonly string[]>`이지 `Record<ProductCategory, SubCategory[]>`가 아니다.** 후자로 쓰면 `SubCategory`가 자기 자신을 정의하는 순환 참조가 된다. `readonly string[]`은 "모든 카테고리 키가 빠짐없이 있는가"만 검사하고(카테고리 누락 방지), 원소의 리터럴 타입은 `as const`가 보존하므로 파생이 정확히 동작한다.
2. **`as const` + `satisfies` 조합이 핵심이다.** `as const`만 쓰면 카테고리 키 하나를 빠뜨려도 조용히 통과한다. `satisfies`만 쓰면 원소가 `string`으로 넓어져 `SubCategory`가 `string`이 되어버린다. 둘 다 필요하다.
3. **`(typeof SUB_CATEGORY_MAP)[ProductCategory][number]`** — 카테고리가 늘어나면 인덱스 접근이 유니온이 되어 모든 카테고리의 서브카테고리가 자동 합류한다. 카테고리 추가 시 `SubCategory` 타입 수정 불필요.

### 2-3. 라벨 맵은 `Record` 형태 유지 (수용조건 명시 사항)

```ts
export const productCategoryLabels: Record<ProductCategory, string> = {
  invitation: "초대장",
};

export const subCategoryLabels: Record<SubCategory, string> = {
  wedding: "청첩장",
  "first-birthday": "돌잔치",
  // vip / business 제거
};
```

`Record<SubCategory, string>` 어노테이션을 **유지하는 게 안전장치**다. `SubCategory`가 파생 타입이 된 뒤로는

- `vip: "VIP"`를 안 지우면 → 객체 리터럴 초과 속성으로 **컴파일 에러**(지우는 걸 잊을 수 없음)
- `SUB_CATEGORY_MAP`에 새 서브카테고리를 넣고 라벨을 안 넣으면 → 속성 누락으로 **컴파일 에러**

즉 라벨 맵이 "값 원본 → 라벨" 동기화를 컴파일 타임에 강제하는 역할로 승격된다. `as const`로 바꾸지 말 것.

### 2-4. 하위 소비처 영향 — 전부 무변경 (readonly 전파 확인)

`SUB_CATEGORY_MAP` 값이 `readonly` 배열이 되지만 기존 소비처는 전부 읽기 전용 메서드만 쓴다.

| 소비처 | 사용 형태 | readonly 영향 |
|---|---|---|
| `category.ts:40` `getSubCategoryOptions` | `SUB_CATEGORY_MAP[category].map(...)` | 없음 (`.map`은 readonly 배열에 존재) |
| `product.model.ts:106-107` validator | `allowed?.includes(value as SubCategory)` | 없음 (`.includes` 존재) |
| `product.schema.ts:41-42` zod refine | `allowed?.includes(...)` | 없음 |
| `isSubCategory` / `findSubCategoriesByTerm` | `Object.keys/entries(subCategoryLabels)` | 없음 — 라벨 맵 경유라 무관 |

→ **`category.ts` 외 파일에서 `SUB_CATEGORY_MAP` 때문에 고칠 코드는 없다.**

### 2-5. 배럴 export

`src/shared/utils/index.ts`가 `export * from "./category"`라 **`PRODUCT_CATEGORIES`는 자동으로 배럴에 실린다.** 배럴 수정 불필요. 소비처는 `@/shared/utils`에서 import한다(프로젝트 규칙: 배럴 경유 import).

---

## 3. REQ-2 — `PRODUCT_CATEGORIES` 참조로 교체

### 3-1. `product.model.ts` (모델 파일에서 이번에 바뀌는 유일한 줄)

```ts
// import에 PRODUCT_CATEGORIES 추가 (L2-6)
import { ProductCategory, SubCategory, SUB_CATEGORY_MAP, PRODUCT_CATEGORIES } from "@/shared/utils";

// L85-89
category: {
  type: String,
  enum: PRODUCT_CATEGORIES,   // was: ["invitation"]
  required: true,
},
```

**타입 안전성 확인 완료 ✅** — mongoose 8.16.4의 `SchemaTypeOptions.enum`은 `Array<...> | ReadonlyArray<string | number | null> | ...`를 받는다(`node_modules/mongoose/types/schematypes.d.ts:177-181`). `as const`가 만든 `readonly ["invitation"]`을 **캐스팅 없이 그대로** 넣을 수 있다. 실제 `tsc --noEmit`으로 검증했다.

**런타임 안전성 확인 완료 ✅** — mongoose는 넘겨받은 배열을 **복사한다**. `SchemaString.prototype.enum`이 `this.enumValues.push(this.cast(value))`로 자기 배열에 쌓고(`node_modules/mongoose/lib/schema/string.js`), 원본 배열을 mutate하거나 참조로 붙들지 않는다. → 공유 상수를 넘겨도 다른 소비처가 오염될 위험 없음.

> ⚠️ 알아둘 엣지케이스: `PRODUCT_CATEGORIES`가 언젠가 **빈 배열**이 되면 mongoose는 `arguments[0] === undefined`로 보고 **enum validator를 조용히 등록하지 않는다**(검증이 사라짐, 에러 안 남). 현실적으로 카테고리가 0개가 될 일은 없지만, 값-원본 구조에선 "배열을 비우면 검증이 없어진다"는 게 문법상 가능해진다는 점만 기록해둔다.

### 3-2. `product.schema.ts` (요청 zod)

```ts
import { SUB_CATEGORY_MAP, SubCategory, PRODUCT_CATEGORIES } from "@/shared/utils";

// L8
category: z.enum(PRODUCT_CATEGORIES),   // was: z.enum(["invitation"])
```

**타입 안전성 확인 완료 ✅** — zod 4.2.1의 시그니처가 `_enum<const T extends readonly string[]>(values: T, ...)`다(`node_modules/zod/v4/classic/schemas.d.ts:539`). **readonly 배열을 정식으로 받는다** — zod 3에서 필요했던 `as [string, ...string[]]` 캐스팅 workaround가 필요 없다. `z.infer` 결과도 `"invitation"` 리터럴 유니온으로 정확히 좁혀지는 것까지 `tsc`로 확인했다.

### 3-3. `response/product.schema.ts` (응답 zod) — ✅ **REQ-2 범위에 포함 (리더 승인, 2026-08-05)**

REQ-2 문구가 지목한 2개 파일 외에 `src/shared/schemas/response/product.schema.ts:16`에도 동일한 리터럴이 있었다. **리더가 "REQ-2의 취지(하드코딩 3곳 통합)에 정확히 부합한다"며 이 파일을 REQ-2 범위에 포함시켰다.** 따라서 교체 대상은 **2개 파일이 아니라 3개 파일**이다.

```ts
import { PRODUCT_CATEGORIES } from "@/shared/utils";

// L16
category: z.enum(PRODUCT_CATEGORIES),   // was: z.enum(["invitation"])
```

§3-2와 동일하게 zod 4.2.1이 readonly 배열을 정식 수용하므로 캐스팅 불필요.

리더가 채택한 근거:
- 값 집합이 `PRODUCT_CATEGORIES`와 완전히 동일하므로 **런타임 동작 변화 0**이다. 회귀 위험이 없다.
- 여기만 남기면 "카테고리 추가 시 고쳐야 할 곳"이 1군데 남아, REQ-2가 없애려는 문제가 절반만 해결된다.
- 응답 스키마는 DB에서 나온 값을 검증하는 자리라, 값 원본과 어긋나는 순간 **정상 문서가 응답 검증에서 튕기는** 형태로 터진다(가장 진단하기 나쁜 실패 모드).

> ⚠️ **같은 파일의 `subCategory`(L17)는 건드리지 않는다.** 현재 `z.string()`이고 그대로 둔다 — `z.enum(...)`으로 좁히면 레거시 값이 든 문서가 응답 단계에서 튕긴다. dev엔 그런 문서가 없지만 응답 검증은 "DB에 뭐가 들어있든 깨지지 않는" 쪽이 맞다(Postel). **api-designer와 무변경으로 합의 완료**(§9 #6). L16과 L17은 같은 파일 인접 줄이라 혼동하기 쉽다 — **L16만 바꾼다.**

### 3-4. REQ-2 교체 대상 최종 목록 (구현 체크리스트)

| # | 파일:라인 | before | after |
|---|---|---|---|
| 1 | `src/server/models/product.model.ts:87` | `enum: ["invitation"]` | `enum: PRODUCT_CATEGORIES` |
| 2 | `src/shared/schemas/request/product.schema.ts:8` | `z.enum(["invitation"])` | `z.enum(PRODUCT_CATEGORIES)` |
| 3 | `src/shared/schemas/response/product.schema.ts:16` | `z.enum(["invitation"])` | `z.enum(PRODUCT_CATEGORIES)` |

각 파일에 `PRODUCT_CATEGORIES` import 추가 필요(전부 `@/shared/utils` 배럴 경유). 완료 후 `grep -rn '"invitation"' src/ --include=*.ts` 로 남은 하드코딩이 `category.ts`의 정의부와 discriminator 등록(`product.model.ts:159`, 값이 아니라 discriminator **이름**이라 정상)뿐인지 확인할 것.

리더/api-designer 판단으로 스코프에서 빼도 무방하다 — 그 경우 이 절을 근거로 별도 이슈에 남길 것.

---

## 4. subCategory validator — 안 깨진다 (요구사항 지정 확인 항목)

### 4-1. 왜 자동 반영되는가

`product.model.ts` L90-112의 validator는 허용값을 **하드코딩하지 않고 `SUB_CATEGORY_MAP`을 런타임에 인덱싱**한다.

```ts
const allowed = SUB_CATEGORY_MAP[category as ProductCategory];
return allowed?.includes(value as SubCategory) ?? false;
```

→ `SUB_CATEGORY_MAP.invitation`에서 `vip`/`business`가 빠지는 순간 **validator가 그 값을 거부하기 시작한다. 모델 파일 수정 없이.** REQ-1만 하면 REQ-3/REQ-4의 "서브카테고리 2개" 전제가 DB 쓰기 경로에도 자동으로 걸린다.

### 4-2. 깨지지 않는지 항목별 확인

| 확인 항목 | 판정 | 근거 |
|---|---|---|
| readonly 배열에 `.includes()` 호출 | ✅ 정상 | `readonly T[]`도 `.includes`를 갖는다. §2-4에서 tsc 확인 |
| `value as SubCategory` 캐스팅 | ✅ 정상 | `SubCategory`가 2개로 좁아져도 캐스팅 문법은 그대로. `.includes` 인자 타입이 좁아질 뿐 |
| `allowed?.` optional chaining | ✅ 유지 필요 | `category`가 `undefined`/미지값일 때 `SUB_CATEGORY_MAP[undefined]`는 `undefined`. **이 `?.`를 제거하지 말 것** |
| update validator 폴백 로직 (L99-105) | ✅ 무관 | `this.model.findOne(this.getQuery())`로 기존 문서의 `category`를 조회하는 부분. `category` 값 집합이 안 변하므로 영향 없음 |
| discriminator (`category`가 `discriminatorKey`) | ✅ 무관 | `PRODUCT_CATEGORIES`에 `"invitation"`이 그대로 있으므로 `ProductModel.discriminator("invitation", ...)`(L159)와 계속 일치 |

**결론: validator 코드는 한 글자도 건드리지 않는다.** 건드리면 `models/CLAUDE.md` Gotchas에 기록된 update-validator 버그(`this.get('category')`가 payload에 없는 값을 못 가져오는 문제)를 재도입할 위험만 생긴다.

### 4-3. 다만 — validator가 강해지는 방향이라 "기존 문서 수정 불가" 부작용이 이론상 존재

`vip` 문서가 **만약** 있었다면:

- 조회(`find`/`findOne`)는 **정상** — mongoose는 읽기에 validator를 돌리지 않는다.
- 수정은 **실패** — `updateProduct` 경로가 `runValidators: true`를 쓰면, payload에 `subCategory`가 없어도 기존 값으로 재검증되는 상황에서 막힌다. 사용자에겐 "저장이 안 되는데 이유를 모르겠는" 형태로 보인다.

**dev DB 0건이므로 이번엔 발생하지 않는다.** §1-1의 배포 전 카운트 게이트가 이 리스크를 커버하는 유일한 장치이므로 생략하지 말 것.

---

## 5. 마이그레이션 / backfill — 없음

**§1에 명시한 대로 마이그레이션 불필요.** 요약:

| 마이그레이션이 필요해지는 조건 | 이번 케이스 |
|---|---|
| 필드 추가/삭제 | ❌ 없음 — `category`/`subCategory` 둘 다 그대로 |
| 필드 타입 변경 | ❌ 없음 — 둘 다 `String` 유지 |
| 저장값 변환 필요 | ❌ 없음 — `wedding`은 계속 유효값 |
| 제거되는 값을 가진 문서 존재 | ❌ **0건** (dev DB 확인완료 2026-08-05) |
| 인덱스 생성/삭제 | ❌ 없음 (§6) |

→ **backfill 스크립트 산출물 없음.** §1-2의 조건부 초안은 실행 대상이 아니라 컨틴전시 기록이다.

---

## 6. 인덱스 설계 — 추가하지 않는다 (근거가 강화됨)

### 6-1. 현재 상태

`Product` 컬렉션은 `_id` 외 인덱스가 **하나도 없다**(다른 모델엔 있다: `user.email`, `order.merchantUid`/`coupleInfoId`/`userId`, `payment.merchantUid`/`impUid`, `guestbook`, `feature.code`). 기존 상품 조회 전부가 이미 컬렉션 스캔이다.

### 6-2. ✅ REQ-4는 새 DB 쿼리를 만들지 않는다 (api-designer 확정, 2026-08-05)

초안 단계에서 "`{ deletedAt: null, category, subCategory }` 등치 쿼리가 새로 생길 것"을 전제하고 인덱스 후보를 검토했으나, **api-designer가 서버사이드 필터링을 명시적으로 기각했다.** 확정된 구조:

- `page.tsx`가 `getAllProductsService(category)`로 **해당 카테고리 전량을 그대로** 조회 (기존 호출, 시그니처 무변경)
- `useVisibleProducts`가 **브라우저 메모리에서** `item.subCategory === state.subCategory`로 거름 (이미 구현돼 있음)
- URL의 `subCategory`는 DB 쿼리 조건이 아니라 **클라이언트 필터 state의 초기값**이다

기각 근거(api-designer): 서버가 `wedding`만 실어보내면 필터 UI의 "전체"/"돌잔치" 버튼이 빈 화면이 되어 **기존 기능 회귀**가 된다.

→ **`subCategory`는 몽고 쿼리 조건으로 등장하지 않는다.** DB 관점에서 이번 기능은 읽기 경로조차 변하지 않는다.

| 항목 | 판정 |
|---|---|
| `getAllProductsService` 시그니처 | 무변경 (`subCategory` 인자 추가 없음) |
| 신규 인덱스 | **없음** |
| 신규 필드 | **0개** |

### 6-3. 그럼에도 인덱스를 안 만드는 독립 근거 (쿼리가 생겼더라도 동일 결론)

§6-2로 이미 논점이 소멸했지만, 향후 서버사이드 필터링으로 선회하더라도 **지금은** 인덱스를 만들지 않는 게 맞다:

1. **문서 2건이다.** 이 규모에서 인덱스 스캔 + fetch 왕복은 컬렉션 스캔보다 느려질 수 있다.
2. **카테고리 1종, 서브카테고리 2종**이라 선택도(selectivity)가 최악이다. `category: "invitation"`은 전건을 고른다.
3. **안 쓰이는 인덱스는 진단을 꼬이게 한다** — 나중에 진짜 느려졌을 때 "인덱스 있는데 왜 느리지"로 한 번 헤맨다. 선행 문서(`feat/product-search` 01_db_schema §3-3)와 일관된 판단.

### 6-4. 필요해지는 시점의 정답 (미리 적어두는 것, 지금 만들지 말 것)

ESR(Equality → Sort → Range) 순서로 배치한 단일 복합 인덱스 하나면 §6-2 쿼리와 기존 `getAllProductsService`를 **둘 다** 커버한다(prefix 규칙: `{category}` 단독 조회도 같은 인덱스를 쓴다).

```ts
// 지금 넣지 않는다. §6-5 트리거 도달 + 서버사이드 필터링으로 선회한 경우에만.
productSchema.index(
  { category: 1, subCategory: 1, deletedAt: 1, isFeatured: -1, priority: -1, createdAt: -1 },
  { name: "product_catalog_browse" },
);
```

- Equality: `category`, `subCategory`, `deletedAt`(값이 `null`인 등치 매칭 — `default: null`이라 모든 문서에 존재)
- Sort: `isFeatured` → `priority` → `createdAt` (쿼리 sort와 **순서·방향 모두** 일치해야 인메모리 정렬을 피한다)
- Range: 없음
- `subCategory`를 `category` 뒤에 두는 이유: prefix 규칙상 `{category}`만 쓰는 기존 쿼리도 이 인덱스를 재사용한다. 순서를 뒤집으면 기존 쿼리가 못 쓴다.

### 6-5. 재검토 트리거

- `Product` 문서 수 **수천 건** 진입
- 목록 응답 p95 **200ms** 초과 — 추측 아니라 `.explain("executionStats")`의 `totalDocsExamined`/`executionTimeMillis`로 판단
- 인덱스 없는 정렬의 **32MB 인메모리 한도** 도달

---

## 7. API ↔ DB 필드명 정렬 — ✅ 합의 완료 (api-designer, 2026-08-05, 1라운드)

### 7-0. 확정된 계약

| 항목 | 확정값 |
|---|---|
| 파라미터명 | **`subCategory`** (camelCase, `/products/[category]` 쿼리스트링) |
| 값 | **enum key 그대로** (`wedding` / `first-birthday`). 라벨 금지 |
| 다중값 | **미지원** — 단일값. 반복/CSV 없음 |
| "전체" 표현 | **파라미터 부재 = 필터 미적용**이 정규(canonical) 형태. `?subCategory=all`은 소비 측만 수용(→전체)하고 **링크 생성 측은 만들지 않는다** |
| 무효값 (`vip` 등) | **400 아님. 조용히 무시 → 전체.** `isSubCategory()` 실패 시 `"all"` 폴백, `notFound()`도 안 냄 |

무효값을 400이 아닌 무시로 정한 근거(api-designer): 이 파라미터를 읽는 곳이 Server Component 렌더 경로라 `{success:false, error}` envelope을 돌려줄 채널 자체가 없다(`docs/ERROR_HANDLING.md` 채널 분리 규칙). 경로 세그먼트 `[category]`는 리소스 식별자라 404 유지, 쿼리파라미터는 뷰 옵션이라 무효여도 페이지는 존재한다는 구분.

**DB 관점 검토 결과: 어느 쪽이든 안전하며 이 결정에 이견 없다.** 등치 매칭이라 주입 위험이 없고, 애초에 §6-2대로 이 값이 몽고 쿼리까지 내려가지도 않는다. 오히려 "부재 = 전체" 정규형이 `{ subCategory: "all" }`이라는 존재하지 않는 값으로 쿼리가 나가는 사고를 구조적으로 차단한다.

### 7-1. 이름이 이미 4겹으로 통일돼 있다

| 레이어 | 파일 | 이름 |
|---|---|---|
| DB 스키마 | `product.model.ts:90` | `subCategory` |
| DB 타입 | `product.model.ts:36` (`ProductDB`) | `subCategory` |
| API 응답 계약 | `shared/schemas/response/product.schema.ts:17` | `subCategory` |
| 클라이언트 필터 state | `client/context/productFilter/type.ts:6` | `subCategory` |

→ **쿼리파라미터도 `subCategory`로 확정됐다**(api-designer 합의). 다른 이름을 쓰면 URL ↔ state ↔ 몽고 쿼리 3중 매핑 테이블이 생기고, 그 매핑이 boundary-verifier가 잡아야 할 결함 표면이 된다. snake_case(`sub_category`)는 프로젝트 컨벤션 위반이므로 어떤 경우에도 불가.

### 7-2. 값도 enum key여야 한다 — 라벨 금지

DB에 저장되는 건 **영문 enum key**(`"wedding"`, `"first-birthday"`)이고 한글은 `subCategoryLabels`에만 있는 표시 전용 매핑이다(선행 문서 `feat/product-search` §2에서 확정된 사실). URL에 `subCategory=청첩장`을 실으면 서버에서 라벨 역조회가 필요해지고, 그건 `00_requirements.json` background[2]가 "오탐 위험"으로 배제한 바로 그 경로다.

| URL이 싣는 값 | DB 매칭 | 판정 |
|---|---|---|
| `subCategory=wedding` | `{ subCategory: "wedding" }` 등치 | ✅ 권장 |
| `subCategory=청첩장` | 라벨 역조회 필요 | ❌ 배제 |
| `q=청첩장` (기존 search 재사용) | `$or` 부분일치 → 오탐 | ❌ 요구사항이 명시 배제 |

REQ-3의 UI는 `SUB_CATEGORY_MAP`을 순회해 렌더하므로 **링크 생성 시점에 이미 enum key를 손에 쥐고 있다.** 라벨로 변환했다가 되돌릴 이유가 없다.

### 7-3. 클라이언트 메모리 필터라서 **값 일치가 더 중요해졌다**

api-designer 확정대로 필터링이 `useVisibleProducts`의 `item.subCategory === state.subCategory` **문자열 등치 비교**로 일어난다. 즉 URL 값과 DB 저장값이 한 글자라도 다르면 **에러 없이 빈 목록**이 나온다 — DB 쿼리였다면 최소한 explain으로 추적됐을 불일치가 여기선 조용히 사라진다.

DB가 보증하는 부분(설계상 확정):

- 저장되는 값은 `SUB_CATEGORY_MAP.invitation`의 원소와 **문자 단위로 동일**하다 — validator(`product.model.ts:106-107`)가 `.includes()`로 강제하므로 다른 값은 저장 자체가 불가능하다.
- REQ-3의 UI가 같은 `SUB_CATEGORY_MAP`을 순회해 링크를 만들면, **URL 값 = DB 값 = 필터 state 값**이 하나의 상수에서 나온 동일 문자열이 된다.

→ 링크 생성 시 `SUB_CATEGORY_MAP` 원소를 그대로 쓰고 어떤 변환(`toLowerCase`, 라벨 왕복, 하이픈 정규화)도 끼우지 말 것. 특히 **`first-birthday`의 하이픈**이 위험 지점이다 — 케밥/카멜 변환 유틸이 중간에 끼면 `firstBirthday`가 되어 조용히 0건이 된다.

**→ api-designer가 이 지적을 수용해 계약 §4.2 "무변환 규칙(필수)"으로 승격했다**(링크 생성 측·파싱 측 양쪽 적용). ui-designer에게는 아이콘 매핑 `Record<SubCategory, ...>`의 key도 동일 문자열이어야 한다는 점까지 전달됐다.

> ⚠️ **부분 통과 함정** (api-designer 추가 지적, 기록 가치 있어 여기에도 남긴다): `wedding`은 케밥/카멜/`toLowerCase` 어떤 변환에도 **불변**이다. 따라서 이 버그가 있어도 **청첩장 경로에서는 절대 드러나지 않고 돌잔치 경로에서만 터진다.** "청첩장 눌러보니 되더라"로 검증을 끝내면 그대로 통과한다 — **`first-birthday` 경로의 실제 목록 도달까지 반드시 확인할 것.** boundary-verify 체크포인트 및 구현자 체크리스트(계약 §11 #8)에 반영됨. 리더가 Phase2+3 kickoff 때 boundary-verifier에게 직접 전달 예정.

---

## 8. 회귀 영향 — 기존 테스트 6곳이 vip/business에 의존한다 (구현자 필독)

REQ-2 수용조건이 "기존 동작에 회귀 없음"인데, **테스트 코드가 제거 대상 값을 픽스처/기대값으로 쓰고 있어 REQ-1만으로 실패한다.** DB 설계상의 결함이 아니라 값 집합 축소의 정당한 파급이다. 미리 목록화한다.

| 파일:라인 | 현재 내용 | 필요한 조치 |
|---|---|---|
| `shared/utils/category.test.ts:28` | `expect(isSubCategory("vip")).toBe(true)` | `false` 기대로 뒤집거나 `first-birthday`로 교체 |
| `shared/utils/category.test.ts:53` (describe 문구 "4개") | vip/business 포함 4개 배열 기대 | **2개**로 축소 + 문구 수정 |
| `shared/utils/category.test.ts:99-102` | `findSubCategoriesByTerm("vip") === ["vip"]` | 케이스 삭제 또는 다른 키로 교체 |
| `shared/utils/category.test.ts:110` | `findSubCategoriesByTerm("비") === []` (2글자 미만 가드) | **§8-1 지시 적용** — 검색어를 `"장"`으로 교체 + 주석 갱신 |
| `server/services/product.service.test.ts:258,261,393,396` | 픽스처 `subCategory: "vip"` | validator가 거부한다 → `wedding`/`first-birthday`로 교체 |
| `server/services/product.service.test.ts:439-449` | 픽스처 `subCategory: "business"` + "비→비즈니스 오탐 방지" 검증 | **삭제 금지. §8-1 지시대로 재설계** |

### 8-1. 🔴 `product.service.test.ts:439-449` 재설계 — 리더 지시 (2026-08-05, 필수 준수)

> **리더 결정: 이 케이스를 raw 삭제하지 말 것. "2글자 미만 가드가 오탐을 막는다"는 성질을 남은 라벨(초대장/청첩장/돌잔치)로 재현하는 케이스로 재설계한다.**
> **적용 대상: Phase2 backend-impl(구현 시), Phase4 test-suite(검증 시). 두 페이즈 모두 이 절을 확인할 것.**

**왜 단순 치환으로 안 끝나는가.** 이 테스트가 증명하던 건 "1글자는 매칭이 안 된다"가 아니라 **"1글자였다면 실제로 매칭됐을 값이 가드 때문에 걸러진다"** 는 인과다. 현재 검색어 `"비"`는 `subCategoryLabels.business === "비즈니스"`의 실제 부분문자열이라서, 가드를 제거하면 테스트가 **빨간불이 되는** 유효한 케이스였다. business 라벨이 사라지면 `"비"`는 어떤 남은 라벨에도 안 걸리므로, 픽스처만 바꾸면 **가드를 통째로 지워도 통과하는 무의미한 테스트**(vacuous test)로 전락한다.

**재설계안 — 검색어를 `"장"`으로.** 남은 라벨 중 `"청첩장"`(wedding)과 `"초대장"`(invitation)이 둘 다 `"장"`을 부분문자열로 갖는다. 원래 케이스와 정확히 같은 인과 구조가 복원된다.

```ts
it("검색어 1글자는 title regex만 적용하고 라벨 역조회는 건너뛴다", async () => {
  await createProductService(
    // title에 "장"이 없어야 한다 — 기존 "가을맞이 청첩장"은 title에도 "장"이 있어 교체 필수
    buildProductInput({ title: "가을맞이 카드", subCategory: "wedding" }),
  );

  const result = await searchProductsService("장");

  // "장"은 subCategoryLabels.wedding === "청첩장"과 productCategoryLabels.invitation === "초대장"에
  // 모두 포함되지만, 2글자 미만이라 라벨 역조회가 스킵된다.
  // title("가을맞이 카드")에도 "장"이 없으므로 빈 배열이어야 한다.
  expect(result).toEqual([]);
});
```

**⚠️ 픽스처 title도 반드시 바꿔야 한다.** 기존 title `"가을맞이 청첩장"`을 그대로 두면 title regex 브랜치가 `"장"`에 매칭돼 1건이 반환되고, 가드와 무관한 이유로 테스트가 실패한다. 위 예시처럼 `"장"`을 포함하지 않는 title(`"가을맞이 카드"` 등)로 교체할 것.

**재설계 후 자체 검증법**: `category.ts:48`의 `LABEL_MATCH_MIN_LENGTH`를 임시로 `1`로 낮췄을 때 **이 테스트가 실패해야 한다.** 실패하지 않으면 vacuous test라 재설계가 실패한 것이다.

같은 지시가 `category.test.ts:110`(`findSubCategoriesByTerm("비") === []`)에도 적용된다 — 검색어를 `"장"`으로 바꾸면 `"청첩장"` 부분일치를 가드가 막는 구조가 유지된다.

`server/actions/createProduct.test.ts`, `updateProduct.test.ts`, admin 컴포넌트 테스트들은 전부 `subCategory: "wedding"`이라 **영향 없음.**

---

## 9. 쟁점 정리

### 해결됨 (api-designer 1라운드에서 전건 합의, 2026-08-05)

| # | 쟁점 | 판정 |
|---|---|---|
| 1 | 쿼리파라미터 이름 | ✅ **`subCategory`로 확정** — DB/응답/클라state와 4겹 일치 (§7-0) |
| 2 | 값 형식 | ✅ **enum key** (`wedding`/`first-birthday`). 라벨 금지, 단일값 (§7-0) |
| 3 | `"all"` 센티널 | ✅ **파라미터 부재 = 전체**가 정규형. `=all`은 수용만, 생성 안 함 (§7-0) |
| 4 | 무효값 정책 | ✅ **무시 → 전체** (400/404 아님). Server Component 경로라 에러 채널 부재 (§7-0) |
| 5 | REQ-4가 DB 쿼리를 추가하는가 | ✅ **추가 안 함** — 클라 메모리 필터 초기값 주입. 인덱스/필드/시그니처 전부 무변경 (§6-2) |
| 6 | `response/product.schema.ts:17` `subCategory: z.string()` 축소 여부 | ✅ **무변경으로 합의** — 좁히면 과거 값에 대해 응답 파싱이 깨질 위험. db-migrator 초안 §3-3 단서와 동일 결론, 이견 없음 |

### 리더 판정 (2026-08-05)

| # | 쟁점 | 판정 |
|---|---|---|
| 7 | `response/product.schema.ts:16`의 **`category`** 를 `z.enum(PRODUCT_CATEGORIES)`로 바꿀지 | ✅ **REQ-2 범위에 포함 확정** — "REQ-2 취지(하드코딩 3곳 통합)에 정확히 부합, 값 집합 동일해 회귀위험 0". db-migrator 권장안 + api-designer "포함 권장" 의견 채택 (§3-3, §3-4) |
| 8 | `product.service.test.ts:439-449` 처리 | ✅ **raw 삭제 금지, 재설계 지시** — 남은 라벨로 가드 성질 재현. Phase2 backend-impl / Phase4 test-suite 대상 (§8-1) |

> #7은 #6과 **다른 필드**다. #6은 `subCategory`(좁히지 않기로 확정 = 무변경), #7은 `category`(같은 값을 상수 참조로 교체 = 변경). 같은 파일 인접 줄이라 혼동 주의 — **L16만 바꾸고 L17은 그대로 둔다.**

## 10. 미해결 쟁점

**없음.** 쟁점 8건 전건 종결(api-designer 합의 6건 + 리더 판정 2건). api-designer 쪽 미해결 쟁점도 0건임을 상호 확인했다.

**backend-impl은 이 문서 전체를 기준으로 즉시 착수 가능하다.** 착수 시 반드시 확인할 절: §3-4(교체 대상 3파일 체크리스트), §4(validator 무수정), §8-1(테스트 재설계 지시).
