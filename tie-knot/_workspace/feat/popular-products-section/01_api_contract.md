# 01. API 계약 — 인기 상품 섹션 (feat/popular-products-section)

> 작성: api-designer-popular
> 대상 요구사항: REQ-1(조회 경로), REQ-2/REQ-3에 대한 데이터 계약 부분
> 근거 문서: `docs/DATA_ACCESS.md`, `docs/ERROR_HANDLING.md`, `src/server/boundary.ts`, `src/app/api/CLAUDE.md`, `src/shared/schemas/CLAUDE.md`, `src/server/services/CLAUDE.md`

---

## 0. 결론 요약

| 항목 | 결론 |
| --- | --- |
| 신규 Route Handler(채널 B) | **없음** |
| 신규 Server Action(채널 A) | **없음** |
| 신규 zod 스키마 | **없음** (기존 `productResponseSchema` 재사용, 필드 추가 없음) |
| 신규 서비스 함수 | **있음** — `getPopularProductsService(limit?, userId?)` |
| `getAllProductsService` 변경 | **없음** (옵션 파라미터 추가 안 함) |
| 신규 상수 | `POPULAR_PRODUCTS_LIMIT = 8`, `POPULAR_PRODUCTS_MIN_ITEMS = 3` (`src/shared/constants/product.ts`) |
| 즉시 응답 / 비동기 결과 | **전부 즉시(서버 렌더 시점 동기 조회)** — 클라이언트 fetch·폴링·낙관적 업데이트 없음 |

---

## 1. 채널 결정 — 신규 엔드포인트 없음

`docs/DATA_ACCESS.md` 표 기준으로 판정한다.

| 표 행 | 조건 | 이번 기능 해당 여부 |
| --- | --- | --- |
| 1 | 서버 렌더 시점 데이터(Server Component 렌더링용) → services 직접 import | **해당** |
| 2 | 브라우저 트리거 mutation → Server Action | 미해당 (읽기 전용) |
| 3 | 브라우저가 캐싱/재검증 필요한 조회 → route.ts + `useSWR` | 미해당 |

- Home(`src/app/(main)/page.tsx`)은 Server Component이고 이미 `export const revalidate = 3600`으로 ISR 캐시된다. 같은 파일이 `getProductService` / `getFeaturedTemplatesService`를 `Promise.all`로 직접 호출하는 기존 패턴이 그대로 적용된다 — 같은 프로세스 안에서 HTTP 왕복(route.ts)을 만들 이유가 없다(DATA_ACCESS 1행 문구 그대로).
- 인기 상품 목록은 초기 렌더 이후 클라이언트가 다시 부를 일이 없다(정렬 토글·페이지네이션·무한스크롤 요구 없음, REQ-2는 "최대 8개 가로 스크롤"이 전부). 따라서 3행(useSWR/route.ts)의 트리거 조건인 "브라우저의 캐싱/재검증 필요"가 성립하지 않는다.
- Phase 3(SubCategoryNavSection) 선례와 동일한 결론이다.

**따라서 `{ success, data }` / `{ success, error }` envelope은 이번 기능에 등장하지 않는다.** envelope은 채널 A/B 경계를 넘을 때만 씌우는 것이고(`src/server/boundary.ts`의 `routeSuccess`/`routeError`/`actionError`), 이번 경로는 그 경계를 넘지 않는다. Server Component가 서비스 함수의 리턴값을 직접 받는다 — 여기에 envelope을 새로 씌우면 기존 컨벤션을 어기는 신규 패턴이 된다.

---

## 2. REQ-1 결정 — 신규 함수 `getPopularProductsService` (getAllProductsService 확장 안 함)

### 2.1 결정

`src/server/services/product.service.ts`에 신규 함수를 추가한다.

```ts
export const getPopularProductsService = async (
  limit: number = POPULAR_PRODUCTS_LIMIT,
  userId?: string,
): Promise<ProductJSON[]>
```

