# 01_db_schema.md — feat/product-search DB 설계

> 작성: db-migrator (Phase1 설계 팬아웃)
> **상태: 확정 (리더 리뷰 통과, 2026-07-31)** — 미해결 쟁점 0건, §8 참고. backend-impl 착수 가능.
> 근거 파일: `src/server/models/product.model.ts`, `src/server/services/product.service.ts`, `src/shared/utils/category.ts`, `src/server/models/CLAUDE.md`, `src/server/services/CLAUDE.md`, `TODO.md` L38/L45

---

## 0. 결론 요약

| 항목 | 판단 |
|---|---|
| 신규 모델 | **불필요** |
| `Product` 스키마 신규 필드 | **불필요 (0개)** |
| 신규 인덱스 | **지금은 추가하지 않는다** (근거 §3, 재검토 트리거 명시) |
| backfill 스크립트 | **불필요** — 스키마 변경이 없으므로 기존 문서를 손댈 이유가 없다 |
| `category`/`subCategory` 저장값 | **enum key** (라벨 아님) — api-designer의 "라벨→enum key 역조회" 전제는 스키마와 정합 ✅ |
| 이번 기능의 DB 작업 | 읽기 전용 조회 1건 추가. 쓰기 경로 변경 없음 |

이번 기능은 순수 조회다. `ProductModel.find()` 하나가 전부이며, 모델 파일(`product.model.ts`)은 **한 줄도 수정하지 않는다.**

---

## 1. 스키마 변경 필요 여부 — 불필요

검색이 참조하는 필드는 전부 이미 `productSchema`에 `required: true`로 존재한다.

| 검색이 읽는 필드 | 현재 스키마 정의 | 추가 작업 |
|---|---|---|
| `title` | `{ type: String, required: true }` | 없음 |
| `category` | `{ type: String, enum: ["invitation"], required: true }` (+ `discriminatorKey`) | 없음 |
| `subCategory` | `{ type: String, required: true }` + 커스텀 validator | 없음 |
| `deletedAt` | `{ type: Date, default: null }` — 모든 문서에 항상 존재(nullable, optional 아님) | 없음 |
| 정렬 키 `isFeatured`/`priority`/`createdAt` | 각각 `default: false` / `default: 0` / `timestamps: true` | 없음 |

`deletedAt`이 `default: null`이라 **기존 문서에 누락이 없다** — `{ deletedAt: null }` 필터가 레거시 문서를 조용히 누락시킬 위험이 없고, 따라서 backfill이 필요 없다. (필드가 아예 없는 문서가 섞여 있었다면 `{ deletedAt: null }`은 MongoDB에서 missing도 매칭하므로 그래도 안전하지만, 애초에 그 케이스가 없다.)

### 검토했으나 도입하지 않는 필드: `titleChosung` (초성 검색용)

기각이 아니라 **유보**다. 근거를 남긴다.

- 이 프로젝트엔 이미 초성 검색이 있다 — `src/client/hooks/useVisibleProducts.ts`가 `getChosung()`(`src/shared/utils/hangul.ts`)으로 `item.title`을 초성 변환해 클라이언트에서 매칭한다.
- MongoDB `$regex`는 초성 매칭을 **원리적으로 못 한다**("ㄷㅈㅊ"와 "돌잔치"는 유니코드 코드포인트가 전혀 다르다). 서버 검색에서 초성을 지원하려면 `titleChosung` 같은 비정규화 필드를 저장하고 `pre('save')`로 동기화하는 수밖에 없다.
- 지금 안 하는 이유: (a) REQ-1~4 어디에도 초성 요구가 없다, (b) 비정규화 필드는 `title` 수정 경로 전부와 동기화 의무가 생기는데 `product.model.ts` 훅에 도메인 로직을 두는 건 `src/server/models/CLAUDE.md`가 금지하고 update 경로(`findOneAndUpdate`)에선 `pre('save')`가 아예 발화하지 않아 조용히 어긋난다, (c) 기존 문서 전체 backfill이 필요해진다 — 요구사항 없는 기능에 마이그레이션 부채를 먼저 만드는 셈.
- **재검토 트리거**: `/search`에서 초성 입력 요구가 실제로 들어오는 시점. 그때는 이 필드가 아니라 Atlas Search(§3 참고)가 더 나은 답일 수 있으므로 둘을 같이 비교한다.

