# 01_db_schema.md — feat/popular-products-section DB 설계

> 작성: db-migrator-popular (Phase1 설계 팬아웃, 2026-08-05)
> **상태: 확정** — 미해결 쟁점 **0건**. api-designer-popular와 쟁점 4건 전건 합의 + 보강 4건 반영 완료(§8), 계약 확정본 `01_api_contract.md` §2.3/§2.3.1과 내용 일치.
> 근거 파일: `src/server/models/product.model.ts`, `src/server/models/CLAUDE.md`, `src/server/services/product.service.ts`, `src/server/services/CLAUDE.md`, `src/shared/schemas/response/product.schema.ts`, `node_modules/mongoose/lib/helpers/aggregate/prepareDiscriminatorPipeline.js`
> 선행 문서: `_workspace/feat/subcategory-navigation-section/01_db_schema.md` §6 (Product 인덱스 0개 / 인덱스 미생성 판단 — 본 문서가 **같은 결론을 다른 근거로 재확인**한다)
> **실측 근거**: 이 문서의 파이프라인 동작 주장은 전부 `mongodb-memory-server`(MongoDB 8.2.6, 단일 노드 replSet) + 이 프로젝트의 `mongoose@8.20.3`로 **직접 실행해 확인**했다(§3). 후보 구현체는 프로젝트 `tsconfig` 설정으로 `tsc --noEmit` **통과 확인**(§4-3).

---

## 0. 결론 요약

| 항목 | 판단 |
|---|---|
| 신규 모델 | **불필요** — 기존 `Product` 확장으로 전부 해결 |
| 신규 필드 (DB) | **0개** — `likes: ObjectId[]`가 이미 존재 |
| 신규 필드 (응답) | **0개** — `likesCount`는 파이프라인 내부 계산명, `$unset`으로 제거 |
| 모델 파일 변경 | **0줄** — `product.model.ts` 무수정 |
| 마이그레이션 / backfill | **불필요** |
| 인덱스 추가 | **불필요** (§5, 실측 explain 근거 포함) |
| 조회 방식 | `find().sort()` **불가** → **aggregation pipeline** 필수 (§2-1) |
| 조회 경로 | **신규 함수** `getPopularProductsService(limit = 8, userId?)` — `getAllProductsService` 확장 안 함 (§4-1, api-designer 합의) |
| `transformProduct` | **그대로 재사용** — 새 변환 함수 만들지 않는다 (§4-2) |
| `productResponseSchema` | **무변경** |
| 🔴 배포/검증 주의 | **dev DB 2건으로는 REQ-2 섹션이 절대 렌더되지 않는다** — 시딩 없이는 "안 보이는 게 정상"과 "버그"를 구분 못 한다 (§6) |

이번 기능의 DB 작업은 **"저장 구조를 하나도 바꾸지 않고 읽기 경로 하나를 새로 여는 것"** 이다. 스키마도, 저장값도, 문서 개수도, 인덱스도 변하지 않는다. 유일한 신규성은 **이 프로젝트 최초의 aggregation 사용**이라는 점이며(`grep -rn "aggregate" src/` 0건), 그래서 이 문서는 "무엇을 바꾸는가"보다 **"처음 쓰는 도구의 함정이 어디인가"** 에 분량을 쓴다.

---

## 1. REQ-1 — 왜 스키마를 안 바꾸는가

`product.model.ts:116-119`가 이미 필요한 걸 전부 갖고 있다.

```ts
likes: {
  type: [{ type: Schema.Types.ObjectId, ref: "User" }],
  default: [],
},
```

| 요구 | 기존 스키마로 충족되는가 | 근거 |
|---|---|---|
| 좋아요 수 = 배열 길이 | ✅ | `updateProductLikeService`(product.service.ts:283-287)가 `$addToSet`/`$pull`을 쓴다 → **중복 원소가 구조적으로 불가능**하므로 `likes.length`가 곧 "좋아요한 서로 다른 유저 수"다. 별도 카운터 필드가 없어도 의미가 정확하다 |
| 좋아요 0개 제외 | ✅ | `default: []`라 정상 문서엔 항상 배열이 있다 → `likes.0` 존재 여부로 판정 (§2-2) |
| soft delete 유지 | ✅ | `deletedAt: { type: Date, default: null }` (product.model.ts:136) |
| 상품 카드 표시 필드 | ✅ | 가격/할인/서브카테고리/좋아요수 전부 기존 필드. `00_requirements.json` background[2]가 확인 |

