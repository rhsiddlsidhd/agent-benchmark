# 01 — UI 플로우 설계: 상품 검색

> branch: `feat/product-search`
> 작성: ui-designer / Phase1
> 입력: `_workspace/feat/product-search/00_requirements.json`
> 커버 요구사항: REQ-2(Header 아이콘), REQ-3(/search 페이지), REQ-4(0건 메시지). REQ-1은 api-designer 소관이며 본 문서는 그 계약의 **소비자** 관점만 기술한다.

---

## 0. 요약 — 이번 설계의 핵심 결정 5개

| # | 결정 | 근거 |
|---|---|---|
| D1 | `/search`는 `src/app/(main)/search/`에 둔다 (신규 라우트 그룹 안 만듦) | 공유 layout/독립 error 근거 없음 → 그룹 생성 금지 규칙(`src/app/CLAUDE.md`) |
| D2 | 결과 그리드는 **`organisms/ProductCatalog`이 아니라 `organisms/ProductGrid`** 를 재사용 | `ProductCatalog`은 `category: ProductCategory` 필수 + 필터 UI 동반. 검색 결과는 단일 category로 특정 불가 |
| D3 | 검색 트리거는 **300ms 디바운스 자동 검색** (매 keystroke 아님, 제출식도 아님) | REQ-3 "입력 시 렌더" 문구 충족 + 인덱스 없는 regex 스캔 호출량 억제 |
| D4 | 0건 UI는 `ProductGrid` 내장 빈 상태를 쓰지 않고 라우트 로컬 `SearchEmptyState`를 신규로 만든다 | `ProductGrid` 내장 문구가 "상품을 준비 중에 있습니다"라 REQ-4 문구와 다름. 공유 organism 수정 시 `/products/[category]` 회귀 위험 |
| D5 | Template 티어를 추출하지 않는다 | 자식이 self-fetching(useSWR)이라 template 순수성 성립 불가 → `templates/CLAUDE.md` opt-out 조항 적용 |

---

## 1. 화면 플로우

```
[임의의 (main) 페이지]
        │
        │ Header 우측 검색 아이콘 클릭
        │ <Link href={routes.search}>  ← 상태전환/모달 없음, 순수 페이지 이동
        ▼
   URL: /search                (파일: src/app/(main)/search/page.tsx)
        │
        ├─ 진입 즉시 input autoFocus
        │
        ├─ [IDLE]      입력 없음 → "검색어를 입력해주세요" 안내
        │      │ 타이핑
        │      ▼ (trim 후 비어있지 않음 + 300ms 정지)
        ├─ [LOADING]   Spinner
        │      │
        │      ├─ 성공 & 1건 이상 → [SUCCESS]  ProductGrid 렌더
        │      ├─ 성공 & 0건      → [EMPTY]    "검색결과가 없습니다"
        │      └─ fetcher throw   → [ERROR]    Alert(type="error") + ErrorPayload.message
        │
        └─ [SUCCESS] 카드 클릭
                 │ <Link href={routes.products.detail(category, _id)}>
                 ▼
           URL: /products/invitation/{id}   (기존 라우트, 변경 없음)
```

### 진입점 / 종료점

| 구분 | 내용 |
|---|---|
| 진입점 | `(main)/layout.tsx` → `Header` 검색 아이콘 (모든 `(main)` 하위 페이지에서 도달) |
| 종료점 A | 검색 결과 카드 클릭 → `/products/{category}/{id}` |
| 종료점 B | 브라우저 뒤로가기 (검색어는 보존되지 않음 — §8 미확정 쟁점 U3 참고) |
| 접근 제어 | **공개 페이지.** `src/proxy.ts` matcher에 `/search` 추가하지 **않는다**. 비로그인 사용자도 검색 가능 |

### 실제 도달 URL (boundary-verifier 대조용)

| 파일 경로 | 도달 URL | 비고 |
|---|---|---|
| `src/app/(main)/search/page.tsx` | `/search` | `(main)`은 라우트 그룹이라 URL에서 제거됨 |
| `src/shared/constants/routes.ts` → `routes.search` | `"/search"` | 위 URL과 문자열 일치해야 함 |
| `src/app/(main)/_components/Header.tsx` → `<Link href={routes.search}>` | `/search` | 하드코딩 금지, 반드시 `routes.search` 참조 |
| `src/app/api/products/search/route.ts` (api-designer 소관) | `/api/products/search` | 훅의 SWR key 문자열과 일치해야 함 |

---

## 2. 파일 트리 / 컴포넌트 트리

### 2-1. 신규·수정 파일 목록

```
수정  src/shared/constants/routes.ts                       # search 경로 추가
수정  src/app/(main)/_components/Header.tsx                 # 검색 아이콘 추가
수정  src/app/(main)/_components/Header.test.tsx            # 아이콘/링크 assertion 추가

신규  src/app/(main)/search/
      ├── page.tsx                                          # 조립만 (배치 코드 0줄)
      ├── _components/
      │   ├── index.tsx                                     # 배럴 (page.tsx 소비분만)
      │   ├── ProductSearch.tsx                             # 컨테이너 — 라우트당 1개
      │   ├── SearchBar.tsx                                 # 순수 — 입력 UI
      │   └── SearchEmptyState.tsx                          # 순수 — 0건 메시지
      └── _hooks/
          ├── index.ts                                      # 배럴
          ├── useProductSearch.ts                           # useSWR + fetcher
          └── useDebouncedValue.ts                          # 범용 디바운스

재사용(무수정)
      src/client/components/organisms/ProductGrid.tsx
      src/client/components/organisms/ProductCard.tsx
      src/client/components/molecules/Spinner.tsx
      src/client/components/molecules/Alert.tsx
      src/client/components/atoms/{input,button,typography}.tsx
      src/client/context/productFilter (initialFilterState 값만)
      src/client/fetcher.ts
```