> ⚠️ **경계면 이슈 — 리더 판정 완료(2026-07-31): 이번 스코프에서 안 맞춘다. `04_integration_report.md`에 known limitation으로 기록 + boundary-verifier에 공유, 리더가 직접 관리한다.** 이 프로젝트에 이제 검색 의미론이 **두 개** 생긴다.
> - 기존 카탈로그 필터(`useVisibleProducts`): 클라이언트, **대소문자 구분함**(`item.title.includes(keyword)`, `toLowerCase` 없음), **초성 지원함**
> - 신규 `/search`: 서버, **대소문자 무시**(`$options:"i"`), **초성 미지원**
>
> 같은 앱에서 같은 상품을 두 입구로 검색했을 때 결과가 달라진다. 이번 PR 범위에서 통일하자는 게 아니라(스코프 확대), **알려진 불일치로 기록**해두자는 것이다.

---

## 2. `category` / `subCategory` 저장값 검증 (api-designer 전제 확인)

### 결론: DB엔 **enum key**가 저장된다. 한글 라벨은 DB에 들어가지 않는다. ✅

근거:

- `product.model.ts` L85-89 — `category: { type: String, enum: ["invitation"] }`. 허용값이 영문 key `"invitation"` 하나로 스키마에 고정돼 있다. 한글 `"초대장"`을 저장하려 하면 mongoose ValidationError로 거부된다.
- `product.model.ts` L141 — `discriminatorKey: "category"`, L159 — `ProductModel.discriminator("invitation", ...)`. **discriminator 이름이 곧 `category` 필드에 저장되는 값**이다(모델 CLAUDE.md 명시). 즉 `category`는 mongoose 내부 판별키로도 쓰여서 값이 `"invitation"`으로 고정될 수밖에 없다.
- `product.model.ts` L90-112 — `subCategory` validator가 `SUB_CATEGORY_MAP[category]`에 `value`가 포함되는지 검사한다. `SUB_CATEGORY_MAP.invitation = ["wedding", "first-birthday", "vip", "business"]`(`category.ts` L4-6)이므로 **저장 가능한 값은 이 영문 key 4개뿐**이다.
- 한글 라벨은 `category.ts`의 `productCategoryLabels`(`invitation → "초대장"`), `subCategoryLabels`(`wedding → "청첩장"`, `first-birthday → "돌잔치"`, `vip → "VIP"`, `business → "비즈니스"`)에만 존재하는 **표시 전용 매핑**이다.

| 사용자가 입력할 법한 값 | DB 저장값 | 직접 매칭 되는가 |
|---|---|---|
| `"초대장"` | `"invitation"` | ❌ 역조회 필요 |
| `"청첩장"` | `"wedding"` | ❌ 역조회 필요 |
| `"돌잔치"` / `"돌잔"` | `"first-birthday"` | ❌ 역조회 필요 |
| `"wedding"` | `"wedding"` | ✅ 그대로 매칭 |

→ **api-designer의 "라벨→enum key 역조회 후 값으로 매칭" 설계는 스키마와 정합하다. 그대로 진행 가능.**

### 단, 역조회를 "정확일치"로 구현하면 요구사항의 핵심 예시가 깨진다 (⚠️ 필수 반영)

REQ-1과 `TODO.md` L38이 `$text`를 배제한 이유가 **"돌잔" 검색 시 "돌잔치" 부분매칭이 안 돼서**다. 그런데 라벨 역조회를 `label === q`로 짜면 `"돌잔"`은 `subCategoryLabels["first-birthday"] === "돌잔치"`와 불일치 → 매칭 0건. **배제한 문제가 그대로 재현된다.**