→ **`models/CLAUDE.md`의 "기존 모델 확장으로 해결되면 신규 모델 생성 금지" 원칙에 따라 모델 파일은 한 글자도 건드리지 않는다.** `likesCount` 비정규화 필드 추가는 §7에서 명시적으로 기각한다.

---

## 2. REQ-1 핵심 — 배열 길이 정렬은 `find().sort()`로 불가능하다

### 2-1. `find().sort({ likes: -1 })`이 왜 안 되는가 (기각 근거)

MongoDB의 `sort`는 **필드 값**을 기준으로 정렬한다. `likes`는 배열이므로 `sort({ likes: -1 })`은 "배열 길이"가 아니라 **배열 원소 중 최댓값(내림차순 기준)** 으로 정렬한다 — ObjectId 배열이면 "가장 큰 ObjectId를 가진 문서 순", 즉 **가장 최근에 가입한 유저가 좋아요한 순서**라는 전혀 다른 의미가 된다. 에러가 안 나고 그럴듯한 순서가 나오기 때문에 **이 실수는 조용히 통과한다** — 구현자가 가장 빠지기 쉬운 함정이라 여기에 못 박는다.

배열 길이는 문서에 저장돼 있지 않은 **계산값**이므로, 정렬에 쓰려면 두 가지 길밖에 없다.

1. **aggregation으로 계산 필드를 만들어 정렬** ← 채택
2. **길이를 필드로 비정규화 저장** ← 기각 (§7)

### 2-2. 확정 파이프라인

```ts
[
  { $match: { deletedAt: null, "likes.0": { $exists: true } } },
  // $ifNull은 방어적 중복이지만 유지한다 — $size는 인자가 missing이면 null이 아니라 에러(Location17124)를 던진다.
  { $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
  { $sort: { likesCount: -1, isFeatured: -1, priority: -1, createdAt: -1, _id: -1 } },
  { $limit: take },   // take는 클램프된 값 — §4-3
  { $unset: "likesCount" },
]
```

스테이지별 설계 의도:

| 스테이지 | 의도 | 대안을 안 쓴 이유 |
|---|---|---|
| `$match` 1순위 배치 | 정렬 대상 문서를 먼저 줄인다 | 계산 후 필터링하면 전건에 `$size`를 돌린 뒤 버리게 된다 |
| `"likes.0": { $exists: true }` | 좋아요 ≥ 1 | `$expr: { $gte: [{ $size: "$likes" }, 1] }`은 **동치가 아니다** — §2-3 |
| `$addFields` + `$size` | 배열 길이를 정렬 가능한 스칼라로 승격 | `$project`를 쓰면 남길 필드를 전부 열거해야 해서 스키마 변경에 취약해진다 |
| `$sort` 5단 | 결정적(deterministic) 전순서 | 순위 배지를 붙이므로 동점 흔들림 불가 — §2-4 |
| `$limit` | Top N | `$sort`와 인접해야 top-k 최적화가 걸린다 — §2-5 |
| `$unset` | 내부 계산 필드 제거 | 안 지우면 응답 shape이 오염된다 — §2-6 |

### 2-3. 🔴 `"likes.0": { $exists: true }` vs `$expr` + `$size` — 동치가 아니다 (실측)

`likes` 필드 자체가 없는 문서(스키마 `default: []`가 붙기 전에 생성됐거나 다른 경로로 들어온 문서)가 **하나라도** 있으면 두 형태의 결과가 갈린다.

| 형태 | `likes` 필드 없는 문서를 만났을 때 | 실측 결과 |
|---|---|---|
| `"likes.0": { $exists: true }` | 조용히 제외 (원하는 동작) | ✅ 정상 |
| `$expr: { $gte: [{ $size: "$likes" }, 1] }` | **쿼리 전체가 실패** | ❌ `Location17124: The argument to $size must be an array, but was of type: missing` |

즉 `$expr` 형태는 "0개 상품이 섞여 나온다"가 아니라 **홈 화면 전체가 500으로 죽는** 실패 모드를 갖는다. `$exists` 형태는 인덱스를 탈 수 있다는 부수적 장점도 있다(지금은 인덱스를 안 만들지만 — §5).

같은 이유로 `$addFields`의 `$ifNull`도 **지우면 안 된다**. `$match`를 먼저 통과했으니 그 시점엔 `likes`가 항상 non-empty 배열이라 논리적으로는 중복이지만, 나중에 스테이지 순서가 바뀌거나 `$match` 조건이 완화되는 순간 조용한 오동작이 아니라 500이 된다. 비용 0이므로 **주석과 함께 남긴다**(위 코드 블록의 주석 문구를 그대로 옮길 것).

### 2-4. 🔴 정렬 5단을 축약하지 않는다 — 순위 배지가 붙기 때문

