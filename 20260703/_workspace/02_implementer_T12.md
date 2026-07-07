## T12 (FR-6 장르 탐색 화면 조립)

### 라우트 경로 결정: `/discover`
- 기존 네이밍 컨벤션이 **플랫 top-level 세그먼트**(`/search`, `/movie/[id]`, `/tv/[id]`, `/person/[id]`)이므로 `/discover` 가 일관적. `/genre` 는 특정 장르 단수를 연상시키나 이 화면은 다중 장르 + 타입 탐색이라 부적합.
- 이미 존재하는 Route Handler `/api/discover`(T11)와 의미·경로가 정렬됨(TMDB `/discover/{type}` 엔드포인트 semantics).
- planner 가 `/discover` 또는 `/genre` 중 판단 위임 → `/discover` 채택.

### 변경 파일 (모두 신규)
- `src/app/discover/page.tsx` — Server Component. `searchParams`(Next 16 Promise) 파싱 + `getGenres("movie")`/`getGenres("tv")` 병렬 로드(server-only, revalidate 3600) → `DiscoverExplorer` 에 props 주입.
- `src/features/discover/discover-explorer.tsx` — Client Component 본체. 미디어 타입 선택 + GenreFilter + ContentCard 그리드 + 무한스크롤 sentinel + 로딩/에러/무결과 상태 + URL 동기화.
- `src/app/discover/error.tsx` — 세그먼트 Error Boundary(초기 장르 목록 fetch 실패 → ErrorState + `unstable_retry`).
- `src/app/discover/loading.tsx` — getGenres 로드 중 스켈레톤(필터 자리 + SkeletonGrid, CLS 방지).

**T11 산출물 재사용(무변경):** `src/app/api/discover/route.ts`, `src/features/discover/use-discover-infinite.ts`, `src/features/discover/genre-filter.tsx`, `src/features/discover/types.ts`, `src/components/ui/filter-chip.tsx`, `src/lib/tmdb/client.ts`(getGenres/discoverByGenre). T11 코드는 한 줄도 수정하지 않음 → 순수 조립(통합 검증 성격).

### API 응답 shape / 훅 타입 (T11 계약 그대로 소비)
- 훅: `useDiscoverInfinite<MediaType>({ type, genreIds })`. `type` 이 `MediaType`(유니온) 변수라 결과 아이템 타입은 `DiscoverItem<MediaType>` = `Movie | TVShow`(조건부 타입 분배).
- 소비 컴포넌트는 `"title" in item` 타입가드로 Movie/TVShow 를 좁혀(`as` 단언 없음) `toCardData()` 로 정규화 → ContentCard(`href`/`title`/`posterPath`/`year`/`rating`). Movie→`/movie/[id]`, TVShow→`/tv/[id]`.
- Route Handler 응답/에러 shape(`Paginated<Movie|TVShow>` / `{error}`)는 T11 QA 에서 이미 훅과 일치 확인됨. 본 태스크는 훅을 그대로 호출만 하므로 새 계약면 없음.

### URL searchParams 동기화 (§3.6 권장)
- 파라미터: `?type=movie|tv&genres=28,12`.
- **쓰기(클라이언트):** `window.history.replaceState(null, "", ?...)` — Next 가 공식 지원하는 shallow routing(next docs `02-guides/single-page-applications.md` "Shallow routing on the client", usePathname/useSearchParams 와 동기화). 서버 라운드트립·장르 재요청 없이 URL 만 갱신.
- **읽기/복원(서버):** `page.tsx` 가 `await searchParams` 로 초기 `type`/`genreIds` 계산. `genres` 는 **선택 타입의 실제 장르 목록에 존재하는 양의 정수만** 남겨 오염값/타 타입 id 제거 후 초기 선택으로 주입 → 새로고침·링크 공유 시 상태 복원.
- 타입 전환 시 장르 id 는 타입별로 다르므로 선택을 비우고 URL 도 함께 갱신.