→ 역조회도 **라벨 부분일치**로 한다. 매칭 결과가 복수일 수 있으므로 배열로 모아 `$in`으로 넣는다(`TODO.md`가 `$in`이라고 쓴 것도 이 전제로 읽힌다).

```ts
// 라벨 부분일치 역조회 — 결과는 항상 배열
const matchSubCategoryKeysByLabel = (keyword: string): SubCategory[] =>
  (Object.entries(subCategoryLabels) as [SubCategory, string][])
    .filter(([, label]) => label.toLowerCase().includes(keyword.toLowerCase()))
    .map(([key]) => key);
```

`toLowerCase()`를 넣는 이유: `subCategoryLabels.vip === "VIP"`라 `"vip"` 입력을 대소문자 무시로 받아야 `title`의 `$options:"i"`와 의미론이 일치한다.

---

## 3. 인덱스 설계 — 지금은 추가하지 않는다

### 3-1. 현재 상태

`Product` 컬렉션에는 **`_id` 외 인덱스가 하나도 없다.** (`grep` 확인: `order.model.ts`의 `merchantUid`/`coupleInfoId`/`userId`, `user.model.ts`의 `email`, `payment.model.ts`의 `merchantUid`/`impUid`, `guestbook.model.ts`, `feature.model.ts`의 `code`에는 인덱스가 있으나 `product.model.ts`에는 없다.)

즉 `getAllProductsService`/`getFeaturedTemplatesService` 등 기존 상품 조회 전부가 이미 컬렉션 스캔으로 돌고 있고, 문제된 적이 없다. 검색만 특별 취급할 이유가 없다.

### 3-2. regex 쿼리가 인덱스를 못 타는 이유

`{ title: { $regex: "돌잔", $options: "i" } }`는 `{ title: 1 }` 인덱스를 만들어도 **의미 있는 성능 이득이 없다.** 두 가지 이유가 겹친다.

1. **앵커가 없다.** MongoDB가 정규식으로 인덱스 **범위(bounds)** 를 좁힐 수 있는 건 패턴이 좌측 앵커(`/^prefix/`)일 때뿐이다. B-tree는 "문자열이 무엇으로 시작하는가"로만 정렬돼 있어서, `"돌잔"`이 문자열 **중간**에 나오는 문서는 인덱스상 어디에 있을지 알 수 없다 → 인덱스 전체를 처음부터 끝까지 훑어야 한다(bounds `["", {})`, 사실상 full index scan).
2. **`$options: "i"`가 남은 여지마저 없앤다.** 설령 `/^돌잔/`처럼 앵커를 붙여도, 대소문자 무시는 인덱스의 정렬 순서(대소문자 구분 바이너리 정렬)와 맞지 않아 prefix bounds를 쓸 수 없다. (인덱스에 case-insensitive collation을 주고 쿼리도 같은 collation으로 치면 예외지만, 그건 앵커 케이스에만 해당하고 우리는 1번 때문에 애초에 앵커가 없다.)

결과적으로 `{ title: 1 }` 인덱스가 있어도 실행 계획은 "인덱스 전건 스캔 → 매칭 문서마다 원본 fetch"가 된다. 반환값이 문서 전체(`transformProduct`가 전 필드를 쓴다)라 커버드 쿼리도 불가능하고, fetch 왕복이 붙는 만큼 **컬렉션 스캔보다 오히려 느려질 수 있다.**

`$text` 인덱스는 요구사항 단계에서 이미 배제됐고(한국어 형태소 분석 미지원 → `"돌잔"`이 `"돌잔치"`를 못 잡음), 그 판단은 타당하다. `$text`는 토큰 **완전일치** 기반이라 부분일치 요구와 근본적으로 안 맞는다.

### 3-3. 그럼에도 지금 인덱스를 안 만드는 게 맞는 근거

`category`/`subCategory` 매칭(`$in`)은 regex와 달리 인덱스를 **탈 수 있다.** 그래서 "`{ deletedAt: 1, subCategory: 1 }` 정도는 만들어둘까"가 실제 선택지로 남는다. 그럼에도 만들지 않는다:

1. **`$or` 안에 regex 브랜치가 있으면 인덱스 이득이 사라진다.** MongoDB의 `$or`는 브랜치별로 계획을 세워 결과를 합친다. 브랜치 하나라도 인덱스를 못 쓰면(= `title` regex 브랜치) 그 브랜치가 컬렉션 스캔을 하고, 옵티마이저는 어차피 전건을 읽을 바에야 **`$or` 전체를 단일 컬렉션 스캔으로 처리**하는 쪽을 고른다. 즉 `subCategory` 인덱스를 만들어도 이번 쿼리에선 안 쓰인다.
2. **데이터 규모가 인덱스 무의미 구간이다.** `TODO.md` L45: "지금 tie-knot은 카테고리 1종뿐", L15: "현재 `invitation` 외 실 데이터 없음". 문서 수백 건 규모에서 컬렉션 스캔은 밀리초 이하다.
3. **이미 전건을 클라이언트로 내리고 있다.** `useVisibleProducts.ts`는 상품 목록 **전체**를 받아 브라우저 메모리에서 필터링한다. 전체 페이로드를 네트워크로 통째로 보내는 게 성립하는 규모에서 서버 인덱스를 논하는 건 순서가 뒤바뀐 것이다.
4. **인덱스는 공짜가 아니다.** 쓰기 증폭 + "검색 인덱스가 있다"는 착각을 만든다. 실제로는 안 쓰이는 인덱스가 남으면, 나중에 진짜 느려졌을 때 "인덱스 있는데 왜 느리지"로 진단이 한 번 꼬인다.
5. **프로젝트 원칙과 일치.** `TODO.md` L32가 동일 논리로 "별도 Category 컬렉션 동적화" 기각("지금 카테고리 추가 빈도에 비해 오버스펙"), `models/CLAUDE.md`도 "하위 타입 전용 필드가 아직 없는 카테고리는 discriminator를 미리 만들지 않는다(과설계 방지)"를 명시한다.

### 3-4. 재검토 트리거 (지금 정해두는 조건)

아래 중 하나라도 해당하면 이 판단을 다시 연다. 그전엔 열지 않는다.

- `Product` 문서 수가 **수천 건** 규모에 진입 (카테고리 확장이 실제로 일어난 뒤)
- `/search` 응답 p95가 **200ms** 초과 — 추측이 아니라 `.explain("executionStats")`의 `totalDocsExamined`/`executionTimeMillis`로 측정해서 판단
- 정렬(`{ isFeatured: -1, priority: -1, createdAt: -1 }`)이 인메모리 정렬 32MB 한도에 걸림 (인덱스 없는 정렬의 MongoDB 제약. 현재 규모에선 도달 불가)

그 시점의 해법은 `{ title: 1 }` B-tree가 아니다 — §3-2에서 본 대로 부분일치엔 원리적으로 안 맞는다. **Atlas Search**(한국어 nori/CJK analyzer 지원, `$text`의 형태소 한계를 실제로 해결)를 1순위로 검토한다. 이번에 `$text`를 배제한 판단은 Atlas Search까지 배제하는 게 아니다.

---

## 4. 몽구스 쿼리 draft (api-designer/backend-impl 참고용)

`getAllProductsService`(L123-139) 패턴을 그대로 따른다 — `dbConnect()` → base `ProductModel.find()` → `.sort()` → `.lean()` → `transformProduct` 매핑.

