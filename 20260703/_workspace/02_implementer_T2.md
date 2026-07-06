## T2 — tmdb-client 모듈 + TMDB 응답 타입

### 변경 파일
- `src/lib/tmdb/errors.ts` — `TmdbError`(status/endpoint 보존) + `isTmdbError` 타입 가드
- `src/lib/tmdb/types.ts` — TMDB 응답 타입 전체
- `src/lib/tmdb/client.ts` — `server-only` fetch 래퍼 + 공개 함수

### 주요 결정사항

#### 1. 인증 방식: v4 Access Token(Bearer 헤더) 채택 — planner T2 가정과 다름
- planner 문서(T2)는 `TMDB_API_KEY`(v3, `api_key` 쿼리 파라미터)를 가정했으나, 실제 `.env.local`에는 **`TMDB_ACCESS_TOKEN`(v4 Bearer)만 존재**한다.
- 따라서 `Authorization: Bearer ${process.env.TMDB_ACCESS_TOKEN}` 헤더 방식으로 구현했다. 쿼리 파라미터에 키가 실리지 않아 로그/캐시 키 노출 표면도 더 작다.
- **후속 태스크/문서 영향**: 전역 규칙·아키텍처 문서의 "`TMDB_API_KEY`" 표기는 실제로 `TMDB_ACCESS_TOKEN`을 가리킨다. Route Handler/Server Component도 이 env 이름을 참조해야 한다. (planner에게 문서 표기 정정 필요 여부 확인 권장)

#### 2. 404 처리 규약 — 루트 리소스는 `| null`, 하위 리소스는 throw
- `getMovie`/`getTvShow`/`getPerson`은 **404 시 `null` 반환**(`tmdbRequestOrNull`). 호출부가 `if (!x) notFound()`로 분기(§4 정책).
- 그 외(`getMovieCredits`/`getMovieRecommendations`/`getTvSeason`/`getPersonCombinedCredits`)는 404 포함 실패를 `TmdbError`로 throw.
- **호출부 권장 패턴**: 상세 페이지는 루트(getMovie 등)를 먼저 조회해 null이면 `notFound()`, 그 후 하위 리소스를 호출한다. `Promise.all`로 병렬 호출 시 존재하지 않는 id면 하위 리소스가 404 throw → `error.tsx`로 빠질 수 있으니, 루트 존재 확인을 선행할 것(T7/T8/T10 구현 시 유의).

#### 3. 에러/엣지케이스 반영 (§4)
- **404 구분**: `TmdbError.isNotFound` + 루트 getter `null` 반환.
- **429 상태코드 보존**: `TmdbError.status`에 429 보존, `isRateLimited` 제공 → Route Handler(T5/T11)가 상태코드 그대로 패스스루 가능. 자체 재시도 없음(ADR-0004).
- **타임아웃/5xx/네트워크**: `AbortSignal.timeout(10s)` 타임아웃, 실패 시 `console.error` 로깅 후 `TmdbError`로 재전파(삼키지 않음, `cause` 보존). 최상위 `Error`로 뭉개지 않고 전용 타입 사용.
- 토큰 미설정 시 값 노출 없이 부재 사실만 담은 `TmdbError`(status 0) throw.

#### 4. 캐싱 (§6 / 배포 아키텍처)
- Next 16 fetch는 **기본 no-cache**(문서 확인)라 `next.revalidate`로 명시적 캐싱해야 함.
- 목록류(getTrending/getPopularMovies/getPopularTv/getGenres/discoverByGenre): `revalidate: 3600`.
- 상세(getMovie/getTvShow/getPerson/getMovieCredits/getMovieRecommendations/getTvSeason/getPersonCombinedCredits): `revalidate: 86400`.
- 검색(searchMulti): `no-store` — 쿼리 의존적·인터랙티브라 캐싱 부적합(무한 캐시 키 방지). revalidate/no-store 동시 지정 충돌 회피 위해 정책을 union 타입으로 모델링.

#### 5. 키 클라이언트 노출 방지
- `client.ts` 최상단 `import "server-only"` — 클라이언트 번들에 포함되면 빌드 에러. `process.env.TMDB_ACCESS_TOKEN` 접근은 이 모듈 내부로 한정(ADR-0003 / NFR-2).
- (Next 16이 `server-only`를 내장 제공: 별도 npm 설치 없이 `import` 및 `tsc` 해석됨 — 패키지 미설치 상태에서 typecheck 통과 확인.)
- `errors.ts`/`types.ts`는 `server-only`를 import하지 않음 — Route Handler가 `TmdbError.status`로 429 분기할 때 타입만 안전하게 재사용 가능.

### 공개 함수 시그니처(후속 태스크 참조용)
- `getTrending(): Promise<Paginated<MultiSearchResult>>`
- `getPopularMovies(page = 1): Promise<Paginated<Movie>>`
- `getPopularTv(page = 1): Promise<Paginated<TVShow>>`
- `getGenres(type: MediaType): Promise<Genre[]>`
- `discoverByGenre(type: "movie", genreIds, page?, includeAdult?): Promise<Paginated<Movie>>` / `(type: "tv", ...): Promise<Paginated<TVShow>>` (오버로드)
- `searchMulti(query, page = 1, includeAdult = false): Promise<Paginated<MultiSearchResult>>`
- `getMovie(id): Promise<MovieDetail | null>`
- `getTvShow(id): Promise<TVDetail | null>`
- `getPerson(id): Promise<PersonDetail | null>`
- `getMovieCredits(id): Promise<Credits>`
- `getMovieRecommendations(id): Promise<Paginated<Movie>>`
- `getTvSeason(id, seasonNumber): Promise<SeasonDetail>`
- `getPersonCombinedCredits(id): Promise<PersonCombinedCredits>`

### 타입(후속 훅/Route Handler shape 참조용)
- 페이지네이션 응답은 `Paginated<T>`(`{ page, results, total_pages, total_results }`) 형태 그대로.
- 검색/트렌딩 결과는 `MultiSearchResult` 유니온(`media_type: "movie" | "tv" | "person"` 판별자)로 UI에서 라우팅 분기.
- 필모그래피는 `PersonCombinedCredits`(cast/crew 각 항목이 `media_type` 판별 유니온) — T10 최신순 정렬·movie/tv 분기 지원.
- import 경로: 함수는 `@/src/lib/tmdb/client`, 타입은 `@/src/lib/tmdb/types`, 에러는 `@/src/lib/tmdb/errors`.

### 검증 결과
- `npx tsc --noEmit`: 통과(exit 0).
- `npx eslint src/lib/tmdb/`: 통과(exit 0).
- 실호출 검증은 후속 태스크(홈/검색 등 UI)에서 수행.
