## T6 — 검색 페이지 `/search` UI + 무한스크롤 (FR-2)

### 변경 파일
- `src/app/search/page.tsx` (신규) — 얇은 Server Component. metadata(`title: "검색"`)만 노출하고 `SearchExplorer` 렌더.
- `src/features/search/search-explorer.tsx` (신규) — `"use client"` 본체. 검색 폼 + 타입별 섹션 그리드 + 무한스크롤 + 상태(초기/로딩/무결과/에러) 분기.
- `src/features/search/use-intersection-observer.ts` (신규) — 무한스크롤 sentinel 감지 훅.

선행 산출물(`use-search-infinite.ts`, `types.ts`, `/api/search`, UI 배럴)은 재구현 없이 그대로 사용.

### 데이터 흐름 / 훅 타입
- Client Component → `useSearchInfinite({ query, includeAdult })`(TanStack Query `useInfiniteQuery`) → `/api/search` Route Handler → `searchMulti`(server-only, 키 서버 전용).
- 페이지 타입: `SearchResponse = Paginated<MultiSearchResult>` (`use-search-infinite.ts` 정의 그대로). 훅 리턴의 `data.pages`를 `flatMap`으로 평탄화 후 소비.
- `includeAdult`는 이번 태스크에서 `false` 고정(T13에서 AdultToggle 상태로 배선 예정).

### API 응답 shape
- 신규 API 없음. 기존 `/api/search`의 `SearchResponse` shape을 소비만 함(신규 route handler 미생성).

### media_type 분기 렌더
- `partitionResults()`가 `media_type` 판별자(`"movie" | "tv" | "person"`)로 유니온 내로잉하여 3배열 분리 — `as` 단언 없음.
- 영화(`title`/`release_date`/`/movie/[id]`)·TV(`name`/`first_air_date`/`/tv/[id]`)는 `ContentCard`, 인물(`/person/[id]`)은 `PersonAvatar`를 `Link`로 감싼 `PersonResultCard`(대표작 `known_for` 최대 2편을 부제로).
- 그리드는 디자인 토큰만 사용(`gap-card-gap`/`gap-card-gap-lg`, `px-gutter`/`px-gutter-lg`, `max-w-page`, `text-h2` 등). 임의 색상/spacing/arbitrary value 없음.

### IntersectionObserver 구현 방식
- `useIntersectionObserver({ onIntersect, enabled, rootMargin=400px })` — 반환 ref를 리스트 하단 sentinel `<div>`에 부착.
- `enabled = Boolean(hasNextPage) && !isFetchingNextPage`:
  - 마지막 페이지(`hasNextPage` false, 훅의 `getNextPageParam`이 undefined 반환) → 옵저버 미부착 → **추가 UI 없이 조용히 정지**(안내 문구 없음).
  - 로딩 중(`isFetchingNextPage`) → 미부착 → 중복 요청 방지.
- 진입 시 `void fetchNextPage()` 호출, 로딩 중에는 `SkeletonCard` 6장 append.
- `onIntersect` 최신값은 `callbackRef`로 참조하되 ref 갱신은 render 중이 아닌 `useEffect`에서 수행(react-hooks/refs 린트 준수).

### 반영한 에러/엣지케이스 (§4, §3.2)
- 초기(입력 전, `submittedQuery === ""`) → `EmptyState`("무엇을 찾고 있나요?").
- 첫 페이지 로딩(`isLoading`) → SkeletonCard 그리드(`role=status` `aria-busy`).
- 검색 실패(`isError`, 훅 `retry:1` 이후 최종 실패) → `ErrorState` + `refetch` 재시도.
- 결과 없음(`results.length === 0`) → `EmptyState`("다른 키워드로 시도해보세요").
- 마지막 페이지 → sentinel 미부착으로 조용히 정지.
- 데이터 결측: 연도 빈 문자열 → `null`(ContentCard가 "연도 미상" 대체), poster/profile null은 PosterImage/PersonAvatar 플레이스홀더, 인물 대표작 없으면 부제 줄 생략.
- 제출 흐름: 입력 중에는 `inputValue`만 갱신(요청 없음), `onSubmit`(Enter) 시에만 `submittedQuery` 갱신 → 훅 `enabled`가 켜짐. 실시간 자동완성 없음.
- 접근성: sr-only `role=status` `aria-live=polite`로 결과 변화 안내(로딩/N건/무결과/오류), `role=search` 폼, sr-only `h1`, 섹션 `h2`(aria-labelledby), 자동 포커스 입력.

### 검증 결과
- `npx tsc --noEmit` — 통과(0 에러).
- `npx eslint` (신규 3파일) — 통과(0 에러/경고).
- `npm run build` — 성공. `/search`는 static 프리렌더(○), `/api/search`는 dynamic(ƒ).

### 참고
- 상세 페이지(`/movie/[id]`, `/tv/[id]`, `/person/[id]`)는 후속 태스크라 링크 클릭 시 404 가능하나 **경로는 정확**(완료 기준 허용).