```ts
// src/server/services/product.service.ts

export const searchProductsService = async (
  keyword: string | undefined,
  userId?: string,
): Promise<ProductJSON[]> => {
  await dbConnect();

  const q = keyword?.trim();
  const branches: mongoose.FilterQuery<IProduct>[] = [];

  if (q) {
    // (a) title 부분일치 — 반드시 이스케이프한 값을 넣는다(§5-2)
    branches.push({ title: { $regex: escapeRegExp(q), $options: "i" } });

    // (b) 라벨 부분일치 역조회 → enum key 배열 → $in (§2)
    const categoryKeys = matchCategoryKeysByLabel(q);
    if (categoryKeys.length > 0) {
      branches.push({ category: { $in: categoryKeys } });
    }

    const subCategoryKeys = matchSubCategoryKeysByLabel(q);
    if (subCategoryKeys.length > 0) {
      branches.push({ subCategory: { $in: subCategoryKeys } });
    }
  }

  // $or: [] 는 MongoDB가 거부한다(§5-1) — DB를 치기 전에 빠져나간다.
  if (branches.length === 0) return [];

  const query: mongoose.FilterQuery<IProduct> = {
    deletedAt: null, // top-level AND — 브랜치 안에 넣지 않는다(§5-3)
    $or: branches,
  };

  const products = await ProductModel.find(query)
    .sort({ isFeatured: -1, priority: -1, createdAt: -1 })
    .lean();

  return products.map((p) => transformProduct(p, userId));
};
```

실제로 나가는 쿼리 객체 (`q = "돌잔"` 입력 시):

```js
{
  deletedAt: null,
  $or: [
    { title: { $regex: "돌잔", $options: "i" } },
    { subCategory: { $in: ["first-birthday"] } }   // 라벨 "돌잔치" 부분일치로 역조회됨
  ]
}
```

`q = "초대"` 입력 시:

```js
{
  deletedAt: null,
  $or: [
    { title: { $regex: "초대", $options: "i" } },
    { category: { $in: ["invitation"] } }          // 라벨 "초대장" 부분일치
  ]
}
```

### 4-1. `$and` 래핑 — 해당 없음 (리더 확정, 2026-07-31)

초안 단계에서 REQ-1의 URL(`?q=&category=&subCategory=`)을 보고 "`category` 파라미터를 검색어와 AND로 걸 경우 top-level `$or` 키가 하나뿐이라 `$and` 래핑이 필요하다"는 우려를 제기했으나, **리더가 `00_requirements.json`의 URL 표기가 모호했던 것이라고 정정했다.**

확정된 구조: **`category`/`subCategory`는 별도 필터 파라미터가 아니다.** 단일 검색어 `q` 하나가

- `title`에 regex 부분일치하거나, **또는**
- `category`/`subCategory` **라벨**에 부분일치(역조회 후 `$in`)하거나

를 `$or` **하나로** 결합하는 구조다. `?category=` 쿼리파라미터 자체가 존재하지 않는다.

→ **`$and` 래핑 문제는 발생하지 않는다.** §4의 draft(`searchProductsService(keyword, userId)`)가 이미 이 구조 그대로이므로 수정 불필요하다. 이 절은 판단 이력 보존용으로만 남긴다.

(참고로 `$or` 키를 같은 객체에 두 번 쓰면 뒤엣것이 앞엣것을 덮어써 조건이 조용히 사라진다는 사실 자체는 유효하다 — 향후 파라미터 필터가 실제로 추가되는 시점에 다시 꺼내볼 것.)

### 4-2. 모델 선택: base `ProductModel`을 쓴다

`InvitationProductModel`로 조회하면 안 된다. `category`가 `discriminatorKey`라 mongoose가 discriminator 모델 쿼리에 `category: "invitation"`을 **자동 주입**한다 — 지금은 카테고리가 하나라 티가 안 나지만 카테고리가 늘어나는 순간 검색이 조용히 invitation만 반환한다. 읽기는 base 모델로 해도 mongoose가 `discriminatorKey` 값을 보고 올바른 서브타입으로 hydrate한다(`models/CLAUDE.md` Gotchas). 기존 `getAllProductsService`도 base를 쓴다.

### 4-3. `status` 필터 — 넣지 않는다 ✅ 확정 (리더 채택, 2026-07-31)