**공유 컴포넌트는 단 한 줄도 수정하지 않는다.** 이번 기능으로 `organisms/` 아래 파일이 바뀌면 `/products/[category]` 회귀 위험이 생기므로, 차이가 필요한 부분은 전부 라우트 로컬로 흡수했다.

### 2-2. 컴포넌트 트리

```
app/(main)/layout.tsx                       [기존]
├── AnnouncementBar                         [기존 molecule]
├── Header                                  [수정] ← 검색 아이콘 추가
│   ├── MobileNav                           [기존, 무변경]
│   ├── Link(로고)                          [기존]
│   ├── nav(MAIN_NAV_ITEMS)                 [기존]
│   └── div.flex
│       ├── Button asChild > Link > Search  [신규 3줄]  ★ REQ-2
│       └── AuthButtons                     [기존]
└── {children}
    └── app/(main)/search/page.tsx          [신규] — <ProductSearch /> 단독 렌더
        └── _components/ProductSearch.tsx   [신규 컨테이너, "use client"]
            │  useState(input) + useDebouncedValue + useProductSearch
            ├── TypographyH1 / TypographyMuted        [기존 atom]
            ├── _components/SearchBar.tsx             [신규, 순수]
            │   ├── atoms/input.tsx                   [기존]
            │   └── lucide-react Search 아이콘
            └── (상태 분기)
                ├── IDLE    → TypographyMuted         [기존 atom]
                ├── LOADING → molecules/Spinner       [기존]
                ├── ERROR   → molecules/Alert         [기존]
                ├── EMPTY   → _components/SearchEmptyState  [신규, 순수]  ★ REQ-4
                └── SUCCESS → organisms/ProductGrid   [기존, 무수정]  ★ REQ-3
                                └── organisms/ProductCard  [기존]
                                    └── molecules/CloudImage, atoms/badge …
```

### 2-3. 신규 컴포넌트 3개의 존재 근거 (과잉 생성 방지 체크)

| 컴포넌트 | 기존으로 커버 안 되는 이유 | 티어(축A) / 위치(축B) |
|---|---|---|
| `ProductSearch` | 라우트 컨테이너 — 도메인 로직(SWR 호출·디바운스·상태 분기) 보유. 순수 티어에 둘 수 없음(핵심 원칙 1) | 컨테이너 / 라우트 로컬(소비 라우트 1곳) |
| `SearchBar` | `ProductFilters`는 `category`·`premiumFeatures`·`ProductFilterState`·`dispatch`를 전부 요구하고 정렬/가격/프리미엄 드롭다운을 동반한다. 검색창 하나만 필요한 화면엔 과대. `Command`/`CommandInput`(cmdk)은 **로컬 리스트 필터링 + 자동완성**용이라 서버 검색엔 부적합 | molecule 성격(단일 책임: 검색어 입력) / 라우트 로컬(소비 라우트 1곳) |
| `SearchEmptyState` | `ProductGrid` 내장 빈 상태 문구가 "상품을 준비 중에 있습니다"로 고정. REQ-4 문구("검색결과가 없습니다")와 다르고, 의미도 다름(재고 준비중 vs 검색 미스) | molecule 성격 / 라우트 로컬 |

> 세 컴포넌트 모두 소비 라우트가 `/search` **1곳뿐**이므로 `src/client/components/`로 승격하지 않는다(`src/client/components/CLAUDE.md` 축 B 승격 규칙). 두 번째 소비처가 생기면 그때 승격한다.

### 2-4. Template을 추출하지 않는 근거

`src/app/CLAUDE.md`는 "organism을 배치하는 코드가 하나라도 있으면 Template 추출 필수"라고 하지만, `src/client/components/templates/CLAUDE.md`에 opt-out 조항이 있다:

> 조합 대상 organism/molecule 중 단 하나라도 내부에서 자체 데이터 페칭(예: `useSWR`)을 한다면 … 순수성이 깨져 애초에 template으로 만들 수 없다 — 이런 경우 도입을 강제하지 않고 라우트 로컬 구성(`_components/`)을 그대로 유지한다.

`ProductSearch`가 `useSWR`로 self-fetching하므로 이 조항에 해당 → Template 파일을 만들지 않고 `_components/ProductSearch.tsx`가 배치까지 담당한다. 대신 `page.tsx`는 배치 코드를 0줄로 유지해서 "organism 1개를 배치 코드 없이 렌더" 예외에도 동시에 부합시킨다.

---

## 3. REQ-2 — Header 검색 아이콘

### 배치 위치

현재 `Header.tsx`는 `justify-between` 4클러스터 구조다:
`[MobileNav(md:hidden)] [로고] [nav(hidden md:flex)] [AuthButtons]`

검색 아이콘은 **맨 오른쪽 클러스터 안, `AuthButtons` 왼쪽**에 넣는다.