- 인자 순서 `(limit, userId)` 고정. `userId`는 optional 뒤쪽 — 기존 `getAllProductsService(category?, userId?)`, `getFeaturedTemplatesService(category, userId?)`와 같은 "조회 조건 먼저, userId 마지막" 규칙에 맞춘다.
- 배럴(`src/server/services/index.ts`)이 `export * from "./product.service"`라 별도 export 추가 불필요.

### 2.2 `getAllProductsService` 확장을 택하지 않은 이유

1. **실행 경로가 다르다.** `getAllProductsService`는 `find().sort()`다. 그런데 MongoDB의 `find().sort()`는 **배열 길이 기준 정렬을 지원하지 않는다** — `likes.length` 정렬은 aggregation(`$addFields` + `$sort`)이 필요하다. 옵션 파라미터를 받으면 함수 본문이 `if (sortBy === "likes") { aggregate 파이프라인 } else { find 체인 }`으로 갈라진다. 그건 "확장"이 아니라 이름 하나에 함수 두 개를 넣는 것이다.
2. **파라미터가 서로 무의미하게 곱해진다.** `category` × `sortBy` × `limit` × `minLikes` 조합 중 실제로 쓰이는 건 두 개뿐인데, 시그니처는 전 조합을 약속하게 된다. 안 쓰는 조합까지 테스트 대상이 되거나, 테스트 안 하면 조용히 깨진다.
3. **기존 소비처 회귀 위험.** `getAllProductsService`는 `/products` 그리드 등 기존 화면이 쓴다. 리턴/정렬에 손대면 이번 기능과 무관한 화면이 회귀 검증 대상이 된다.
4. **프로젝트 선례가 이미 "목적별 전용 조회 함수".** 같은 파일의 `getFeaturedTemplatesService`(priority ≥ 1 + status active 전용), `searchProductsService`(검색 전용)가 각각 자기 필터·정렬을 들고 별도 함수로 존재한다. `src/server/services/CLAUDE.md`도 "한 파일에 같은 도메인의 여러 관련 함수(조회/생성 등)를 같이 둘 수 있다"고 명시한다. 신규 함수 추가가 이 폴더의 컨벤션이다.

### 2.3 쿼리 shape (db-migrator-popular 협의 완료 — 4개 쟁점 전건 합의, 보강 4건 반영)