### 반영한 에러/엣지케이스 (01_ARCHITECTURE §4)
- **초기/추가 로딩:** 초기 `isLoading` → SkeletonCard 12장 그리드(`aria-busy`), `isFetchingNextPage` → SkeletonCard 6장 append. 서버 getGenres 대기 중은 `loading.tsx`.
- **에러(ErrorState):** 훅 `retry:1`(T11) 최종 실패 → `ErrorState`(refetch 재시도). 초기 장르 목록 실패 → `error.tsx`(`unstable_retry`).
- **무결과(EmptyState):** 로드 완료 + 결과 0 → `EmptyState`("다른 장르 조합으로 시도해보세요").
- **마지막 페이지 정지:** sentinel `enabled = hasNextPage && !isFetchingNextPage` → 미부착으로 추가 UI 없이 조용히 정지(안내 문구 없음).
- **장르 0개 기본 동작:** 차단 없이 인기순 디스커버(훅/Route Handler 기본). 진입 시 항상 그리드가 채워짐.
- **키 미노출:** 클라이언트 파일(discover-explorer/error/loading)에 `process.env`/`tmdb/client`/토큰 참조 0건(grep 확인). getGenres 는 Server Component(page.tsx)에서만 호출. 결과 조회는 `/api/discover` 경유(ADR-0003).

### 접근성 / 반응형 / 모션
- 반응형 그리드(§4): `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`, gutter/card-gap 토큰. GenreFilter 는 모바일 가로 스크롤 / 데스크톱 wrap(T11).
- h 계층: 페이지 h1 "장르 탐색" 1개. 미디어 타입 그룹 `role="group"` + aria-label. 장르는 GenreFilter `role="group"`. FilterChip `aria-pressed` + 체크 아이콘(T11).
- `aria-live="polite"` sr-only status 로 결과 변화(로딩/무결과/N개/에러) 안내.
- 모션: ContentCard/FilterChip 의 framer-motion(whileHover/whileTap) + `useReducedMotion` 대응은 기존 컴포넌트에 내장.
- 미디어 타입 선택은 기존 FilterChip 재사용(단일 선택 강제: 같은 타입 재클릭 no-op).

### 완료 기준 체크
- [x] 전용 탐색 라우트 `/discover` 생성(컨벤션 근거 문서화)
- [x] GenreFilter + ContentCard 그리드 + 무한스크롤 sentinel end-to-end 연결
- [x] 선택 상태 URL 동기화(replaceState 쓰기 + searchParams 서버 복원, 공유·새로고침 유지)
- [x] 반응형 그리드 열 수(§4)
- [x] 로딩 Skeleton / 에러 ErrorState(재시도) / 무결과 EmptyState
- [x] `npx tsc --noEmit` EXIT 0 · `npx eslint` EXIT 0
- [x] `next build` 컴파일 + TypeScript 통과, 서버/클라이언트 경계 정상(client 파일이 server-only 를 import 하면 컴파일 실패하나 없음)
- [x] 키 미노출(grep 확인)

### 비고 / 확인 필요 사항
1. **`next build` 프리렌더는 홈 `/` 에서 실패**(TMDB 토큰 미설정 환경). 이는 기존 `/`(정적, 빌드타임 fetch) 문제이며 본 태스크 범위 밖. `/discover` 는 `searchParams` 사용으로 dynamic 이라 프리렌더 대상이 아니고 에러에 연루되지 않음. 컴파일/타입체크는 통과.
2. **헤더 네비게이션 링크 미추가**: `/discover` 진입 링크를 전역 헤더(T1)에 넣는 것은 헤더(ui) 책임이자 범위 밖 다중 파일 수정이라 이번 태스크에서 제외. 화면 도달성을 위해 헤더/홈에 링크 추가가 필요하면 planner 판단 요청(별도 소규모 태스크 권장).
3. **미디어 타입 토글 추가 결정**: discover 는 type 이 필수(장르 목록도 타입별)라 영화/TV 단일 선택 토글을 추가함. §3.6 이 명시하진 않으나 FR-6 를 두 타입 모두에 대해 완성하기 위한 최소 구성이며, T11 훅/route 가 이미 양쪽을 지원. FilterChip 재사용으로 새 컴포넌트/토큰 없이 구현.
