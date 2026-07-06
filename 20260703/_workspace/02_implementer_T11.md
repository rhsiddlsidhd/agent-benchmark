## T11 (FR-6 장르 필터 UI + getGenres + discover Route Handler/훅)

### 변경 파일
- `src/lib/tmdb/client.ts` — **변경 없음.** `getGenres(type)`·`discoverByGenre(type, genreIds, page, includeAdult)`가 이미 구현되어 있어 재사용. (T2에서 선반영됨)
- `src/features/discover/types.ts` (신규) — discover 응답/에러 공유 타입.
- `src/app/api/discover/route.ts` (신규) — `/api/discover` Route Handler.
- `src/features/discover/use-discover-infinite.ts` (신규) — `useDiscoverInfinite` 훅(useInfiniteQuery).
- `src/components/ui/filter-chip.tsx` (신규) — `FilterChip` 토글 칩 프리미티브.
- `src/features/discover/genre-filter.tsx` (신규) — `GenreFilter` 다중 선택 스트립.
- `src/components/ui/index.ts` — `FilterChip` 배럴 export 추가.

### API 응답 shape (`/api/discover`)
- 성공(200): TMDB `discoverByGenre` 결과를 그대로 전달.
  - `type=movie` → `Paginated<Movie>` (`DiscoverMovieResponse`)
  - `type=tv` → `Paginated<TVShow>` (`DiscoverTvResponse`)
  - `{ page, results, total_pages, total_results }`. results 아이템에는 media_type 판별자가 **없다**(요청 `type`으로 결정).
- 실패: `{ error: string }` (`DiscoverErrorResponse`).
  - 400: `type` 누락/오타(movie·tv 외).
  - 429/5xx: TMDB 상태코드 그대로 패스스루.
  - 502: 네트워크/타임아웃(TmdbError.status === 0).
- 파라미터: `type`(필수), `genreIds`(콤마구분 양의정수), `page`(1+정규화), `includeAdult`("true"만 true).

### 훅 타입 (`useDiscoverInfinite`)
- `fetchDiscoverPage<T>` → `Paginated<DiscoverItem<T>>` (`DiscoverItem<"movie"> = Movie`, `DiscoverItem<"tv"> = TVShow`).
- 호출부가 `type`을 리터럴로 넘기면 결과 아이템이 Movie/TVShow로 정확히 좁혀진다 → 소비 컴포넌트에서 별도 내로잉 불필요.
- `getNextPageParam`: `page < total_pages ? page+1 : undefined`.
- `queryKey`: `["discover", type, sortedGenreIds, includeAdult]` (genreIds 정렬 → 선택 순서 무관 동일 캐시).
- `retry: 1`, `enabled` 기본 true(0개 선택도 유효).

### 반영한 에러/엣지케이스
- **429/5xx 패스스루**: Route Handler가 TmdbError.status를 그대로 반환(자체 재시도 없음, ADR-0004). 훅은 non-ok를 throw → `retry: 1`.
- **마지막 페이지 정지**: `getNextPageParam` undefined 반환(추가 로딩 UI 없이 조용히 정지). sentinel은 T12 화면 조립에서 `hasNextPage && !isFetchingNextPage`로 연결.
- **결과 없음**: 응답 shape 유지(results: []) → 소비 화면이 `EmptyState` 노출(T12).
- **장르 0개 선택 기본 동작(결정)**: 차단/빈 화면이 아니라 `with_genres` 생략 + `popularity.desc` 정렬 = 인기작 디스커버. 그리드가 항상 채워져 사용자가 장르를 붙여가며 좁힌다. 훅 `enabled` 기본 true.
- **잘못된 입력 방어**: type 오타 400, genreIds 내 비정수/음수 항목 제거, page NaN/0/음수 → 1.
- **접근성**: FilterChip = 네이티브 button + `aria-pressed` + 체크 아이콘(색맹 대응, §2.5). GenreFilter = `role="group"` + aria-label. 포커스 링은 globals.css :focus-visible 위임.
- **모션**: FilterChip whileTap 축소, `useReducedMotion` 시 변형 제거(§5).
- **반응형**: GenreFilter 데스크톱 wrap / 모바일 가로 스크롤(`overflow-x-auto md:flex-wrap`)(§2.5).

### 완료 기준 체크
- [x] getGenres/discoverByGenre 존재(재사용) — client.ts 무변경 확인
- [x] FilterChip 다중선택·default/selected·색상+체크아이콘·aria-pressed
- [x] GenreFilter 데스크톱 wrap / 모바일 가로 스크롤
- [x] `/api/discover` Route Handler(type·genreIds·page·includeAdult, 키는 핸들러 내부에서만)
- [x] `useDiscoverInfinite`(useInfiniteQuery, T5 패턴 재사용, retry:1)
- [x] 타입 안전(any/as 없음, DiscoverItem<T> 조건부 타입) — `tsc --noEmit` EXIT 0
- [x] eslint EXIT 0
- [x] 키 미노출 — 클라이언트 파일에 process.env/tmdb/client 참조 없음(grep 확인)
- [ ] 화면 조립(선택 상태 URL 동기화 + 그리드 렌더 + 무한스크롤 sentinel)은 **T12 범위** — 본 태스크는 UI/훅/API 단위 완성에 집중

### 결정/비고 (Planner·QA 확인 필요 사항)
1. **`node_modules/next/dist/docs/` 부재**: 이 설치본(next 16.2.10)에는 해당 docs 디렉토리가 존재하지 않는다. 따라서 이미 QA를 통과한 기존 라우트 핸들러(`/api/search`, `/api/tv/[id]/season/[n]`) — `export async function GET(request: NextRequest): Promise<NextResponse>`, `NextResponse.json` — 의 검증된 패턴을 그대로 따랐다. `/api/discover`는 동적 세그먼트가 없어 params Promise 규약과 무관.
2. **selected 칩 전경색 편차**: 03_DESIGN §2.5는 selected를 "brand 배경 + text-primary"로 표기하나, content-primary(near-white)를 brand(cyan #01b4e4) 위에 얹으면 §6/NFR-4 대비 기준을 통과하지 못한다. 이미 QA를 통과한 `Pill`의 brand variant와 동일하게 `text-base`(어두운 전경)를 사용해 대비를 확보했다. **두 값 모두 기존 디자인 토큰이며 새 값을 만들지 않았다.** 문서 문구를 엄격히 따르길 원하면 알려달라.