REQ-3이 카드에 `rank`(1/2/3…)를 그리므로 **같은 데이터에 대해 항상 같은 순위**가 나와야 한다. `(main)/page.tsx`는 `revalidate = 3600`이라 페이지가 주기적으로 재생성되는데, 그때마다 3위와 4위가 뒤바뀌면 사용자에겐 "순위가 이유 없이 흔들리는" 버그로 보인다.

- `likesCount` 동점은 **흔하다** — 좋아요 1개짜리가 여러 개인 초기 상태가 정확히 그 케이스다.
- `isFeatured` → `priority`: 동점 시 운영자 큐레이션이 이기게 한다. 기존 카탈로그 정렬(`getAllProductsService`의 `{ isFeatured: -1, priority: -1, createdAt: -1 }`)과 **같은 우선순위 축**을 재사용하는 것이라 새 규칙을 도입하지 않는다.
- `createdAt`: `timestamps: true` 자동 세팅이라 **같은 밀리초에 생성된 문서끼리 동점이 날 수 있다**(시딩 스크립트가 루프로 생성하면 실제로 발생한다).
- **`_id`: 유일 필드다. 이걸 넣어야만 정렬이 total order가 되어 결과가 수학적으로 결정된다.**

> ⚠️ **실측 결과의 정직한 보고**: 완전 동점 문서 6건으로 5회 반복 실행했을 때 `_id`를 **뺀** 파이프라인도 이번엔 매번 같은 순서를 냈다(자연 순서로 떨어짐). 즉 "빼면 즉시 깨진다"는 재현되지 않았다. 그럼에도 `_id`를 유지하는 근거는 **보장의 유무**다 — MongoDB는 정렬 키가 동점인 문서의 순서를 보장하지 않으며(비-안정 정렬), 문서가 update로 물리적으로 이동하거나 top-k 힙 구현이 바뀌면 순서가 바뀔 수 있다. `_id`를 넣으면 이 논의 자체가 사라진다. **테스트가 통과했다는 이유로 이 키를 제거하지 말 것** — 이 함정은 CI에서 안 잡히고 운영에서만 드러난다.

### 2-5. `$sort` + `$limit` 인접 배치 — top-k 최적화 (실측 확인)

`explain("executionStats")`에서 두 스테이지가 **하나로 합쳐진 것**을 확인했다.

```json
{"$sort":{"sortKey":{"likesCount":-1,"isFeatured":-1,"priority":-1,"createdAt":-1,"_id":-1},"limit":8},
 "totalDataSizeSortedBytesEstimate":4742,"usedDisk":false,"spills":0,"nReturned":8}
```

`"limit": 8`이 `$sort` 안으로 들어갔다 = MongoDB가 전체를 정렬한 뒤 자르는 게 아니라 **크기 8짜리 힙만 유지**한다. 덕분에 인덱스 없는 정렬의 32MB 인메모리 한도가 실질적으로 문제되지 않는다(정렬 버퍼가 상위 8건 크기로 제한됨). **두 스테이지 사이에 다른 스테이지를 끼워 넣으면 이 최적화가 깨지므로 반드시 인접시킬 것.**

### 2-6. `$unset: "likesCount"` — 응답 오염 방지 (실측 확인)

`transformProduct`(product.service.ts:28-44)가 `...rest`로 스프레드하므로, `likesCount`를 안 지우면 **그대로 `ProductJSON`에 실려 나간다.** `src/shared/schemas/response/product.schema.ts`의 `productResponseSchema`에 없는 필드가 응답 shape에 생긴다.

- 실측: `$unset` 통과 후 결과 객체 키에 `likesCount` **없음** 확인. explain상 `$unset`은 `{"$project":{"likesCount":false,"_id":true}}`로 컴파일된다.
- `$unset`은 MongoDB **4.2+** 스테이지다(Atlas·테스트 환경 모두 충족). 4.2 미만을 지원해야 하면 `$project: { likesCount: 0 }`으로 바꿔야 하지만 이 프로젝트는 해당 없음.

**DB↔API 필드명 정렬 결론(api-designer 합의):** `likesCount`는 **DB 저장 필드도 아니고 응답 필드도 아니다.** 파이프라인 내부에서만 존재하는 계산명이다. 섹션의 "3개 미만 숨김"(REQ-2)과 카드의 좋아요 수 표시는 기존 `likes: string[]`의 `.length`로 전부 해결되므로 응답에 카운트를 새로 실을 이유가 없다 → **`productResponseSchema` 무변경, 신규 응답 필드 0개.**

---

