## T13 — FR-7 성인 콘텐츠 토글 `AdultToggle` + include_adult 배선

> 구현: implementer · 2026-07-06
> 경계선 결정(planner): 상태 공유 = React Context + URL searchParams 동기화. ADR 불필요.

### 변경 파일
- **신규** `src/features/adult-content/adult-content-context.tsx` — `AdultContentProvider` + `useAdultContent` 훅.
- **신규** `src/features/adult-content/adult-toggle.tsx` — `AdultToggle` pill 스위치 컴포넌트.
- `src/app/layout.tsx` — `AdultContentProvider` 로 헤더+main 래핑, 헤더 placeholder 버튼 → `<AdultToggle />`.
- `src/features/search/search-explorer.tsx` — placeholder 버튼 → `<AdultToggle className="shrink-0" />`, `useAdultContent()` 의 `includeAdult` 를 `useSearchInfinite` 에 전달.
- `src/features/discover/discover-explorer.tsx` — `useAdultContent()` 의 `includeAdult` 를 `useDiscoverInfinite` 에 전달, `buildQuery` 를 현재 URL 파라미터 병합 방식으로 변경(장르 토글 시 `adult` 파라미터 보존).

배선만 확인(이미 존재, 변경 없음): `/api/search`·`/api/discover` Route Handler 의 `includeAdult` 수신, `useSearchInfinite`/`useDiscoverInfinite` 의 `includeAdult` 파라미터 + queryKey 포함, tmdb-client `searchMulti(query, page, includeAdult)`·`discoverByGenre(type, genreIds, page, includeAdult)` 까지의 서버사이드 적용.

### 결정사항
- **상태 소유 = 모듈 스코프 외부 스토어 + `useSyncExternalStore`** (useState+effect 아님).
  - 이유: 초기값은 URL(`?adult=1`)에서 복원해야 하는 브라우저 전용 상태. useState 후 effect 에서 setState 하면 hydration 불일치 + React 19 `react-hooks/set-state-in-effect` 린트 에러. `useSyncExternalStore` 는 `getServerSnapshot=false` 로 SSR·하이드레이션을 안전하게 처리하고, 모듈 스코프 값이라 클라이언트 네비게이션 사이에 메모리로 유지된다(전체 새로고침 시에만 URL 재시드).
- **URL 동기화 = `history.replaceState`** (얕은 갱신). RootLayout 수준 공유 컴포넌트에서 `useSearchParams` 를 쓰면 앱 전체가 CSR bailout(Suspense 요구) → 정적 홈/상세 프리렌더가 깨진다. `next/dist/docs` use-search-params 가이드 확인 후 replaceState 채택(discover-explorer 동일 패턴). 서버 라운드트립 없음.
- **discover URL 쓰기 병합화**: 기존 `buildQuery` 가 `?type=&genres=` 를 프레시 생성해 `adult` 를 덮어썼음. 장르 토글 후에도 `adult` 가 URL 에 남도록 `window.location.search` 기반 병합으로 변경.
- **디자인 토큰**: 새 토큰 없음. OFF=`success` 도트, ON=`danger` 강조(`border-danger`/`bg-danger/10`/`text-danger` — 기존 `--color-danger` 유틸리티), `rounded-pill`·`bg-surface`·`border-border`·`text-caption` 만 사용.
- **모션**: 도트 이동 framer-motion `layout`, `useReducedMotion()` 시 `layout` 비활성(즉시 스냅, opacity 외 변형 제거).

### API 응답 shape / 훅 타입
- 신규 API 없음(기존 `/api/search`·`/api/discover` 재사용). `AdultContentContextValue = { includeAdult: boolean; setIncludeAdult: (next: boolean) => void; toggle: () => void }`.

### 반영한 에러/엣지케이스
- **키 미노출**: Context/토글/훅 모두 키 미접근. `include_adult` 는 Route Handler → tmdb-client 서버사이드에서만 TMDB 로 전달(ADR-0003).
- **`aria-checked` 정확성**: `role="switch"` + `aria-checked={includeAdult}`. 색상만이 아니라 도트 위치 + 라벨 텍스트("숨김"/"표시") 병행(색맹 대응).
- **상태 전환 즉시 반영**: `includeAdult` 가 queryKey 에 포함 → 토글 시 TanStack Query 가 새 키로 자동 재조회(별도 invalidate 불필요).
- **새로고침/URL 공유 유지**: `?adult=1` URL 동기화 + 마운트 시 URL 시드. discover 는 장르 토글 후에도 `adult` 보존.
- **reduced-motion**: `useReducedMotion()` 분기로 layout 애니메이션 제거.
- **Provider 밖 사용 방어**: `useAdultContent` 가 Context null 시 조용한 기본값 대신 에러 throw(배선 누락 노출).

### 완료 기준 체크
- [x] 토글 ON/OFF 가 검색·디스커버 결과에 반영(includeAdult → 훅 queryKey → Route Handler → tmdb-client include_adult).
- [x] `aria-checked` 정확(role="switch" + aria-checked 바인딩).
- [x] 새로고침/URL 공유 시 상태 유지(`?adult=1` 동기화 + URL 시드, discover 병합 보존).
- [x] 헤더·검색 두 토글이 동일 Context 공유.
- [x] 키 미노출(서버사이드 적용).
- [x] `npx tsc --noEmit` EXIT 0, `npx eslint` EXIT 0.
- [ ] `next build`: TMDB_API_KEY 미설정 환경이라 홈 `/` 프리렌더 단계 실패로 전체 실행 불가(T13 범위 밖 기존 환경 이슈, 선행 태스크 QA 와 동일). typecheck/lint + 문서 API 대조로 대체 검증. 신규 코드는 `useSearchParams` 미사용이라 정적 페이지 프리렌더에 영향 없음.