```tsx
// src/app/(main)/_components/Header.tsx — 기존 34~37행 교체
{/* Auth / Action Buttons */}
<div className="flex items-center gap-2">
  <Button asChild variant="ghost" size="icon" aria-label="상품 검색">
    <Link href={routes.search}>
      <Search className="h-5 w-5" strokeWidth={1.5} />
    </Link>
  </Button>
  <AuthButtons />
</div>
```

추가 import: `import { Search } from "lucide-react";`, `import { Button } from "@/client/components/atoms";` (`routes`·`Link`는 이미 import돼 있음).

### 결정 근거

| 항목 | 결정 | 근거 |
|---|---|---|
| 왜 우측 클러스터인가 | 좌측은 480px에서 `MobileNav`(햄버거)+로고가 이미 차지. 우측 클러스터는 모바일에서 아이콘 1개(`AuthButtons`)뿐이라 여유 있음 | REQ-2 acceptance "기존 데스크톱 nav/MobileNav 레이아웃 안 깨짐" |
| 왜 `<Link>`인가 | `src/client/components/CLAUDE.md` **예외 2** — mutation 없는 단순 페이지 이동은 `useRouter().push()`가 아니라 `<Link>`/`Button asChild`. 이러면 컨테이너 분리 자체가 불필요해져 `Header`가 Server Component로 남는다 | 컨벤션 |
| 왜 `Button asChild`인가 | `<Button>`은 `"use client"` atom이지만 Server Component에서 import 가능. ghost/size=icon 조합은 `MobileNav`의 트리거 버튼과 동일해 시각적 일관성 확보 | 기존 패턴 답습 |
| `strokeWidth={1.5}` | `MobileNav`의 `Menu`/`X`/`Gem` 아이콘과 동일 굵기 | 시각 일관성 |
| `aria-label="상품 검색"` | 아이콘 온리 버튼은 접근 가능한 이름이 없다. `MobileNav`가 `aria-label="메뉴 열기"`로 같은 패턴을 씀 | 접근성 + 기존 패턴 |
| MobileNav 시트 안에도 넣는가 | **넣지 않는다.** 우측 클러스터는 모바일에서도 항상 보이므로 중복 | REQ-2 "검색 아이콘만 추가" |

### routes.ts 추가

```ts
// src/shared/constants/routes.ts — products 블록 아래에 추가
  search: "/search",
```

- 값이 문자열 리터럴 하나뿐이므로 하위 객체(`{ root: ... }`)로 감싸지 않는다. 서브 경로가 생기면 그때 객체로 승격.
- `routes` 객체 자체가 함수(`byCategory` 등)를 포함해 camelCase이므로 케이스 규칙 변화 없음(`src/CLAUDE.md` 식별자 케이스).
- `src/proxy.ts`의 `config.matcher`는 **건드리지 않는다** — `/search`는 공개 경로다.

---

## 4. REQ-3 — `/search` 페이지 구조

### 4-1. `page.tsx` (Server Component)

```tsx
// src/app/(main)/search/page.tsx
import { ProductSearch } from "./_components";

export default function SearchPage() {
  return <ProductSearch />;
}
```

- 배치(grid/flex/spacing) 코드 0줄 → Template 추출 예외 충족.
- `export default` — Next.js 파일 컨벤션(`src/app/CLAUDE.md`).
- `metadata` export는 이번 범위에서 하지 않는다(루트 `app/layout.tsx`가 metadata 단일 담당).

### 4-2. `_components`/`_hooks` 분리 여부 — **둘 다 만든다**

`src/app/CLAUDE.md`: "필요한 것만 생성, 빈 폴더 강제 금지" + "폴더 + `index` 배럴 형태 외의 방식으로 만들지 않는다(파일 1개여도 예외 없음)".

| 폴더 | 만드는가 | 근거 |
|---|---|---|
| `_components/` | O | 컨테이너 1 + 순수 UI 2 |
| `_hooks/` | O | SWR 훅 + 디바운스 훅 |
| `_types/` | X | 별도 타입 없음 — 응답 타입은 `@/shared/schemas`에서 가져옴 |
| `_utils/` | X | 순수함수 없음 |
| `_constants/` | X | 디바운스 지연값 1개뿐이라 `ProductSearch.tsx` 모듈 로컬 상수로 둔다 |

배럴 내용:
```ts
// _components/index.tsx — page.tsx가 직접 소비하는 것만 재export
export { ProductSearch } from "./ProductSearch";
// SearchBar / SearchEmptyState는 ProductSearch 내부 전용이라 올리지 않아도 된다
// (src/app/CLAUDE.md: 배럴은 page.tsx/layout.tsx가 직접 소비하는 파일만)

// _hooks/index.ts
export * from "./useProductSearch";
export * from "./useDebouncedValue";
```

### 4-3. `useProductSearch` — 검색 API 호출 훅

```ts
// src/app/(main)/search/_hooks/useProductSearch.ts
"use client";

import useSWR from "swr";
import { fetcher } from "@/client/fetcher";
import { ProductResponse } from "@/shared/schemas";
import { ErrorPayload } from "@/shared/types";

export function useProductSearch(query: string) {
  const trimmed = query.trim();
  const key = trimmed
    ? `/api/products/search?q=${encodeURIComponent(trimmed)}`
    : null;

  const { data, error, isLoading, isValidating } = useSWR<
    ProductResponse[],
    ErrorPayload
  >(key, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  return { products: data, error, isLoading, isValidating, isIdle: key === null };
}
```

