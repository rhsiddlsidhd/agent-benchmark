## T4 — 홈 화면 `/` (FR-1)

- 담당: implementer · 2026-07-05
- 결과: `npx tsc --noEmit` 통과, `npx eslint` 통과, `npm run build` 성공(Next.js 16.2.10 Turbopack). 빌드 시 `/` 가 **revalidate 1h(3600)** 로 정적 프리렌더됨(실제 TMDB 데이터 페치 성공 = 통합 검증됨).

### 변경 파일

**신규**
- `src/app/home.module.css` — 홈 캐러셀 가로 스크롤 레일 스타일(반응형 노출 장수). 간격/좌우 여백은 디자인 토큰 CSS 변수(`--spacing-card-gap`/`-lg`, `--spacing-gutter`/`-lg`)만 사용, 카드 폭은 구조적 퍼센트(모바일 ~2.2장 → sm 3.3 → md 4.5 → lg 6 → xl 7).
- `src/app/error.tsx` — 세그먼트 Error Boundary(`"use client"`). TMDB fetch 실패를 잡아 `ErrorState` 노출 + 재시도.

**수정(교체)**
- `src/app/page.tsx` — T1 플레이스홀더 → 실제 홈 구현(Server Component, async).

### 데이터 흐름 / API 응답 shape

- 별도 Route Handler·훅 없음. Server Component 경로이므로 `tmdb-client` 를 **직접 호출**(ADR-0003, 키는 서버 전용 모듈 내부에서만 접근).
- `Promise.all([getTrending(), getPopularMovies(), getPopularTv()])` 병렬 조회.
  - `getTrending(): Paginated<MultiSearchResult>` (movie|tv|person 유니온)
  - `getPopularMovies(): Paginated<Movie>`, `getPopularTv(): Paginated<TVShow>`
- 캐싱은 `client.ts` 가 `revalidate: 3600`(목록류) 주입 → 빌드 로그에서 `/` Revalidate 1h 확인.

### 뷰 모델 타입

- `CardItem { href: string; title: string; posterPath: string | null; year: string | null; rating: number }` — 영화/TV 를 캐러셀 카드로 정규화한 공통 모델. `ContentCard` props 와 1:1.

### media_type 분기 방식 (완료 기준 핵심)

- 트렌딩은 `MultiSearchResult` 유니온 → 타입 가드 `isTitledResult(item): item is MovieSearchResult | TVSearchResult` 로 **인물(person) 제외**(포스터/제목 없는 인물은 ContentCard 레일에 부적합). 남은 영화/TV 만 카드화.
- `href` 는 `media_type` 판별로 생성: `movie → /movie/${id}`, `tv → /tv/${id}`. 제목도 분기(`movie.title` / `tv.name`), 연도도 분기(`release_date` / `first_air_date`).
- 히어로 CTA href 동일 규칙: `/${heroItem.media_type}/${heroItem.id}`.
- 상세 페이지(T7/T8)는 아직 없어 클릭 시 404 허용 — **링크 경로 정확성만** 보장.
- `as` 단언 없이 유니온 내로잉만으로 타입 안전(CLAUDE.md typing 준수, `any` 미사용).

### 반영한 에러/엣지케이스 (§4 / §2.9)

- **fetch 실패(타임아웃/5xx/네트워크)**: `src/app/error.tsx` 세그먼트 Error Boundary 로 전파. `ErrorState` + 재시도 버튼.
- **리스트 빈 배열**: `trendingCards`/`movieCards`/`tvCards` 각각 `length > 0` 일 때만 섹션 렌더 → 빈 섹션 숨김.
- **히어로 결측 방어**: backdrop 있는 영화/TV 우선 → 없으면 첫 영화/TV → 그것도 없으면(`heroItem === null`) 히어로 섹션 자체 생략.
- **이미지 결측**: `BackdropImage`/`ContentCard(PosterImage)` 가 `path === null` 시 플레이스홀더 처리(그대로 사용).
- **텍스트 결측**: 연도 빈 문자열 → `null` → `ContentCard` 가 "연도 미상" 대체. 히어로 `overview` 빈 값이면 문단 생략.

### 주요 결정 사항 (AGENTS.md — Next.js 16.2.10 확인 반영)

- **`error.tsx` 재시도 prop**: `node_modules/next/dist/docs/.../file-conventions/error.md` 확인 결과 v16.2.0 에서 `unstable_retry` prop 추가. 문서는 "실패 데이터 재페치가 필요한 경우 `reset()` 대신 `unstable_retry()` 사용 권장" 명시. 홈은 TMDB 페치 실패 복구가 목적이므로 **`unstable_retry` 를 사용**(태스크 문구의 "reset 재시도"는 재요청까지 수행하는 `unstable_retry` 로 구현 — 단순 재렌더만 하는 `reset` 은 실패한 페치를 재시도하지 않아 부적합). ErrorState `onRetry` 에 연결.
- **모션**: 홈 페이지는 Server Component 유지(LCP/SSR 이점). 카드 hover/tap 인터랙션 모션은 `ContentCard`(framer-motion, reduced-motion 분기 내장)가 담당 → 별도 client 래퍼로 레일 전체를 client 화하지 않음. 섹션 진입 stagger 는 미적용(선택 사항, 필요 시 후속 보강).
- **레일 반응형**: 디자인 §4 "모바일 2.2장 / lg 6장"을 CSS 모듈 퍼센트로 구현. 임의 Tailwind arbitrary value(`w-[..px]`)·신규 색/spacing 토큰 없음. 간격은 기존 토큰 CSS 변수 재사용.
- **CTA 스타일**: 네비게이션이라 `<button>` 대신 `Link` 사용(button-in-link 무효 HTML 회피). 스타일은 `Button` primary 관례(`bg-brand text-base hover:bg-brand-strong`)를 그대로 반영해 일관성 유지.
- **import alias**: 프로젝트 관례대로 `@/src/...`(루트 기준) 사용.

### QA 유의점

- 상세 라우트 미구현 상태라 카드/CTA 클릭은 404 정상(경로 정확성만 검증 대상).
- 트렌딩 레일에서 person 결과는 의도적으로 제외(ContentCard 는 포스터/제목 기반). 트렌딩 카드 수가 트렌딩 원본보다 적을 수 있음.
- `error.tsx` 는 루트 세그먼트라 홈 외 자체 error.tsx 없는 라우트의 공용 fallback 역할도 겸함(T14 에서 세그먼트별 보강 가능).