## 3. 실측 검증 기록 (mongodb-memory-server 8.2.6 + mongoose 8.20.3)

이 프로젝트 최초의 aggregation이라 "문서상 그렇다"로 넘기지 않고 전부 실행해서 확인했다. 재현 스크립트는 임시 파일로만 돌렸고 리포지토리에 남기지 않았다(구현 시 §9의 테스트로 자연스럽게 커버된다).

| # | 검증 항목 | 결과 |
|---|---|---|
| 1 | 정렬·필터 정확성 — 좋아요 3/2(featured)/2/1/0개 + soft-deleted + `likes` 필드 없는 문서를 섞어 투입 | ✅ `[A(3), E(2,featured), D(2), B(1)]`. 0개·삭제·필드없음 전부 제외, featured가 동점 앞 |
| 2 | `$unset` 동작 | ✅ 결과 객체에 `likesCount` 키 없음 |
| 3 | `$ifNull` 없이 `$size: "$likes"` | ❌ `Location17124` 에러 — §2-3 주장 확인 |
| 4 | `$expr: { $gte: [{ $size: "$likes" }, 1] }` | ❌ 동일하게 `Location17124` — **`$exists` 형태와 동치가 아님 확인** |
| 5 | `InvitationProductModel.aggregate(pipeline)` | ⚠️ 첫 스테이지가 `{"$match":{"deletedAt":null,"likes.0":{"$exists":true},"category":"invitation"}}`로 **호출자가 넘긴 배열이 직접 mutate됨** — §4-4 |
| 6 | `ProductModel.aggregate(pipeline)` (base) | ✅ 첫 스테이지 무변경, 전 카테고리 반환 |
| 7 | `$limit: 0` | ❌ `Location15958: the limit must be positive` — 빈 배열이 아니라 **던진다**. §4-3 클램프 필요 근거 |
| 8 | 컬렉션 인덱스 목록 | ✅ `[{ "key": { "_id": 1 }, "name": "_id_" }]` — `_id` 외 0개(선행 문서 §6-1 재확인) |
| 9 | explain 실행계획 | `COLLSCAN` + `$sort`에 `limit: 8` 병합, `usedDisk: false`, `spills: 0` — §2-5 |
| 10 | 완전 동점 6건 × 5회 반복 | `_id` tie-break 포함 시 매회 동일 순서. 제외 시에도 이번엔 동일했음(§2-4의 정직한 단서 참고) |

---

## 4. 구현 계약 (backend-impl 대상)

### 4-1. 신규 함수 — `getAllProductsService`를 확장하지 않는다 (api-designer 합의)

`getPopularProductsService(limit = 8, userId?)`를 `src/server/services/product.service.ts`에 **새로 추가**한다.

- **DB 관점 동의 근거**: `getAllProductsService`는 `find().sort()` 경로다. 좋아요 정렬은 §2-1대로 **쿼리 엔진 자체가 다르다**(find vs aggregate). 옵션 파라미터로 분기하면 함수 하나가 내부에서 실행 경로를 통째로 스위칭하게 되고, 기존 6개 호출부(`products/[category]/page.tsx`, `products/[category]/[id]/page.tsx`, `admin/products/page.tsx`, `api/products/route.ts` 등)가 전부 이 분기의 회귀 표면이 된다.
- **선례 일치**: `getFeaturedTemplatesService`(priority ≥ 1 전용 조회)가 이미 "목적별 전용 조회 함수" 패턴이다. 새 패턴을 도입하는 게 아니다.
- **기존 함수 무변경** → 기존 호출부 회귀 위험 0.

### 4-2. `transformProduct`를 그대로 재사용한다 — 새 변환 함수 금지

aggregate 출력은 `find().lean()` 출력과 **형태가 같다**: `_id`는 `ObjectId`, `likes`는 `ObjectId[]`, `createdAt`/`updatedAt`은 `Date`. 따라서 `_id.toString()`, `likes.map(String)`, ISO 변환, `discountedPrice` 계산, `isLiked` 판정이 전부 기존과 동일하게 동작한다.