`getAllProductsService`는 `status`를 **거르지 않고** `deletedAt: null`만 본다. `status: "active"`를 거는 건 `getFeaturedTemplatesService`뿐이다. REQ-1이 "`getAllProductsService`와 동일하게"라고 명시했고, 검색 결과가 기존 `ProductCatalog` 그리드로 렌더되므로 **같은 그리드에 같은 모수**가 나오는 게 맞다.

→ **`status` 필터 없음.** 리더가 이 안을 채택했다("getAllProductsService와 동일 모수 유지"). §4의 draft가 이미 이 형태다.

---

## 5. DB 관점에서 확정된 함정 3건 (구현 시 필수 반영)

### 5-1. `$or: []` 는 런타임 에러다

MongoDB는 빈 `$or`/`$and`/`$nor` 배열을 거부한다 — `"$and/$or/$nor must be a nonempty array"`. REQ-1 수용조건은 "조건 없으면 **빈 배열(에러 아님)** 반환"인데, `q`가 비었거나 라벨 역조회 결과가 전부 비면 정확히 이 상태가 만들어진다. **브랜치 배열 길이가 0이면 DB를 치기 전에 `return []`.** (`§4`의 draft에 반영돼 있다.)

### 5-2. 사용자 입력을 `$regex`에 그대로 넣으면 500이 난다