| 설계 포인트 | 내용 |
|---|---|
| `"use client"` 최상단 | `src/client/hooks/CLAUDE.md` 규칙 — 훅 파일은 예외 없이 고정(배럴이 모듈 그래프를 묶기 때문) |
| SWR key = `null` | trim 후 빈 문자열이면 **fetch 자체를 안 한다**. SWR의 conditional fetching 공식 패턴 |
| `encodeURIComponent` 필수 | 한글 검색어 + `&`/`#`/`+` 같은 문자가 쿼리스트링을 깨뜨린다. **boundary-verifier 체크 포인트** |
| `keepPreviousData: true` | 검색어가 바뀔 때 이전 결과를 유지해 그리드가 깜빡이지 않게 한다 |
| `revalidateOnFocus: false` | 검색 결과는 탭 복귀마다 재조회할 이유가 없다. 인덱스 없는 regex 스캔(REQ-1)이라 호출을 아낀다 |
| 에러 타입 | `fetcher`는 실패 시 `body.error`(= `ErrorPayload`)를 throw한다 → SWR `error`가 곧 `ErrorPayload` |
| `fetcher` 밖 fetch 금지 | `src/client/CLAUDE.md` — envelope 파싱/에러 정규화가 `fetcher`에 집중돼 있음 |
| 훅 위치 | 소비 라우트가 `/search` 1곳뿐 → `src/client/hooks/`로 승격하지 않고 `_hooks/`에 둔다(`src/app/CLAUDE.md`: 2곳 이상 공유 시 승격) |

> ⚠ **api-designer 확인 필요**: 파라미터명(`q`), 경로(`/api/products/search`), 응답 `data` 타입(`ProductResponse[]`)은 현재 mock 전제다. §8 참고.

### 4-4. `useDebouncedValue` — 디바운스 훅

```ts
// src/app/(main)/search/_hooks/useDebouncedValue.ts
"use client";

import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

- cleanup(`clearTimeout`)이 없으면 타이핑 중 타이머가 누적돼 디바운스가 무력화된다 — 필수.
- 소비처가 1곳이라 `_hooks/`에 둔다. 두 번째 라우트가 쓰면 `src/client/hooks/useDebouncedValue.ts`로 승격(`src/client/hooks/CLAUDE.md`의 "페칭 외 공유 로직 훅은 목적을 PascalCase로" 네이밍에 이미 부합).

### 4-5. fetch 트리거 결정 — **300ms 디바운스**

| 후보 | 채택 | 사유 |
|---|---|---|
| 매 keystroke | ✗ | REQ-1이 `$text` 인덱스를 명시적으로 배제하고 regex 부분일치를 쓴다 → 매 요청이 컬렉션 스캔. "청첩장" 입력 시 6~9회 스캔 발생. 인증도 없는 공개 엔드포인트라 증폭 리스크 |
| 제출식(Enter/버튼만) | ✗ | REQ-3 acceptance가 "검색어 **입력 시** 결과가 렌더"라 엄격 검증에서 미달로 읽힐 수 있음. 0건 메시지가 늦게 뜨는 것도 아님 |
| **300ms 디바운스** | **✓** | 타이핑 중 호출을 1회로 수렴시키면서 "입력 시 자동 렌더"를 만족. 사람의 타이핑 간격(대략 150~250ms)보다 살짝 길어 단어 단위로 끊긴다 |

**Enter 키 처리**: `<form onSubmit={(e) => e.preventDefault()}>`로 폼 기본 제출(=페이지 새로고침)만 막는다. Enter를 별도 검색 트리거로 만들지 **않는다** — 어차피 300ms 안에 디바운스가 발화하므로 트리거를 이중화하면 상태 소스가 둘로 갈라져 경합만 생긴다. `<form role="search">` 자체는 모바일 키보드에 "검색" 확인 키를 띄우기 위해 유지한다.

```ts
// ProductSearch.tsx 모듈 로컬 상수 (src/CLAUDE.md: 값이 끝까지 리터럴 → SCREAMING_SNAKE_CASE)
const SEARCH_DEBOUNCE_MS = 300;
```

### 4-6. `SearchBar` — 입력 UI와 autofocus

```tsx
// src/app/(main)/search/_components/SearchBar.tsx  (순수 — props만 받음)
"use client";

import { Search } from "lucide-react";
import { Input } from "@/client/components/atoms";

