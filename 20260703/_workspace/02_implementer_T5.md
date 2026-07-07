## T5. 검색 Route Handler + useInfiniteQuery 훅 (FR-2)

- 변경 파일:
  - `src/features/search/types.ts` (신규) — search 모듈 공유 타입
  - `src/app/api/search/route.ts` (신규) — `/api/search` Route Handler
  - `src/features/search/use-search-infinite.ts` (신규) — `useSearchInfinite` 훅

### API 응답 shape (`/api/search` GET)
- 요청 쿼리 파라미터: `query`(string), `page`(number, 기본 1), `includeAdult`("true"|기타→false)
- 성공(200): `SearchResponse = Paginated<MultiSearchResult>` — `searchMulti` 결과를 그대로 전달
  ```ts
  { page: number; results: MultiSearchResult[]; total_pages: number; total_results: number }
  ```
- 실패: `SearchErrorResponse = { error: string }`, status 는 TMDB 상태코드 패스스루
- 응답 타입은 `src/features/search/types.ts` 에서 정의하고 Route Handler·훅이 **동일 파일을 참조**해 shape 일치를 보장.

### 훅 타입 (`useSearchInfinite`)
- 입력: `{ query: string; includeAdult?: boolean }`
- `useInfiniteQuery` 제네릭 페이지 타입 = `SearchResponse` (`fetchSearchPage(...): Promise<SearchResponse>`)
- `queryKey: ["search", trimmedQuery, includeAdult]`
- `initialPageParam: 1`, `getNextPageParam: (lastPage) => lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined`
- `enabled: trimmedQuery.length > 0`, `retry: 1`
- 이번 태스크에서 페이지 UI 연결은 하지 않음(T6). 훅 타입/동작만 완성.

### 반영한 에러/엣지케이스 (§4)
- TMDB 429/5xx **상태코드 그대로 패스스루**: `isTmdbError` 로 좁힌 뒤 `NextResponse.json(body, { status })`. 유효 HTTP 범위(400~599)만 그대로 사용하고, 네트워크/타임아웃(`TmdbError.status === 0`)은 502 로 매핑. 핸들러 자체 재시도 없음(ADR-0004).
- 빈 query 방어: `query` trim 후 빈 문자열이면 TMDB 호출 없이 빈 `Paginated`(200) 반환 — 응답 shape 유지. 훅 쪽도 `enabled: false` 로 이중 방어.
- 무한스크롤 마지막 페이지: `getNextPageParam` 이 `undefined` 반환 → 추가 로딩 UI 없이 조용히 정지.
- 예상치 못한 에러는 삼키지 않고 재던져 Next 기본 500 처리에 위임.
- 키 노출: 모든 TMDB 호출이 `server-only` tmdb-client(`searchMulti`) 경유. Route Handler 는 서버 전용 실행이라 구조적으로 키가 클라이언트 번들·네트워크 탭에 노출되지 않음(ADR-0003).

### 검증
- `npx tsc --noEmit` PASS
- `npx eslint`(신규 3파일) PASS
- `npm run build` PASS — `/api/search` 가 `ƒ (Dynamic)` server-rendered on demand 로 등록됨

### 참고(Next.js 16.2.10 확인 사항)
- `node_modules/next/dist/docs/01-app/.../15-route-handlers.md` 확인: Route Handler 는 `app` 디렉토리 내 `route.ts`, `GET(request: NextRequest)` 시그니처. 요청 파라미터 접근(`request.nextUrl.searchParams`)으로 자동 dynamic 처리됨(캐시 opt-in 안 함) — 검색은 no-store 정책과 일치.