- `.lean()`을 **붙이지 않는다** — `aggregate()`는 이미 POJO를 리턴한다(Document 인스턴스가 아니라 `.lean()` 자체가 존재하지 않는 개념). `services/CLAUDE.md`의 lean 규칙은 `find()` 계열 대상이다.
- aggregate는 스키마 default/캐스팅을 적용하지 않지만, **기존 읽기 경로가 전부 `.lean()`이라 역시 default 미적용**이다 → 동등하다. `transformProduct`가 새로 깨질 지점 없음.
- invitation discriminator 전용 필드(`previewUrl`/`theme`)도 같은 컬렉션이라 그대로 실려 온다(§3 #6 실측).

### 4-3. `limit` 클램프는 서비스가 갖는다 (tsc 통과 확인)

`$limit`은 0 이하를 받으면 빈 배열이 아니라 **에러를 던진다**(§3 #7). `limit`이 시그니처로 외부에 노출되는 이상 방어선은 호출부가 아니라 서비스에 있어야 한다.

```ts
const take = Math.min(Math.max(Math.trunc(limit), 1), 50);
```

아래 후보 구현체 전문을 프로젝트 `tsconfig`(`strict: false`, `noImplicitAny: true`, `moduleResolution: "bundler"`) 그대로 **`tsc --noEmit` 통과 확인**했다 — 제네릭 `aggregate<LeanProduct>()`, `.catch()` 체인, `transformProduct` 인자 타입까지 전부 에러 0.

```ts
export const POPULAR_PRODUCTS_LIMIT = 8;

export const getPopularProductsService = async (
  limit: number = POPULAR_PRODUCTS_LIMIT,
  userId?: string,
): Promise<ProductJSON[]> => {
  await dbConnect();

  // $limit은 0 이하를 받으면 빈 배열이 아니라 MongoServerError를 던진다.
  const take = Math.min(Math.max(Math.trunc(limit), 1), 50);

  // 파이프라인은 함수 안에서 매번 새 배열 리터럴로 만든다(모듈 상수 금지) — §4-4.
  const products = await ProductModel.aggregate<LeanProduct>([
    { $match: { deletedAt: null, "likes.0": { $exists: true } } },
    // $ifNull 유지 — $size는 인자가 missing이면 null이 아니라 에러(Location17124)를 던진다.
    { $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
    { $sort: { likesCount: -1, isFeatured: -1, priority: -1, createdAt: -1, _id: -1 } },
    { $limit: take },
    { $unset: "likesCount" },
  ]).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "인기 상품 조회에 실패했습니다.",
    );
  });

  return products.map((p) => transformProduct(p, userId));
};
```

- `await dbConnect()`를 **먼저** 호출한다 — aggregate도 예외가 아니다. 이 프로젝트는 `bufferCommands: false`라 커넥션 전 호출이 즉시 에러가 된다(`services/CLAUDE.md`).
- `.catch()`로 `AppError("INTERNAL", ...)` 래핑 — `services/CLAUDE.md`의 "raw mongoose 에러를 그대로 던지지 않는다" 규칙. mongoose `Aggregate`는 thenable이라 `.catch()`가 실재한다(`lib/aggregate.js:1158`).
- `ProductModel.aggregate<LeanProduct>([...])` 제네릭을 준다 — **`as LeanProduct[]` 캐스팅 금지.** `aggregate()`의 기본 리턴이 `any[]`라 `as`로 받으면 파이프라인이 바뀌어도 타입이 안 잡는다.

### 4-4. 🔴 base `ProductModel`로만 호출 + 파이프라인을 모듈 상수로 빼지 않는다

mongoose는 **discriminator 모델의 aggregate에 판별 조건을 자동 주입**한다(`lib/helpers/aggregate/prepareDiscriminatorPipeline.js`). 문제는 주입 방식이 **호출자가 넘긴 배열의 첫 `$match` 객체를 직접 mutate**한다는 것이다(§3 #5 실측).

- `InvitationProductModel.aggregate(p)` → `p[0].$match`에 `category: "invitation"`이 **영구히 박힌다**.
- base `ProductModel`은 `discriminatorMapping.isRoot`라 주입이 없다 → 전 카테고리 반환(§3 #6).

따라서 **(1) base 모델로만 호출하고, (2) 파이프라인 배열을 모듈 레벨 상수로 빼지 않는다.** 상수로 빼면 어느 호출이 한 번이라도 discriminator 모델을 타는 순간 그 이후 모든 호출이 오염된 배열을 재사용한다 — 함수 호출마다 새 배열 리터럴을 만든다.

---

## 5. 인덱스 — 추가하지 않는다

### 5-1. 현재 상태 (실측 재확인)

Product 컬렉션 인덱스는 `_id_` **하나뿐**이다(§3 #8). 선행 문서 `feat/subcategory-navigation-section/01_db_schema.md` §6-1의 서술과 일치한다. 다른 모델엔 인덱스가 있다(`user.email`, `order.merchantUid`, `payment.impUid`, `feature.code` 등) — Product만 없는 게 현 상태다.

### 5-2. 근거 4가지

1. **정렬 키가 계산 필드다.** `likesCount`는 저장돼 있지 않으므로 **어떤 인덱스로도 정렬을 커버할 수 없다.** blocking in-memory sort가 구조적으로 불가피하다 → 인덱스는 `$match` 단계만 커버하게 되는데, 그 이득이 정렬 비용에 묻힌다.
2. **문서 2건이다**(`00_requirements.json` background / 선행 문서 §1). 이 규모에서 인덱스 스캔 + fetch 왕복은 COLLSCAN보다 느릴 수 있다. 실측 explain도 `executionTimeMillis: 0`, `totalDocsExamined: 30`(테스트 데이터 30건 기준)으로 부하가 없다.
3. **top-k 최적화가 이미 걸려 있다**(§2-5). `$sort`에 `limit: 8`이 병합돼 정렬 버퍼가 상위 8건으로 제한되므로, 인덱스 없는 정렬의 32MB 한도도 실질적으로 도달하지 않는다.
4. **안 쓰이는 인덱스는 나중 진단을 흐린다** — 진짜 느려졌을 때 "인덱스 있는데 왜 느리지"로 한 번 헤맨다. 선행 문서 2건(`feat/product-search` §3-3, `feat/subcategory-navigation-section` §6-3)과 동일한 판단이다.

### 5-3. 굳이 건다면 무엇이 되는가 (지금 만들지 말 것)

`$match`의 `"likes.0": { $exists: true }`를 커버하려면 `{ likes: 1 }` **멀티키 인덱스**가 된다. 멀티키는 배열 원소 수만큼 인덱스 엔트리를 만들면서(좋아요 100개면 엔트리 100개) **정렬에는 쓰이지도 못한다.** 비용 대비 이득이 거의 없다 — 이게 이 기능에서 인덱스가 특별히 매력 없는 이유다.

### 5-4. 재검토 트리거 2개 (api-designer 계약 §2.3.1과 동일)

1. **상품 수가 늘어 인기 섹션 조회 지연이 실측될 때** — 추측이 아니라 `.explain("executionStats")`의 `executionTimeMillis` / `totalDocsExamined`로 판단한다. 이때는 인덱스보다 §7의 `likesCount` 비정규화가 먼저 검토 대상이다(계산 필드 정렬이라는 근본 원인을 없애는 쪽이므로).
2. 🔴 **카탈로그 조회(`getAllProductsService`/`getProductService`)가 `status` 필터를 도입하면 이 쿼리도 같은 커밋에서 따라가야 한다** — §6-2 참고. 안 따라가면 "품절 상품이 인기 1위" 형태로 드러난다.

---

## 6. 조회 조건 — `deletedAt: null`만 건다

### 6-1. 확정 (api-designer 합의)

REQ-1 수용조건 문구 "deletedAt:null 등 기존 조회 조건(soft delete 등) 유지"는 `status` 필터 포함/미포함 양쪽으로 읽힌다. **미포함으로 확정**했다. 근거 3가지:

1. `deleteProductService`(product.service.ts:247-250)가 `status: "deleted"`와 `deletedAt`을 **함께** 세팅한다 → `deletedAt: null`만으로 삭제 문서는 전건 제외된다. `status: "active"`를 더 걸어도 **삭제 제외 효과는 0**이다.
2. 남는 차이는 `inactive`/`soldOut`뿐인데, 상세(`getProductService`)와 카탈로그 그리드(`getAllProductsService`)가 **둘 다 status를 안 건다.** 인기 섹션에만 걸면 "그리드엔 있는데 인기엔 없다"는 비대칭이 생긴다. 반대로 안 걸면 **인기 섹션 → 상세 이동이 항상 200**이라 죽은 링크가 안 생긴다.
3. `getFeaturedTemplatesService`가 `status: "active"`를 거는 건 그게 **운영자 큐레이션(priority ≥ 1)** 이라 노출 대상을 사람이 고르는 자리이기 때문이다. 인기 섹션은 **사용자 행동(좋아요) 기반 자동 산출**이라 성격이 다르다.

### 6-2. 이 결정이 깨지는 조건 (§5-4 트리거 #2와 동일)

위 근거 2가 "카탈로그도 status를 안 건다"에 의존한다. 카탈로그가 status 필터를 도입하는 순간 이 근거가 무효가 되므로 **같은 커밋에서 이 쿼리도 따라가야 한다.**

### 6-3. 🔴 dev 데이터로는 REQ-2 섹션이 절대 렌더되지 않는다 (구현·검증팀 필독)

REQ-2가 "좋아요 1개 이상인 상품이 **3개 미만이면 섹션 자체를 숨긴다**"인데, **dev DB의 products는 2건이다.** 두 건 모두에 좋아요가 있어도 3 미만이므로 **섹션은 구조적으로 렌더되지 않는다.**

이게 왜 위험한가: 구현 후 로컬/dev에서 홈을 열면 인기 섹션이 **안 보이는 게 정상**인데, 이 사실을 모르면 "왜 안 나오지"로 헤매거나 반대로 **"안 보이니까 통과"로 오판**한다. 조회 로직이 완전히 깨져 있어도 화면상 증상이 동일하다.

**검증 절차 지시:**

```js
// 1) 현재 상태 확인 (읽기 전용)
db.products.countDocuments({ deletedAt: null });                          // dev 기대: 2
db.products.countDocuments({ deletedAt: null, "likes.0": { $exists: true } });  // 인기 후보 수
db.products.countDocuments({ likes: { $exists: false } });                // §2-3 레거시 문서 유무. 기대: 0
```

- **좋아요 ≥ 1인 상품이 최소 4건 이상 되도록 시딩한 뒤 확인한다** — 3건이면 "경계 통과"만 보이고 정렬이 맞는지는 안 보인다. 좋아요 수를 서로 다르게(예: 5/3/2/1) 주고 **배지 순위가 그 순서와 일치하는지**까지 봐야 §2-1의 "배열 최댓값 정렬" 함정이 드러난다.
- **동점 케이스를 반드시 포함한다**(좋아요 수가 같은 상품 2건) — §2-4 tie-break가 실제로 붙는지 확인.
- 통합 테스트(Phase4)는 `mongodb-memory-server`에 위 조합을 직접 시딩하므로 dev DB 건수와 무관하게 검증 가능하다 — **화면 확인보다 테스트를 1차 증거로 삼을 것.**
- 세 번째 카운트 쿼리가 **0이 아니면** §2-3이 실제 리스크로 승격된다(그 경우에도 채택 파이프라인은 안전하지만, `$expr` 형태로 바꾸자는 제안이 나오면 절대 수용하지 말 것).

---

## 7. 마이그레이션 / 대안 — 전부 불필요·기각

### 7-1. 마이그레이션 불필요

| 마이그레이션이 필요해지는 조건 | 이번 케이스 |
|---|---|
| 필드 추가/삭제 | ❌ 없음 — `likes`/`deletedAt` 둘 다 기존 필드 |
| 필드 타입 변경 | ❌ 없음 |
| 저장값 변환 필요 | ❌ 없음 — 읽기 전용 기능 |
| 인덱스 생성/삭제 | ❌ 없음 (§5) |
| 기존 문서 무효화 | ❌ 없음 — validator/enum 무변경 |

→ **backfill 스크립트 산출물 없음.** §6-3의 카운트 쿼리는 데이터를 바꾸지 않는 **읽기 전용 확인**이지 마이그레이션이 아니다.

### 7-2. `likesCount` 비정규화 — 이번 범위에서 기각

`productSchema`에 `likesCount: { type: Number, default: 0 }`를 추가하고 `find().sort({ likesCount: -1 })`로 가는 안. **지금은 채택하지 않는다.**

| 비용 | 내용 |
|---|---|
| 쓰기 경로 수정 | `updateProductLikeService`의 `$addToSet`/`$pull`에 `$inc: { likesCount: ±1 }`를 함께 걸어야 한다 |
| 정합성 리스크 | 배열과 카운터가 **어긋날 수 있는 상태**를 새로 만든다. `$addToSet`은 이미 있는 원소면 배열을 안 바꾸는데 `$inc`는 무조건 증가하므로, **토글 로직을 잘못 짜면 카운트만 부풀어 오른다**(현재 구조는 배열 길이가 곧 진실이라 이 버그가 존재할 수 없다) |
| 마이그레이션 | 기존 전 문서에 `likesCount = likes.length` 백필 필요 |
| 이득 | 현재 데이터 규모(2건)에서 **0** |

→ **§5-4 트리거 #1 도달 시 재검토한다. 가정만으로 미리 만들지 않는다**(`services/CLAUDE.md`의 트랜잭션 옵션 판단과 같은 원칙).

### 7-3. 전체 조회 후 JS 정렬 — 기각

`getAllProductsService()` 결과를 `.sort((a,b) => b.likes.length - a.likes.length).slice(0,8)`. 상품 전건을 앱 메모리에 올리고 Top 8만 쓰려고 O(전체)를 지불한다. DB가 top-k로 할 수 있는 일을 앱으로 끌어오는 방향이라 규모가 커질수록 정확히 반대로 간다. 기각.

### 7-4. 알려진 한계 (조치 없음, 기록용)

`likes`는 `ref: "User"` ObjectId 배열인데 **유저 문서가 사라져도 그 원소는 남는다.** 즉 탈퇴 유저의 좋아요가 카운트에 계속 포함된다. 현재 코드베이스에 **유저 하드 삭제 경로가 없어서**(`grep`으로 `deleteOne`/`findOneAndDelete` 확인 → guestbook 1곳뿐) 실제로 발생하지 않는다. 유저 삭제 기능이 생기면 그때 `$pull` 정리 또는 카운트 보정을 함께 설계해야 한다 — **이번 범위 밖.**

---

## 8. api-designer-popular 협의 결과 — 전건 합의 (1라운드, 2026-08-05)

| # | 쟁점 | 판정 | 반영 위치 |
|---|---|---|---|
| 1 | 조회 경로 (기존 확장 vs 신규 함수) | ✅ **신규 함수 `getPopularProductsService`** | §4-1 / 계약 §2.2 |
| 2 | "좋아요 ≥ 1" 표현 | ✅ **`"likes.0": { $exists: true }`** — `$expr`+`$size`는 동치 아님(실측) | §2-3 / 계약 §2.3 |
| 3 | `$unset: "likesCount"` 필수 여부 | ✅ **필수.** 응답 필드 0개 추가, `productResponseSchema` 무변경 | §2-6 / 계약 §2.3 |
| 4 | `status` 필터 | ✅ **`deletedAt: null`만** — 근거 3개 | §6-1 / 계약 §2.3 |
| 5 | tie-break에 `_id` 포함 여부 | ✅ **포함(축약 금지)** | §2-4 / 계약 §2.3 |
| 6 | 인덱스 | ✅ **추가 안 함** + 재검토 트리거 2개 | §5 / 계약 §2.3.1 |
| 7 | 응답 필드명 (`likes` vs `likesCount`) | ✅ **기존 `likes: string[]` 유지, 신규 필드 0개** | §2-6 |

**db-migrator가 제기해 계약에 반영된 보강 4건**: `limit` 클램프(§4-3) / `await dbConnect()` 선행(§4-3) / `aggregate<LeanProduct>()` 제네릭(§4-3) / base 모델 강제 + 파이프라인 모듈 상수 금지(§4-4). api-designer가 `01_api_contract.md` §2.3 코드블록과 체크리스트에 전건 반영 완료했음을 확인했다.

---

## 9. 구현자 체크리스트 (backend-impl / test-suite)

DB 관점에서 **이걸 안 지키면 조용히 틀리는** 항목만 추렸다.

- [ ] `product.model.ts`를 **수정하지 않는다** (신규 필드·인덱스 0개)
- [ ] `getAllProductsService`를 **수정하지 않는다** (신규 함수만 추가)
- [ ] `sort({ likes: -1 })`을 쓰지 않는다 — 에러 없이 **틀린 순서**가 나온다 (§2-1)
- [ ] `$expr` + `$size`로 바꾸지 않는다 — `likes` 없는 문서에서 500 (§2-3)
- [ ] `$ifNull`을 "중복이니까" 지우지 않는다 (§2-3)
- [ ] `$unset: "likesCount"`를 빠뜨리지 않는다 (§2-6)
- [ ] `$sort`와 `$limit` 사이에 다른 스테이지를 끼우지 않는다 (§2-5)
- [ ] tie-break 5단을 축약하지 않는다, 특히 `_id` (§2-4)
- [ ] base `ProductModel`로 호출한다, 파이프라인은 함수 안 배열 리터럴 (§4-4)
- [ ] `await dbConnect()` 선행 / `limit` 클램프 / `aggregate<LeanProduct>()` 제네릭 (§4-3)
- [ ] `.lean()`을 붙이지 않는다 (§4-2)
- [ ] 테스트는 **좋아요 ≥ 1 상품 4건 이상 + 동점 케이스 포함**으로 시딩한다 — 3건짜리 테스트는 정렬 정확성을 증명하지 못한다 (§6-3)
- [ ] 테스트에 **좋아요 0개 문서**와 **soft-deleted 문서**를 반드시 섞는다 — 둘 다 제외되는지 (§3 #1)

---

## 10. 미해결 쟁점

**없음.** 쟁점 7건 전건 합의(§8), api-designer 쪽 미해결 쟁점도 0건임을 상호 확인했다.

**backend-impl은 이 문서 + `01_api_contract.md` §2.3/§2.3.1을 기준으로 즉시 착수 가능하다.** 착수 전 반드시 볼 절: §4(구현 계약), §6-3(dev 데이터로는 섹션이 안 보인다), §9(체크리스트).