export function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <form role="search" onSubmit={(e) => e.preventDefault()} className="relative">
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
        enterKeyHint="search"
        maxLength={100}
        aria-label="상품 검색"
        placeholder="상품명을 검색해보세요"
        className="pl-9"
      />
    </form>
  );
}
```

| 항목 | 결정 | 근거 |
|---|---|---|
| 입력 상태 | **controlled input + 부모의 로컬 `useState`로 충분** | `src/CLAUDE.md`: "로컬 상태로 충분한 걸 곧바로 Context나 Zustand로 확장하지 않는다". 검색어를 소비하는 건 같은 트리 안의 형제 하나뿐이라 `ProductFilterProvider` 같은 Context 도입 불필요 |
| autofocus 처리 | React `autoFocus` prop | `/search`는 검색이 유일한 목적인 전용 페이지라 포커스 탈취가 사용자 기대와 일치. `useEffect` + `ref.current.focus()`로 우회하지 않는다 |
| `type="search"` | 채택 | iOS/Chrome이 네이티브 클리어(X) 버튼을 붙여준다. 별도 클리어 버튼 구현 불필요 |
| `enterKeyHint="search"` | 채택 | 모바일 소프트키보드 확인 키를 "검색"으로 바꾼다 |
| `maxLength={100}` | 채택 | 무의미하게 긴 쿼리로 regex 스캔을 유발하는 것을 입력 단계에서 차단 |
| `Command`/`CommandInput` 미사용 | — | cmdk `Command`는 로컬 리스트 필터링+자동완성용. 이번엔 서버 검색이고 자동완성은 범위 밖 |

> ⚠ **모바일 gotcha (frontend-impl 필독)**: iOS Safari는 사용자 제스처 없는 `autoFocus`로 **소프트 키보드를 띄우지 않는다**(input에 포커스 링만 생김). 이는 브라우저 정책이라 `useEffect`+`ref.focus()`로도 우회되지 않으며, 억지 우회는 스크롤 점프 부작용만 만든다. 플랫폼 동작으로 수용한다 — 데스크톱에서는 정상적으로 즉시 타이핑 가능하다.

### 4-7. `ProductSearch` — 컨테이너

```tsx
// src/app/(main)/search/_components/ProductSearch.tsx
"use client";

const SEARCH_DEBOUNCE_MS = 300;

