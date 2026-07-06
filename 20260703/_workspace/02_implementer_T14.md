## T14 — NFR 마감 하드닝 (로딩/에러 경계 · 접근성 · 성능/실행 검증)

- 변경 파일:
  - 신규 `src/app/loading.tsx` — 홈(`/`) 세그먼트 로딩 스켈레톤(히어로 backdrop + 3 캐러셀 레일 자리).
  - 신규 `src/app/not-found.tsx` — 루트 미매칭 경로용 브랜드 404.
  - 신규 `src/app/movie/[id]/loading.tsx` — 영화 상세 로딩 스켈레톤(히어로/포스터/줄거리/출연진 레일 자리).
  - 신규 `src/app/tv/[id]/loading.tsx` — TV 상세 로딩 스켈레톤(동 구조).
  - 신규 `src/app/person/[id]/loading.tsx` — 인물 상세 로딩 스켈레톤(프로필/약력/필모그래피 그리드 자리).
  - 수정 `src/features/discover/discover-explorer.tsx` — 결과 그리드 앞 `sr-only` h2("탐색 결과") 1줄 추가(헤딩 계층 스킵 보정). 그 외 로직/시각 변경 없음.
- API 응답 shape / 훅 타입: 변경 없음(T14는 경계·접근성만, 데이터 계약 무수정).
- 반영한 에러/엣지케이스: 세그먼트 로딩 경계 보강(CLS 방지), 루트 404 fallback, 헤딩 계층 정합성. 기존 `error.tsx`/`not-found.tsx`/데이터 결측/무한스크롤 정지 정책은 각 FR 태스크 구현물 그대로 유지(미변경).

---

### 1. 라우트별 세그먼트 경계 현황표

기존 파일은 미변경, `+` 표시가 T14에서 신규 추가한 파일.

| 라우트 | loading.tsx | error.tsx | not-found.tsx | 비고 |
|--------|-------------|-----------|----------------|------|
| `/` (home) | **+ 추가** | 있음(`src/app/error.tsx`) | **+ 추가**(루트) | 루트 error.tsx 는 자체 경계 없는 라우트의 공통 fallback 겸용 |
| `/search` | 미추가(의도) | 없음(루트 error.tsx 가 커버) | n/a | 아래 "설계 판단" 참조 |
| `/discover` | 있음(기존) | 있음(기존) | n/a | 동적 파라미터 없음 → not-found 불필요 |
| `/movie/[id]` | **+ 추가** | 있음(기존) | 있음(기존) | |
| `/tv/[id]` | **+ 추가** | 있음(기존) | 있음(기존) | |
| `/person/[id]` | **+ 추가** | 있음(기존) | 있음(기존) | |

설계 판단(왜 일부는 추가하지 않았나 — 최소 범위 원칙):
- **`/search` loading.tsx 미추가**: `search/page.tsx` 는 서버 데이터 페치가 없는 얇은 껍데기(Server Component)이고 실제 로딩은 `SearchExplorer`(Client) 가 자체 상태로 처리한다. loading.tsx 를 두면 즉시 사라지는 헛플래시만 유발 → 추가하지 않음. (대비: `discover/page.tsx` 는 `getGenres` 를 서버에서 받으므로 loading.tsx 가 유의미 → 기존 유지.)
- **`/search` 전용 error.tsx 미추가**: 세그먼트 에러는 상위 `src/app/error.tsx`(루트 경계)로 버블링되어 이미 커버된다. 쿼리 실패는 `SearchExplorer` 내부 `ErrorState`(retry:1) 가 담당. 중복 경계라 미추가.
- Next.js 16.2 error prop 은 `unstable_retry`(v16.2.0 추가, `node_modules/next/dist/docs/.../file-conventions/error.md` 확인) — 기존 error.tsx 들이 이미 이 prop 을 사용 중이라 신규 파일에서도 동일 관례 유지(단, T14 신규 파일은 loading/not-found 뿐이라 error prop 은 미사용).

### 2. 접근성 점검 / 보강

점검 결과 — 대부분 기존 구현에서 이미 충족, 실제 결함 1건만 보강:

- **랜드마크**: `layout.tsx` 에 `header` / `nav`(aria-label="주요 메뉴") / `main` 존재. 검색은 `role="search"` form. 정상 — 미변경.
- **h1 유일성**: 홈=히어로 h1, 상세=작품/인물명 h1, 검색=sr-only h1("검색"), 디스커버=h1("장르 탐색"). 런타임에서 home/movie/search 모두 `<h1>` 정확히 1개 확인. 중복 h1 없음 — 미변경.
- **헤딩 계층 스킵(보강함)**: `/discover` 결과 그리드는 `h1`(장르 탐색) 바로 아래에 `ContentCard` 제목(`h3`)이 와서 `h2` 를 건너뛰었다. → 그리드 앞에 `sr-only` `h2`("탐색 결과") 1줄 추가로 `h1→h2→h3` 복원. 시각 디자인 무변경. (홈/검색은 캐러셀/섹션 `h2` 가 이미 있어 정상.)
- **aria-live**: 검색(`search-explorer` sr-only `role="status" aria-live="polite"`)·디스커버(동일)·TV 시즌 셀렉터에 결과 변화 안내 존재. 정상 — 미변경.
- **포커스 링**: `globals.css` 전역 `:focus-visible { outline: 2px solid var(--color-focus) }` 로 모든 인터랙티브 요소 커버 + button/content-card/filter-chip/adult-toggle 개별 보강. 키보드 접근 대상(링크/입력/칩/토글) 전부 포커스 가능·가시 링. 정상 — 미변경.
- **reduced-motion**: `globals.css @media (prefers-reduced-motion: reduce)` 전역 감쇠 + framer-motion `useReducedMotion`. 정상 — 미변경.
- **관측된 저위험 항목(미변경, 기록만)**: 홈 h1 은 히어로(트렌딩 유효 항목)가 있을 때만 렌더된다. 트렌딩이 전부 인물이거나 빈 배열이면 홈에 h1 이 없어질 수 있으나 실사용상 발생 확률 극히 낮고, 무조건 sr-only h1 을 추가하면 히어로 존재 시 h1 중복(과제에서 금지)이 되므로 현행 유지.

### 3. 성능 / 실행 검증 로그 요약

- **`npx next build`**: 성공. TypeScript/Turbopack 통과, 경고 0. `/` Revalidate 1h(3600) 확인, `/_not-found` 정적 프리렌더 확인. 상세 라우트는 `[id]` 동적(ƒ) — revalidate 는 fetch 레벨(client.ts)에서 주입(기존 정책 유지).
- **`npm run dev`(포트 3111) 실측 상태코드**:

  | 요청 | 결과 | 판정 |
  |------|------|------|
  | `/` | 200 | OK(main·히어로·h1 렌더) |
  | `/search`, `/search?q=batman` | 200 | OK |
  | `/discover`, `/discover?type=tv&genres=18` | 200 | OK |
  | `/movie/238`, `/tv/1399`, `/person/1` | 200 | OK(h1: movie-title / person-name 렌더) |
  | `/movie/999999999`, `/tv/999999999`, `/person/999999999` | 200 (soft-404) | not-found.tsx 본문 + `<meta robots noindex>` 렌더 |
  | `/this-route-does-not-exist` | **404** | 루트 not-found.tsx 렌더 |
  | `/api/search?query=batman`, `/api/discover?type=movie` | 200 | OK |

- **soft-404 확인**: 잘못된 id 상세는 HTTP 200 + not-found 본문 + `noindex` 로 응답한다. 이는 Next 16 스트리밍 기본 동작(`loading.md`: 응답 바디 스트리밍 시작 후 상태코드 변경 불가 → soft-404 + noindex). **T14 의 loading.tsx 추가가 원인이 아님**을 검증: `movie/[id]/loading.tsx` 제거 상태에서도 동일하게 200 → 즉 T7/T8/T10 QA 통과 시점부터 이미 이 동작이었고 회귀 없음. not-found UX(전용 본문) 와 검색엔진 차단(noindex) 은 정상. 미매칭 라우트(`/this-route-does-not-exist`)는 라우팅 단계에서 결정되어 진짜 404 반환.
- **콘솔 에러/경고**: dev 로그 42줄에 React 에러·hydration 경고·deprecation·unhandled rejection **없음**. `[tmdb] HTTP 404: ...` 는 tmdb-client 의 의도된 로깅(→ notFound() 유발)으로 정상.
- **키 미노출**: `/api/search` 응답 바디에 `TMDB_ACCESS_TOKEN` 문자열 0회.
- **번들/이미지**: 상세/홈은 Server Component + `next/image`(PosterImage/BackdropImage) 유지, 신규 loading/not-found 는 Server Component(불필요한 client 경계 없음). 새 색상/spacing 토큰 도입 없음(기존 `@theme` 토큰만 사용).

### 미해결 / 판단 필요
없음. 신규 5개 경계 파일 + 디스커버 헤딩 1줄 보강만으로 완료. 기존 QA 통과 코드는 리팩토링하지 않음.