검색창은 임의 문자가 들어오는 입구다. `(`, `[`, `*`, `+`, `?`, `\` 같은 정규식 메타문자가 오면 패턴 컴파일이 실패해 `"Regular expression is invalid"`로 요청이 터진다 — 사용자 입력 오류가 서버 예외로 올라가는 형태라 `services/CLAUDE.md`의 에러 분류(사용자 입력 오류 vs 서버 예외)와도 어긋난다. **메타문자를 이스케이프한 뒤 넣는다.** 이스케이프하면 사용자가 백트래킹 폭발 패턴(ReDoS)을 주입할 여지도 함께 사라진다.

이스케이프 헬퍼는 side-effect 없는 순수 함수이므로 `src/shared/utils/` 소관이다(`shared/utils/CLAUDE.md`). 파일명/함수명에 도메인(product/search)을 드러내지 않는다 — 같은 규칙이 `src/CLAUDE.md`에도 있다. 배럴(`index.ts`) 경유 import 필수.

### 5-3. `deletedAt: null`은 top-level에 둔다

`{ deletedAt: null, $or: [...] }` 형태여야 AND로 걸린다. `$or` 브랜치마다 `deletedAt: null`을 복사해 넣는 방식은 중복이기도 하고, 나중에 브랜치를 하나 추가하면서 빠뜨리면 **소프트 삭제된 상품이 검색 결과로 샌다.** 조건을 한 군데만 두는 형태로 고정한다.

---

## 6. API 응답 필드명 ↔ DB 필드 매핑표

검색은 **기존 `ProductJSON` 계약을 그대로 재사용한다.** REQ-3이 결과를 기존 `ProductCatalog` 그리드로 렌더한다고 못박았고, 그 그리드는 `ProductJSON`을 먹는다. → **신규 응답 필드 0개, 필드명 불일치 0건.** api-designer가 검색 전용 응답 shape을 새로 만들 이유가 없다(만들면 그리드 재사용이 깨진다).

`transformProduct`(`product.service.ts` L28-44)가 이미 하는 변환:

| API 응답 필드 (`ProductJSON`) | DB 필드 (`ProductDB`) | 변환 |
|---|---|---|
| `_id: string` | `_id: ObjectId` | `.toString()` |
| `title` | `title` | 그대로 |
| `category` | `category` | 그대로 (**enum key**, 라벨 아님) |
| `subCategory` | `subCategory` | 그대로 (**enum key**, 라벨 아님) |
| `likes: string[]` | `likes: ObjectId[]` | 각 원소 `.toString()` |
| `featureIds: string[]` | `featureIds?: ObjectId[]` | `.toString()`, undefined면 `[]` |
| `isLiked: boolean` | — | **파생** (`likes`에 `userId` 포함 여부) |
| `discountedPrice: number` | — | **파생** (`calculatePrice(price, discount)`) |
| `previewUrl?` / `theme?` | invitation discriminator 전용 | 그대로 (base 조회여도 hydrate됨) |
| `createdAt`/`updatedAt: string` | `Date` (`timestamps: true`) | `.toISOString()` |
| `deletedAt: string \| null` | `Date \| null` | `.toISOString()` 또는 `null` |

필드 케이스는 전부 camelCase다 — snake_case 도입 없음.

**응답이 enum key를 그대로 내보낸다는 점을 UI 쪽이 알아야 한다**(api-designer 경유 전달). 화면에 한글을 띄우려면 `subCategoryLabels[product.subCategory]`로 변환해야 한다. 기존 `ProductCard`가 이미 서브카테고리 라벨을 노출 중이므로(`TODO.md` L43) 그쪽 구현을 그대로 따르면 된다.

---

## 7. 마이그레이션 / backfill

**없음.** 스키마 필드 추가·타입 변경·인덱스 생성이 전부 없으므로 기존 `Product` 문서를 손댈 이유가 없다. MongoDB는 스키마리스라 조회 조건만 바뀌는 이번 기능은 DB 상태를 전혀 건드리지 않는다.

참고로 `TODO.md` L40이 예고한 **VIP/비즈니스 서브카테고리 제거는 마이그레이션이 필요한 작업**이지만 그건 Phase 3(`feat/subcategory-navigation-section`) 소관이고 이번 브랜치 범위 밖이다. 다만 연결점 하나: 이번 검색이 `subCategoryLabels`를 역조회 소스로 쓰므로, Phase 3에서 그 map에서 값이 제거되면 **검색 대상도 자동으로 같이 좁혀진다**(별도 수정 불필요, 의도된 동작). 대신 그 시점에 dev DB에 `subCategory: "vip"|"business"` 문서가 남아 있으면 검색으로는 라벨 역조회가 안 되고 `title` 매칭으로만 잡히게 된다 — Phase 3 착수 시 확인 항목에 이 줄을 추가해두면 좋다.

---

## 8. 쟁점 — 전건 해결됨 ✅ (리더 판정, 2026-07-31)

미해결 쟁점 없음. 초안 단계에서 올렸던 3건은 리더 검토에서 모두 결론이 났다.

| # | 쟁점 | 판정 | 결정 주체 |
|---|---|---|---|
| 1 | `status` 필터 포함 여부 | ✅ **미포함으로 확정** — db-migrator 안 채택. `getAllProductsService`와 동일 모수 유지 (§4-3) | 리더 |
| 2 | `category`/`subCategory` 쿼리파라미터가 검색어와 AND인지 OR 합류인지 | ✅ **해당 없음** — `?category=` 파라미터 자체가 존재하지 않는다. 단일 `q`가 title(regex) 또는 라벨(역조회 후 `$in`)에 매치되는 구조를 `$or` **하나**로 결합. `$and` 래핑 문제 미발생 (§4-1) | 리더 (`00_requirements.json` URL 표기 모호가 원인, `TODO.md` 원 의도 기준으로 정정) |
| 3 | 기존 카탈로그 필터(초성 O·대소문자 구분)와 신규 `/search`(초성 X·대소문자 무시)의 의미론 불일치 | ✅ **이번 스코프에서 안 맞춘다** — `04_integration_report.md`에 **known limitation**으로 기록 + boundary-verifier에 공유. 리더가 직접 관리 | 리더 |

리더가 인덱스 미추가 판단, 함정 3건(§5), 재검토 트리거(§3-4)에 전부 동의했다. **이 문서의 DB 설계는 확정 상태이며 backend-impl이 그대로 구현에 착수할 수 있다.**

> 3번 관련: 이 문서 §1의 `titleChosung` 유보 판단은 그대로 유효하다 — 초성 지원은 스키마 필드 추가 없이는 불가능하고, 그 필드는 이번 요구사항에 없다. 유보 근거와 재검토 트리거는 §1에 남아 있다.