export function ProductSearch() {
  const [input, setInput] = useState("");
  const debouncedQuery = useDebouncedValue(input, SEARCH_DEBOUNCE_MS);
  const { products, error, isLoading, isValidating, isIdle } =
    useProductSearch(debouncedQuery);

  return (
    <main className="bg-background min-h-screen">
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="mx-auto max-w-7xl">
          {/* 제목 + 검색바 */}
          <SearchBar value={input} onChange={setInput} />
          {/* §5 상태 분기 렌더 */}
        </div>
      </div>
    </main>
  );
}
```

- 바깥 셸(`container mx-auto px-4 pt-24 pb-16` + `max-w-7xl`)은 `/products/[category]/page.tsx`와 동일하게 맞춘다 — Header가 sticky라 `pt-24`가 필요하다.
- 이 컨테이너가 라우트의 **유일한** 컨테이너다("라우트당 컨테이너 1개" 원칙).

---

## 5. 상태 머신

### 5-1. 상태 정의 (API 응답 shape과 1:1)

| 상태 | 판정 조건 (위에서부터 순서대로 평가) | 렌더 |
|---|---|---|
| `IDLE` | `input.trim() === ""` (= `isIdle`) | `TypographyMuted` "검색어를 입력해주세요" |
| `ERROR` | `error !== undefined` | `Alert type="error"` + `error.message` 그대로 |
| `LOADING` | `isLoading \|\| (isValidating && !products?.length)` | `Spinner` (중앙 정렬) |
| `EMPTY` | `products?.length === 0` | `SearchEmptyState` |
| `SUCCESS` | `products.length > 0` | `ProductGrid` (`isValidating`이면 `opacity-60`) |

**평가 순서가 중요하다.** `keepPreviousData: true` 때문에 검색어 변경 시 이전 `products`가 남아 있으므로, `LOADING` 판정에 `isValidating && !products?.length`를 넣어야 "이전 결과가 0건이었을 때 새 검색 중에도 EMPTY 메시지가 잘못 떠 있는" 현상을 막는다.

### 5-2. 상태 전이표 (Phase2/3 코드 대조 기준)

| 현재 상태 | 다음 상태 | 트리거 |
|---|---|---|
| `IDLE` | `LOADING` | 입력값이 trim 후 비어있지 않게 됨 → 300ms 경과 → SWR key 생성 |
| `LOADING` | `SUCCESS` | fetch 200 && `data.length > 0` |
| `LOADING` | `EMPTY` | fetch 200 && `data.length === 0` |
| `LOADING` | `ERROR` | `fetcher`가 `ErrorPayload` throw (non-2xx) |
| `SUCCESS` | `SUCCESS(재검증)` | 디바운스된 검색어 변경 → 새 key. `keepPreviousData`로 이전 그리드 유지 + `opacity-60` |
| `SUCCESS(재검증)` | `SUCCESS` / `EMPTY` / `ERROR` | fetch 완료 |
| `EMPTY` | `LOADING` | 디바운스된 검색어 변경 (이전 데이터가 `[]`라 표시할 게 없음) |
| `ERROR` | `LOADING` | 디바운스된 검색어 변경 → 새 key로 재시도 |
| `SUCCESS` / `EMPTY` / `ERROR` / `LOADING` | `IDLE` | 입력값을 전부 지움 (trim 후 `""`) → SWR key = `null` |

전이 트리거는 **딱 두 종류**뿐이다: (a) 디바운스된 검색어 변경, (b) SWR fetch 완료/실패. 다른 경로로 상태를 바꾸는 코드가 있으면 설계 위반이다.

### 5-3. 로딩 / 에러 / 빈 상태 구분 (REQ-4 핵심)

셋을 혼동하지 않게 하는 것이 REQ-4 acceptance("0건 검색 시 빈 화면/에러 대신 안내 메시지")의 본질이다.

| | 원인 | 시각적 표현 | 문구 |
|---|---|---|---|
| `LOADING` | 응답 대기 | `Spinner` (회전) | 없음 |
| `ERROR` | 네트워크 실패 / 서버 5xx·4xx | `Alert type="error"` (빨간 배경) | 서버가 준 `ErrorPayload.message` **그대로**. 클라이언트가 문구를 재작성하지 않는다 (`docs/ERROR_HANDLING.md` §채널 C) |
| `EMPTY` | 200 + `data: []` | 점선 테두리 박스 + 중립 아이콘 | "검색결과가 없습니다" |

에러 문구를 클라이언트에서 category별로 매핑하지 않는 이유: `docs/ERROR_HANDLING.md`가 "클라이언트는 실패를 해석하지 않는다 — 서버가 준 `ErrorPayload`를 그대로 렌더한다"고 못박고 있고, 민감 분류(INTERNAL/EXTERNAL_SERVICE)의 message 일반화는 이미 서버 `toErrorPayload`가 끝냈다.

---

## 6. 결과 렌더링 — 재사용 대상 확정 (REQ-3)

### 6-1. `ProductCatalog` 두 구현체 조사 결과

| 파일 | 성격 | 검색 결과에 쓸 수 있나 |
|---|---|---|
| `src/app/(main)/(products)/products/_components/ProductCatalog.tsx` | 라우트 컨테이너. `useProducts(category, products)`로 `/api/products?category=` 를 다시 부르고 `usePremiumFeature()`도 호출 | **✗** — 우리가 이미 검색 API로 받은 결과를 카테고리 전체 목록으로 덮어써 버린다 |
| `src/client/components/organisms/ProductCatalog.tsx` | 순수 organism. `ProductFilterProvider` + `ProductFilters` + `ProductGrid` 조합 | **✗** — 아래 이유 |
| `src/client/components/organisms/ProductGrid.tsx` | 순수. `data: Product[]` + `state: ProductFilterState` | **✓ 채택** |

**`organisms/ProductCatalog`을 쓰지 않는 이유 3가지**

1. `category: ProductCategory` **필수 prop**. 검색 결과는 원리상 여러 카테고리가 섞일 수 있어 단일 값을 정할 수 없다. 지금은 `ProductCategory = "invitation"` 하나뿐이라 하드코딩해도 동작은 하지만, 카테고리가 2개가 되는 순간 조용히 틀리는 코드가 된다(`src/shared/utils/CLAUDE.md`의 "카테고리 추가 절차"가 실제로 예정된 확장이다).
2. 하위 `ProductFilters`가 `premiumFeatures: PremiumFeature[]`도 요구한다 → 검색 화면에 불필요한 `/api/premium-features` 호출이 따라붙는다.
3. `ProductFilters`는 자체 검색창(`CommandInput`)을 품고 있다 → `/search` 화면에 검색창이 2개 생긴다.

→ 한 단계 아래인 **`ProductGrid`만** 재사용한다. `ProductGrid`에는 `category` prop이 없어서 1번 문제가 구조적으로 사라진다.

### 6-2. `category` prop을 어떻게 채우는가

**채우지 않는다.** `ProductGrid`는 `category`를 받지 않는다. 대신 카테고리 정보는 **항목별로** `product.category`에 실려 오고, `ProductCard`가 그 값으로 상세 링크를 만든다:

```
ProductCard.tsx:25  <Link href={routes.products.detail(product.category, product._id)}>
```

→ **응답 항목의 `category`는 반드시 enum key(`"invitation"`)여야 한다. 한글 라벨("초대장")이 오면 `/products/초대장/{id}`가 되어 `isProductCategory()` 검사에 걸려 404가 난다.** REQ-1의 "라벨→enum key 역조회"는 *입력* 파라미터에만 적용되고 *출력*은 enum key 유지여야 한다 — api-designer 확인 항목(§8 U1).

### 6-3. `state: ProductFilterState`를 어떻게 채우는가

`ProductGrid`는 내부에서 `useVisibleProducts({ state, data })`를 호출해 **한 번 더 필터링+정렬**한다. `/search`에는 필터 UI가 없으므로 `@/client/context/productFilter`의 `initialFilterState`를 그대로 주입한다.

```tsx
import { initialFilterState } from "@/client/context/productFilter";
...
<ProductGrid data={products} state={initialFilterState} />
```

`ProductFilterProvider`는 **감싸지 않는다** — `ProductGrid`는 `useProductFilter()`를 호출하지 않고 `state`를 prop으로만 받으므로 Provider가 필요 없다(Provider를 쓰는 건 `organisms/ProductCatalog`의 `ProductCatalogBody`다).

**pass-through 증명** (boundary-verifier 대조용 — `src/client/hooks/useVisibleProducts.ts` 기준):

| `ProductFilterState` 필드 | `initialFilterState` 값 | `useVisibleProducts` 안 분기 | 결과 |
|---|---|---|---|
| `subCategory` | `"all"` | `state.subCategory === "all"` → `true` | 전건 통과 |
| `keyword` | `""` | `if (!state.keyword) return true` | 전건 통과 |
| `price` | `"ALL"` | `case "ALL": return true` | 전건 통과 |
| `premiumFeat` | `[]` | `if (length === 0) return true` | 전건 통과 |
| `sortBy` | `"ALL"` | `case "ALL": default: return 0` | **서버가 준 순서 그대로 보존** |
| `isOpen` | `false` | `useVisibleProducts`에서 미사용(`ProductFilters` 전용) | 무영향 |

→ 서버가 준 `N`건이 그대로 `N`건 렌더된다. **클라이언트가 검색 결과를 추가로 걸러내지 않는다**는 것이 이 표의 요지다. Phase3에서 이 표대로 동작하는지 확인할 것.

### 6-4. `ProductGrid` 내장 빈 상태는 도달 불가

`ProductGrid`는 `visibleProducts.length === 0`일 때 "상품을 준비 중에 있습니다"를 렌더하는데, `/search`에서는 `products.length > 0`일 때만 `ProductGrid`를 렌더하므로(§5-1 상태 분기) 이 브랜치에 도달하지 않는다. 즉 **`ProductGrid`를 수정할 필요가 없다** — REQ-4 문구는 `SearchEmptyState`가 담당한다.

---

## 7. REQ-4 — 0건 상태 UI

```tsx
// src/app/(main)/search/_components/SearchEmptyState.tsx  (순수)
import { SearchX } from "lucide-react";
import { TypographyP, TypographyMuted } from "@/client/components/atoms";