```ts
export const getPopularProductsService = async (
  limit: number = POPULAR_PRODUCTS_LIMIT,
  userId?: string,
): Promise<ProductJSON[]> => {
  await dbConnect();

  // $limit은 0 이하를 받으면 빈 배열이 아니라 MongoServerError를 던진다 — 서비스가 방어한다.
  const take = Math.min(Math.max(Math.trunc(limit), 1), 50);

  // 파이프라인은 함수 안에서 매번 새 배열 리터럴로 만든다(모듈 상수로 빼지 않는다) — §2.3 주의사항 참고.
  const products = await ProductModel.aggregate<LeanProduct>([
    { $match: { deletedAt: null, "likes.0": { $exists: true } } },
    // $ifNull은 방어적 중복이지만 유지한다 — $size는 인자가 missing이면 null이 아니라 에러(Location17124)를 던진다.
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

구현자가 반드시 지켜야 할 지점:

- **`await dbConnect()`를 먼저 호출한다.** aggregate도 예외가 아니다 — 이 프로젝트는 `bufferCommands: false`라 커넥션 전 호출이 즉시 에러가 된다(`src/server/services/CLAUDE.md`).
- **`limit`을 클램프한다** (`Math.min(Math.max(Math.trunc(limit), 1), 50)`). `$limit`은 0 이하를 받으면 빈 배열이 아니라 `MongoServerError: the limit must be positive`를 **던진다**. `limit`이 외부에 노출된 파라미터인 이상 방어선은 호출부가 아니라 서비스가 갖는다.
- **`ProductModel.aggregate<LeanProduct>([...])`로 제네릭을 준다** — `as LeanProduct[]` 캐스팅 금지. `aggregate()`의 기본 리턴은 `any[]`라 `as`로 받으면 파이프라인이 바뀌어도 타입 검사가 안 잡는다.
- **base `ProductModel`로만 호출한다 — `InvitationProductModel.aggregate`를 쓰지 않는다.** mongoose는 discriminator 모델의 aggregate에 `$match: { category: "invitation" }`을 파이프라인 앞에 **자동 주입**하고(`lib/helpers/aggregate/prepareDiscriminatorPipeline.js`), 그 과정에서 첫 `$match` 객체를 **직접 mutate**한다. base는 `isRoot`라 주입이 없어 전 카테고리가 나오며 invitation 문서의 `previewUrl`/`theme`도 같은 컬렉션이라 그대로 실려 온다.
- **파이프라인 배열을 모듈 레벨 상수로 빼지 않는다.** 위 mutate 동작 때문에 재사용 시 오염 위험이 있다 — 함수 호출마다 새 배열 리터럴을 만든다.
- **`"likes.0": { $exists: true }`로 "좋아요 1개 이상"을 표현한다. `$expr: { $gte: [{ $size: "$likes" }, 1] }`은 이것과 동치가 아니며, 써서는 안 되는 형태다.** (db-migrator-popular 실측 — MongoDB 8.2.6 + mongoose 8.20.3)
  - `$expr` 형태는 `likes` 필드가 없는 문서가 컬렉션에 **하나라도 있으면 `Location17124`로 쿼리 전체가 실패한다.** "그 문서만 결과에서 빠진다"가 아니라 **Home 화면이 통째로 500이 되는** 실패 모드다. `$ifNull` 없는 `$size: "$likes"`도 동일.
  - `$exists` 형태는 그런 문서를 조용히 제외하며, 계산식이 아니라 인덱스도 탈 수 있다.
  - `likes`는 스키마 `default: []`라 정상 문서엔 항상 배열이 있다(`likes.0` 존재 = 길이 ≥ 1). 다만 aggregate는 스키마 default를 적용하지 않으므로 "정상 문서만 있을 것"에 기대지 않는다.
  - **"어차피 같은 조건인데 왜 이렇게 썼지"라며 `$expr`로 되돌리지 말 것 — 같은 조건이 아니다.**
- **`$ifNull`을 지우지 않는다(주석 필수).** `$match` 이후엔 `likes`가 항상 non-empty라 방어적 중복이지만, `$size`는 인자가 missing일 때 `null`이 아니라 에러(`Location17124`)를 던진다. 나중에 스테이지 순서가 바뀌거나 `$match`가 완화되면 조용한 오동작이 아니라 500으로 터진다. 비용 0이므로 "왜 남겼는지" 주석과 함께 유지한다.
- **`$unset: "likesCount"`를 빠뜨리지 않는다.** `transformProduct`가 `...rest`로 스프레드하므로 이 필드를 안 지우면 `ProductJSON`에 `likesCount`가 섞여 나가고, `src/shared/schemas/response/product.schema.ts`의 `productResponseSchema`에 없는 필드가 응답 shape에 생긴다. `likesCount`는 **파이프라인 내부 계산명일 뿐** — DB 저장 필드도, 응답 필드도 아니다(신규 응답 필드 0개). `$unset`은 MongoDB 4.2+ 스테이지이며 Atlas·테스트 환경 모두 충족한다.
- **`.lean()`을 붙이지 않는다.** `aggregate()`는 이미 POJO를 리턴한다(Document 인스턴스가 아님). `src/server/services/CLAUDE.md`의 lean 규칙은 `find()` 계열 대상이다.
- **`transformProduct`를 그대로 재사용한다.** aggregate 출력의 `_id`는 ObjectId, `likes`는 ObjectId[], `createdAt/updatedAt`은 Date로 나오므로 `LeanProduct`와 형태가 일치한다 — `_id.toString()`, `likes.map(String)`, ISO 변환, `discountedPrice` 계산, `isLiked` 판정이 기존과 동일하게 동작한다. 별도 변환 함수를 새로 만들지 않는다. (aggregate는 스키마 default/캐스팅을 적용하지 않지만, 기존 읽기 경로가 전부 `.lean()`으로 역시 default 미적용이라 동등하다.)
- **`$sort`와 `$limit`을 인접시킨다 — 사이에 다른 스테이지를 끼우지 않는다.** 실측 explain(`{"$sort":{"sortKey":{...},"limit":8},"usedDisk":false,"spills":0}`)상 두 스테이지가 하나로 병합돼 정렬 버퍼가 상위 8건으로 제한되는 top-k 최적화가 걸린다. 사이에 뭔가 끼면 이 병합이 깨져 전건 정렬로 되돌아가고, 인덱스가 없는 정렬의 32MB 한도가 실제 위험이 된다. (`$unset`은 `$limit` 뒤에 있어 무관하다.)
- **정렬 tie-break 5단(`likesCount → isFeatured → priority → createdAt → _id`)은 축약하지 않는다.** `_id`가 유일 필드라 이걸 넣어야만 정렬이 total order가 되어 결과가 결정적이 된다 — MongoDB 정렬은 stable하지 않고 페이지가 `revalidate=3600`으로 주기 재생성되므로, 완전 동점이면 재생성마다 순위 배지가 흔들린다. `createdAt`은 timestamps 자동 세팅이라 같은 초에 생성된 문서끼리 동점이 날 수 있어 `_id`가 최종 결정자로 필요하다. 중간의 `isFeatured`/`priority`는 동점 시 운영자 큐레이션이 이기게 해 기존 카탈로그 정렬(`getAllProductsService`)과 일관되게 한다.
  - **주의: "`_id`를 빼도 테스트가 통과한다"는 뺄 근거가 아니다.** db-migrator-popular가 완전 동점 6건으로 5회 반복 실측한 결과, `_id`가 없어도 이번엔 순서가 동일하게 나왔다 — 즉 "빼면 즉시 깨진다"는 재현되지 않는다. 이 항목의 근거는 관측된 실패가 아니라 **보장의 유무**다(MongoDB는 stable sort를 보장하지 않는다). 문서 크기·인덱스·스토리지 엔진 상태가 바뀌면 순서도 바뀔 수 있고, 그때 증상은 "가끔 순위 배지가 뒤바뀐다"라 재현도 추적도 어렵다. 리뷰에서 이 줄을 지우자는 제안이 나오면 이 문단을 근거로 거절한다.
- **필터는 `deletedAt: null`만 건다 — `status` 필터는 걸지 않는다.** (1) `deleteProductService`가 `status: "deleted"`와 `deletedAt`을 함께 세팅하므로 `deletedAt: null`만으로 삭제 문서는 전건 제외된다 — `status: "active"`를 더 걸어도 삭제 제외 효과는 0. (2) 남는 차이는 `inactive`/`soldOut`뿐인데 상세(`getProductService`)와 카탈로그 그리드(`getAllProductsService`)가 둘 다 status를 안 걸므로, 인기 섹션에만 걸면 "그리드엔 있는데 인기엔 없다"는 비대칭이 생긴다. 안 거는 쪽이 인기 섹션 → 상세 이동이 항상 200이 되어 죽은 링크도 안 생긴다. (3) `getFeaturedTemplatesService`가 `status: "active"`를 거는 건 그게 운영자 큐레이션(priority ≥ 1)이기 때문이다 — 인기 섹션은 사용자 행동(좋아요) 기반 자동 산출이라 성격이 다르다.

### 2.3.1 인덱스: 추가하지 않음

Product 컬렉션은 현재 `_id` 외 인덱스가 0개이고 dev 데이터가 2건이다(실측 확인). 정렬 키(`likesCount`)가 계산 필드라 **blocking in-memory sort가 불가피**하므로 인덱스는 `$match` 단계만 커버하는데, 이 규모에선 COLLSCAN이 더 빠르다. 또한 `$sort`+`$limit` top-k 병합(위 인접 유지 항목)으로 정렬 버퍼가 상위 N건으로 제한되므로(`usedDisk:false, spills:0` 실측), 인덱스 없는 정렬의 32MB 한도가 실질적으로 도달하지 않는다 — 인덱스로 회피해야 할 문제 자체가 아직 없다. 안 쓰이는 인덱스는 나중 진단을 흐린다(선행 `feat/subcategory-navigation-section/01_db_schema.md` §6과 동일 판단). 굳이 건다면 `{ likes: 1 }` 멀티키가 되는데 원소 수만큼 엔트리가 생기면서 정렬엔 쓰이지도 못해 비용 대비 이득이 없다.

**재검토 트리거 2개**(둘 다 발생 시점에 이 계약을 다시 연다):
1. 상품 수가 늘어 인기 섹션 조회 지연이 실측되면 → 인덱스 또는 `likesCount` 비정규화(§2.4) 재검토.
2. **카탈로그 조회(`getAllProductsService`/`getProductService`)가 `status` 필터를 도입하면 이 쿼리도 같은 커밋에서 따라가야 한다.** 안 따라가면 "품절 상품이 인기 1위" 형태로 드러난다.

### 2.4 대안(기각)

- **전체 조회 후 JS 정렬**(`getAllProductsService()` 결과를 `.sort((a,b) => b.likes.length - a.likes.length).slice(0, 8)`): 상품 전건을 메모리에 올려야 하고, Top 8만 필요한데 O(전체)를 지불한다. `useVisibleProducts.ts:76`이 클라이언트에서 하는 것과 같은 로직을 서버에 중복 이식하는 셈이기도 하다. 기각.
- **`likesCount` 필드를 스키마에 비정규화(denormalize)해서 `find().sort({ likesCount: -1 })`**: 좋아요 토글(`updateProductLikeService`)마다 카운터를 함께 갱신해야 하고 기존 문서 백필 마이그레이션이 필요하다. 현재 데이터 규모에서 aggregation으로 충분하므로 이번 범위 밖. 상품 수가 커져 aggregation 지연이 실측되면 그때 재검토한다(가정만으로 미리 만들지 않는다).

---

## 3. 호출부 계약 — `src/app/(main)/page.tsx`

```ts
const [product, invitation, popularProducts] = await Promise.all([
  previewProductId ? getProductService(previewProductId) : null,
  getFeaturedTemplatesService("invitation").catch(() => [] as Product[]),
  getPopularProductsService(POPULAR_PRODUCTS_LIMIT).catch(() => [] as Product[]),
]);