export function SearchEmptyState({ query }: { query: string }) {
  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
      <div className="bg-muted mb-6 flex h-20 w-20 items-center justify-center rounded-full">
        <SearchX className="text-muted-foreground h-10 w-10 opacity-40" />
      </div>
      <TypographyP className="mb-2 text-xl font-semibold tracking-tight">
        검색결과가 없습니다
      </TypographyP>
      <TypographyMuted className="max-w-[280px] text-base leading-relaxed">
        {`'${query}'와 일치하는 상품을 찾지 못했어요.`}
        <br />
        다른 검색어로 다시 시도해보세요.
      </TypographyMuted>

      {/*
        TODO(Phase3): 서브카테고리 진입 카드 섹션.
        막다른 페이지 방지가 원래 의도지만 진입 카드가 아직 미구현이라
        이번 범위에서는 메시지까지만 노출한다(00_requirements REQ-4).
      */}
    </div>
  );
}
```

| 항목 | 결정 | 근거 |
|---|---|---|
| 메시지 위치 | `SearchBar` **바로 아래**, `ProductGrid`가 있던 자리 | 검색창은 계속 보여야 재입력이 가능하다(막다른 페이지 방지 의도) |
| 스타일 | `ProductGrid` 내장 빈 상태와 동일한 점선 박스 + 원형 아이콘 | 같은 앱 안에서 빈 상태 시각 언어를 통일 |
| 아이콘 | `SearchX` (lucide) | `PackageOpen`(재고 준비중)과 의미가 다름을 아이콘으로도 구분 |
| `query` prop | 검색어를 문구에 노출 | 무엇을 검색했는지 확인시켜 오타 인지를 돕는다 |
| 진입 카드 | **넣지 않음** | REQ-4 명시 — Phase3 미구현. TODO 주석으로 의도만 남긴다 |
| 로딩/에러와의 구분 | §5-3 표 참고 | 세 상태가 서로 다른 컴포넌트로 갈라져 절대 겹치지 않는다 |

---

## 8. 폼 유효성 규칙

검색 입력은 폼 제출이 아니라 조회 파라미터라 zod 검증 대상이 얇다. **클라이언트에서 zod 스키마를 새로 정의하지 않는다.**

| 규칙 | 적용 위치 | 근거 |
|---|---|---|
| trim 후 길이 0이면 API를 호출하지 않는다 | `useProductSearch`의 SWR key = `null` | 빈 쿼리로 컬렉션 스캔을 유발하지 않는다. 서버도 200+`[]`로 방어하되, 클라이언트는 애초에 안 부른다 |
| 최대 길이 100자 | `<Input maxLength={100}>` | HTML 속성만으로 충분. 별도 검증 로직 불필요 |
| 그 외 형식 검증 없음 | — | 검색어에 특수문자/공백이 들어와도 정상 입력이다. `encodeURIComponent`로 전송 안전성만 확보 |
| 서버가 `q`에 zod 제약(min/max 등)을 둔다면 | `@/shared/schemas`에서 **그 스키마를 import해 재사용**한다. 클라이언트에서 동일 규칙을 재정의하지 않는다 | 프로젝트 원칙(스키마 중복 정의 금지) — 현재 `src/shared/schemas/request/`에 검색용 스키마는 없다 |
| 검증 실패 시 표시 | 서버가 내려준 `ErrorPayload`(`category: "VALIDATION"`)를 `Alert`에 그대로 렌더 | `docs/ERROR_HANDLING.md` §채널 C. `fieldErrors`는 검색창이 단일 필드라 사실상 안 쓰임 |

---

## 9. 미확정 쟁점 / 협업 필요 항목

> **api-designer / db-migrator에게 SendMessage를 3회 시도했으나 "No agent named ... is reachable"로 전달 실패했다.** 두 에이전트가 아직 스폰되지 않은 것으로 보인다. 아래 항목은 전부 **mock shape 전제**이며, 스폰 후 반드시 대조가 필요하다. 리더에게 이관한다.

| ID | 쟁점 | 현재 가정(mock) | 확인 대상 | 어긋나면 바뀌는 곳 |
|---|---|---|---|---|
| **U1** | 응답 항목의 `category`가 enum key인가 라벨인가 | **enum key** (`"invitation"`) | api-designer | 라벨이면 `ProductCard`의 상세 링크가 404 → 카드 재사용 자체가 불가, 신규 카드 필요 (§6-2) |
| **U2** | 응답 `data` 타입 | `ProductResponse[]` (기존 `/api/products`와 동일) | api-designer | 축소 DTO면 `ProductGrid`/`ProductCard` 재사용 불가 → REQ-3 전제 붕괴. 필요 필드: `_id`, `title`, `thumbnail`, `price`, `discount.{discountType,value}`, `category`, `subCategory`, `isPremium`, `isFeatured`, `likes` |
| **U3** | 쿼리 파라미터명 / 엔드포인트 경로 | `GET /api/products/search?q=` | api-designer | 훅의 SWR key 문자열 1줄 수정 |
| **U4** | 0건이 200+`[]`인가 404인가 | **200 + `data: []`** | api-designer | 404면 `EMPTY` 상태가 `ERROR`로 잘못 떨어져 REQ-4 acceptance 실패 |
| **U5** | 검색에서 발생 가능한 `ErrorCategory` | VALIDATION / INTERNAL 정도로 가정 | api-designer | 문구 매핑은 안 하므로 UI 코드 변경은 없음. 문구 검토용 정보 |
| **U6** | 훅의 타입을 `ProductResponse[]`로 할지 `Product[]`로 할지 | `ProductResponse[]` | api-designer | 기존 `useProducts.ts`는 route가 `ProductResponse[]`를 리턴하는데 `Product[]`로 타이핑하는 **기존 불일치**가 있다. 신규 훅은 실제 계약(`ProductResponse[]`)을 따르는 게 맞다고 판단했으나 의견 필요 |
| **U7** | 검색어를 URL(`/search?q=`)에 동기화할지 | **✅ 리더 판정: 동기화 안 함 유지** | 리더 | 요구사항 범위 밖, Suspense 경계 복잡도 대비 이득 작음 — v1 스킵 확정 |
| **U8** | 0건 화면에 `/products/invitation` 링크 하나라도 둘지 | **✅ 리더 판정: 링크 1개 추가** | 리더 | TODO.md 원 의도("막다른 페이지로 안 만듦")를 REQ-4 스코프 안에서 최소 비용으로 충족 — `SearchEmptyState`에 "검색결과가 없습니다" 문구 + `<Link href={routes.products.byCategory("invitation")}>` "전체 상품 보기" 1줄 추가. Phase3 서브카테고리 카드 자리(TODO 주석)는 그대로 유지 |

**api-designer 쟁점 대조 결과 (2026-07-31, api-designer가 세션 제한으로 못 보낸 회신을 리더가 01_api_contract.md v2에서 직접 확인):**
- U1(category enum key): **일치 확인** — `transformProduct`가 category를 변환 없이 그대로 스프레드, DB엔 enum key만 저장 → mock 가정 그대로 맞음
- U2(응답 타입 `ProductResponse[]`): **일치 확인**
- U3(`GET /api/products/search?q=`): **일치 확인**
- U4(0건 = 200+`[]`): **일치 확인**
- U5/U6: api_contract §6/§5.4 기준 mock 가정과 어긋남 없음

동일 쟁점 3라운드 초과 여부: 해당 없음(설계 문서 교차대조로 리더가 직접 해소, 통신 라운드 자체는 0회).

**Phase1 승인 상태: 리더 승인 완료 (2026-07-31). frontend-impl 착수 가능.**

---

## 10. Phase2/3 인계 체크리스트

frontend-impl / boundary-verifier가 대조해야 할 항목:

- [ ] `routes.search === "/search"` ↔ `src/app/(main)/search/page.tsx`의 실제 도달 URL 일치 (§1)
- [ ] `Header.tsx`가 `useRouter().push()`가 아니라 `<Link href={routes.search}>`를 쓰는지 (§3)
- [ ] `Header.tsx`에 `/search` 하드코딩 문자열이 없는지 (`routes.search`만 참조)
- [ ] SWR key의 엔드포인트 문자열 ↔ `src/app/api/products/search/route.ts` 실제 경로 일치 (§4-3)
- [ ] SWR key에 `encodeURIComponent`가 적용됐는지 (한글 검색어 깨짐 방지) (§4-3)
- [ ] `input.trim() === ""`일 때 SWR key가 `null`인지 (불필요 호출 차단) (§4-3, §8)
- [ ] 상태 분기 평가 **순서**가 §5-1 표와 동일한지 (특히 `EMPTY`보다 `LOADING`이 먼저)
- [ ] `EMPTY` 상태에서 "검색결과가 없습니다"가 뜨고 `ERROR`/`LOADING`과 겹치지 않는지 (§5-3)
- [ ] `ProductGrid`에 `initialFilterState`가 그대로 주입돼 서버 결과 N건이 N건 렌더되는지 (§6-3 pass-through 표)
- [ ] `organisms/` 아래 파일이 **하나도 수정되지 않았는지** (공유 컴포넌트 무변경 원칙, §2-1)
- [ ] `ProductCard`의 상세 링크가 `/products/invitation/{id}`로 정상 생성되는지 (= 응답 `category`가 enum key인지, §6-2 / U1)
- [ ] `_components/index.tsx`, `_hooks/index.ts` 배럴이 존재하는지 (`src/app/CLAUDE.md` 필수)
- [ ] `_hooks/*.ts` 두 파일 모두 최상단에 `"use client"`가 있는지 (`src/client/hooks/CLAUDE.md`)
- [ ] `src/proxy.ts` matcher에 `/search`가 추가되지 **않았는지** (공개 페이지, §1)
- [ ] `Header.test.tsx`에 검색 아이콘/링크 assertion이 추가됐는지 (§2-1)