return (
  <HomeTemplate
    invitation={invitation}
    product={product}
    infoId={infoId}
    popularProducts={popularProducts}
  />
);
```

- **`userId`를 넘기지 않는다.** 이 페이지는 `revalidate = 3600` ISR로 **전 사용자 공유 캐시**다. userId를 넘기면 최초 재생성 요청자의 `isLiked` 값이 모든 방문자에게 캐시된다. 따라서 이 경로의 `isLiked`는 항상 `false`이며, 인기 섹션은 개인화 표현(하트 채움 등)을 쓰지 않는다. 기존 두 호출도 동일하게 userId를 안 넘긴다 — 새 규칙이 아니라 현행 유지다.
- **`.catch(() => [])`로 흡수한다.** 기존 `getFeaturedTemplatesService(...).catch(() => [])`와 같은 패턴. 인기 섹션은 큐레이션(비필수)이므로 DB 장애가 Home 전체를 죽이면 안 된다. 실패 → 빈 배열 → 길이 0 → §4의 렌더 가드에서 섹션이 조용히 사라진다.

---

## 4. 에러/빈 결과 흐름

`docs/ERROR_HANDLING.md` 기준으로 이번 기능이 실제로 만드는 에러 경로는 하나뿐이다.

| 상황 | 서비스 동작 | 호출부(page.tsx) | 최종 UI |
| --- | --- | --- | --- |
| 정상 (좋아요≥1 상품 3개 이상) | `ProductJSON[]` (1~8개) 리턴 | 그대로 props | 섹션 렌더, 최대 8개 |
| 좋아요≥1 상품이 0~2개 | 짧은 배열(0~2개) 그대로 리턴 — throw 안 함 | 그대로 props | **섹션 미렌더**(REQ-2) |
| DB 커넥션/쿼리 실패 | `AppError("INTERNAL", 원문)` throw | `.catch(() => [])` | 섹션 미렌더, Home 나머지 정상 |

- **서비스는 "결과 없음"을 에러로 만들지 않는다.** 빈 배열은 정상 흐름이다(`src/server/services/CLAUDE.md`의 "조회형은 없는 게 정상"). `AppError(NOT_FOUND)`를 던지지 않는다.
- **mongoose 에러는 `AppError("INTERNAL", 원본 message)`로 감싸 다시 throw한다** — 같은 파일의 다른 함수들과 동일(`.catch(err => { throw new AppError("INTERNAL", ...) })`). raw mongoose 에러를 그대로 던지지 않는다.
- **`ErrorPayload`/`toErrorPayload`/`actionError`/`routeError`는 이번 기능에 등장하지 않는다.** 채널 A/B 경계를 넘지 않기 때문이다. 클라이언트로 나가는 에러 응답 자체가 없다.
- **3개 미만 숨김(REQ-2)은 서비스가 아니라 UI 책임이다.** 서비스가 "3개 미만이면 빈 배열로 만들어 리턴"하는 식으로 임계값을 흡수하면, 조회 함수가 표시 정책을 들고 다니게 되어 다른 소비처가 생겼을 때 재사용이 막힌다. 서비스는 찾은 것을 그대로 준다. 게이트를 UI 안 어느 파일에 두는지는 ui-designer-popular 소관이며 `01_ui_flow.md`가 `PopularProductsSection` 내부(`if (products.length < POPULAR_PRODUCTS_MIN_ITEMS) return null`)로 확정했다 — **한 곳에만 둔다**(`HomeTemplate` 쪽에 같은 조건을 중복으로 걸지 않는다). API 계약 관점에선 어느 쪽이든 관측 동작이 동일하다.

**인증 요구사항: 없음.** 공개 조회이며 `requireAuth()`를 호출하지 않는다. UNAUTHENTICATED/FORBIDDEN 경로 없음.

---

## 5. 응답 shape — 신규 스키마 없음

리턴 타입은 기존 `ProductJSON`(= `Product`, `src/server/services/product.service.ts`) 배열 그대로다. `src/shared/schemas/response/product.schema.ts`의 `productResponseSchema`와 1:1 대응하며 **필드를 추가하지 않는다**.

- `rank`를 응답에 싣지 않는다 — 순위는 배열 순서에서 파생되는 표시 개념이지 상품의 속성이 아니다. UI가 `index + 1`로 계산한다(REQ-3의 `rank` prop).
- `likeCount` 같은 파생 카운트 필드도 싣지 않는다 — `likes: string[]`가 이미 나가고 `ProductCard`가 `product.likes?.length`로 렌더 중이다(중복 소스 금지).
- `src/shared/schemas/`에 신규 파일을 만들지 않는다. 이 폴더는 폼/API **입력** 검증과 **Route Handler 응답** 검증용인데, 이번 기능은 route.ts가 없고 입력 파라미터도 서버 내부 호출(`limit: number`)뿐이라 런타임 zod 검증 대상이 아니다.

카멜케이스 확인: `likesCount`(내부 임시), `popularProducts`, `isLiked`, `discountedPrice`, `subCategory` — 전부 camelCase. snake_case 없음.

---

## 6. 신규 상수 — 기존 `src/shared/constants/product.ts`에 추가(파일 신설 아님)

```ts
export const POPULAR_PRODUCTS_LIMIT = 8;
export const POPULAR_PRODUCTS_MIN_ITEMS = 3;
```

- 순수 숫자 리터럴이므로 SCREAMING_SNAKE_CASE(`src/shared/constants/CLAUDE.md` 케이스 규칙 충족).
- 배럴(`src/shared/constants/index.ts`)이 이미 `export * from "./product"`이라 추가 작업 없음. 소비처는 `@/shared/constants`에서 import.
- 서비스 기본값(`limit = POPULAR_PRODUCTS_LIMIT`)과 UI 게이트(`length >= POPULAR_PRODUCTS_MIN_ITEMS`)가 같은 상수를 본다 — `8`/`3`을 컴포넌트나 page.tsx에 리터럴로 박지 않는다.

---

## 7. 즉시 응답 vs 비동기 결과

**전부 즉시.** 서버 렌더 시점에 한 번 조회하고 끝난다.

- 로딩 상태 없음(Suspense 경계·스켈레톤 불필요) — `Promise.all`이 완료된 뒤 HTML이 만들어진다.
- 클라이언트 재검증 없음 — `useSWR` 미사용. 데이터 신선도는 페이지 레벨 `revalidate = 3600`(최대 1시간 지연)이 전부이며, 이는 기존 Home 동작 그대로다. 좋아요를 누른 직후 인기 순위가 즉시 바뀌지 않는 것은 **의도된 동작**이다(별도 무효화 훅을 추가하지 않는다).
- 낙관적 업데이트/폴링/스트리밍 없음.

---

### 7.1 검증 함정 — dev 데이터로는 이 계약이 검증되지 않는다

현재 dev DB의 products는 **2건**이다. REQ-2가 "좋아요 ≥ 1 상품이 3개 미만이면 섹션 숨김"이므로, 두 건 다 좋아요가 있어도 **섹션은 렌더되지 않는다.**

문제는 **조회 로직이 완전히 깨져 있어도 화면 증상이 정확히 같다**는 것이다("섹션이 안 보인다"). 정렬이 반대여도, `$unset`을 빠뜨려도, `.catch(() => [])`가 에러를 삼키고 있어도 육안으로는 구분되지 않는다 — "안 보이니까 정상"으로 오판하기 딱 좋은 구조다.

따라서 **시딩 없이 "확인 완료" 판정을 내리지 않는다.** 필요한 시드 조건(db-migrator-popular의 `01_db_schema.md` §6-3에 지시·확인 쿼리 있음):
- 좋아요 ≥ 1 상품 **4건 이상**(3건 임계값을 넘겼는지와 8건 상한 slice를 동시에 볼 수 있어야 한다)
- 좋아요 수를 서로 **다르게**(정렬 방향이 반대여도 통과하는 상태를 만들지 않는다)
- **동점 케이스 포함**(tie-break 5단이 실제로 동작하는지)
- 좋아요 0건 상품과 soft-deleted 상품도 섞어 둔다(제외 조건 검증용)

이 절은 API 계약의 일부가 아니라 계약을 **검증 가능하게 만드는 전제**다 — 통합 테스트 단계에서 이 조건이 안 갖춰졌으면 REQ-1/REQ-2 판정 자체가 무효다.

---

## 8. 협의 상태 / 미해결 쟁점

**미해결 쟁점: 0건.**

| 동료 | 쟁점 | 결과 |
| --- | --- | --- |
| db-migrator-popular | ① `"likes.0": $exists` 표현 ② `$unset` 필수 ③ status 필터 ④ tie-break `_id` | **4건 전건 합의.** 모델/필드/인덱스 변경 0건. 추가 보강 4건(limit 클램프, `dbConnect`, aggregate 제네릭, base 모델+새 배열 리터럴)을 §2.3에 반영 완료. 인덱스 미생성 판단과 재검토 트리거는 §2.3.1. 이후 실측 결과 3건 추가 반영 — `$expr` 형태의 쿼리 전체 실패(§2.3), `$sort`+`$limit` top-k 병합 및 인접 유지(§2.3·§2.3.1), `_id` tie-break을 "테스트 통과"로 제거 금지(§2.3), dev 시딩 없이는 REQ-2 검증 불가(§7.1). |
| ui-designer-popular | 가정 A(엔드포인트 없음)/B(`Product[]`, rank 미포함)/C(시그니처·게이트 위치) | **3건 전건 확정.** 추가로 상수 2개(§6)와 `isLiked` 항상 false(§3) 전달 → `01_ui_flow.md` 반영 완료. 3개 미만 가드는 `PopularProductsSection` 내부로 확정(§4, API 계약 무영향). prop명 `popularProducts: Product[]`로 통일. |

이 계약은 1라운드에서 합의됐다(3라운드 상한 미도달).
