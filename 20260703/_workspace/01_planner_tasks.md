# 기능: TMDB 탐색 웹앱 — PRD FR-1~FR-7 전체 구현

> 작성: planner · 2026-07-05
> 입력: docs/00_PRD.md, docs/01_ARCHITECTURE.md, docs/02_ADR.md, docs/03_DESIGN.md, _workspace/00_request.md
> 실행 방식: **우선순위(PRD 표기 순서) 순차** — implementer가 T1→T14 순으로 하나씩 구현, 각 완료 직후 qa 검증.

## 현재 상태 (baseline)

create-next-app 스캐폴딩 상태. 아래는 미구축이므로 FR-1 이전 기반 태스크(T1~T3)가 선행되어야 한다.
- Next.js 16.2.10 (App Router), React 19, Tailwind v4(@import + @theme, `tailwind.config` 파일 없음), TanStack Query·framer-motion 의존성만 설치됨.
- `src/app/`에 기본 page.tsx/layout.tsx/globals.css만 존재. tmdb-client·라우트 핸들러·UI 컴포넌트·디자인 토큰 매핑·QueryProvider 전부 없음.
- `.env`에 `TMDB_API_KEY` 필요(implementer가 사용자에게 값/설정 확인).

## 전역 구현 규칙 (모든 태스크 공통)

- **[AGENTS.md]** 이 Next.js는 학습 데이터와 다른 버전(16.2.10)이다. 코드 작성 전 `node_modules/next/dist/docs/`의 관련 가이드를 읽고 deprecation을 확인한다.
- **[CLAUDE.md typing]** `any` 금지 → `unknown` 사용. TMDB 응답 등 공유 데이터 구조는 전용 타입 정의 필수. `as` 단언 금지(`as const` 예외).
- **[NFR-2 / ADR-0003]** `TMDB_API_KEY`는 Server Component·Route Handler 내부에서만 `process.env`로 접근. 클라이언트 번들 미노출. tmdb-client는 `server-only`.
- **[03_DESIGN §1]** UI는 문서의 디자인 토큰만 사용(임의 색상/spacing 금지). Tailwind v4이므로 토큰은 `globals.css`의 `@theme`에 매핑(문서의 tailwind.config 예시는 v3 표기 → v4 @theme로 변환).
- **[NFR-1]** 이미지 `next/image` lazy loading + blur, 종횡비 고정(CLS 방지). 목록 캐싱 `revalidate: 3600`, 상세 `revalidate: 86400`.
- **[03_DESIGN §5,§6]** `prefers-reduced-motion: reduce` 시 모션 opacity만. 접근성(alt/aria/포커스링/랜드마크/h 계층) 준수.

## 브랜치

- **판단: 필요.** PRD 전체 구현은 대규모 기능 작업 → `feat/*` 브랜치에서 진행. 현재 브랜치는 `chore/harness-setup`(하네스 셋업용)이라 부적합.
- Git 전략(AGENTS.md): `feat/*`는 `dev` 기반 분기, QA 통과 후 `dev` 병합. worktree는 순차 작업이라 미사용.
- **제안(사용자 승인 후 오케스트레이터가 생성):** FR 단위 feature 브랜치를 `dev`에서 분기.
  - `feat/foundation-home` (T1~T4: 기반 3개 + FR-1 홈 — 홈은 토큰/클라이언트/UI 없이는 렌더 불가라 묶음)
  - `feat/search` (T5~T6: FR-2)
  - `feat/movie-detail` (T7: FR-3)
  - `feat/tv-detail` (T8~T9: FR-4)
  - `feat/person-detail` (T10: FR-5)
  - `feat/genre-filter` (T11~T12: FR-6)
  - `feat/adult-toggle` (T13: FR-7) · `feat/hardening` (T14: NFR 마감, 선택)
- 대안: 전 과정을 단일 `feat/tmdb-explorer` 브랜치로 진행(장수명 브랜치, PR 리뷰 단위 커짐). 순차 단일 개발이므로 어느 쪽도 가능 — **오케스트레이터가 사용자에게 확인 후 결정**. planner는 브랜치를 생성하지 않았다.

## ADR 필요 여부

- **판단: 신규 ADR 불필요(없음).** FR-1~FR-7은 새 라이브러리/기술을 도입하지 않는다. 사용 기술(App Router, TanStack Query, Tailwind, framer-motion)과 키 은닉·DB 미사용·rate limit 수용은 ADR-0001~0004에서 이미 결정됨.
- **경계선 후보(선택, 강제 아님):** FR-7 성인 토글의 클라이언트 상태 공유 방식(React Context vs URL searchParams vs cookie). 서버 렌더 페이지(홈/상세)까지 반영하려면 cookie/searchParams가 필요하나, 본 스코프에서 `include_adult`는 주로 검색/디스커버(클라이언트→Route Handler)에만 영향 → Context+URL 동기화로 충분. 아키텍처 변경 수준의 결정이 아니라 ADR 없이 T13에서 구현 결정으로 처리. 사용자가 문서화를 원하면 ADR-0005 초안 작성 가능.

---

## 태스크

> 각 태스크 헤더의 `[우선순위 N]`은 PRD 순서 기반 실행 순번. 모듈은 01_ARCHITECTURE §5 경계.

### T1. [우선순위 1 · 기반] 디자인 토큰 & 전역 셸 & 이미지 설정
- 모듈: ui (foundation)
- 설명:
  - `globals.css` `@theme`에 03_DESIGN §1 토큰 전체 매핑(색상/타이포 스케일/spacing 별칭/radius/shadow/z-index/종횡비). Tailwind v4 문법(`@theme { --color-...: ... }`).
  - 시스템 산세리프 스택 적용(추가 폰트 다운로드 제거 — 현재 Geist 폰트 로직 정리), 기본 배경 `bg-base`·`text-primary`.
  - `RootLayout` 재작성: `lang="ko"`, 랜드마크(`header`/`main`), sticky 헤더 셸(z-header) — 로고, `/search` 진입 링크. **AdultToggle 자리는 T13 전까지 비활성 placeholder**(우선순위상 FR-7이 마지막).
  - `metadata` 앱에 맞게 수정.
  - `next.config` 이미지 `remotePatterns`에 `image.tmdb.org` 등록(next/image 허용).
  - QueryProvider는 T3에서. 여기선 정적 셸만.
- 에러/엣지케이스 요구사항: `prefers-reduced-motion` 대응 CSS 기반 준비(§5). 320px~ 반응형 gutter(§4). 색 대비 토큰 준수(§6).
- 완료 기준: 토큰 유틸 클래스 사용 가능, 헤더가 스크롤 시 sticky, `next build`/`lint` 통과, 하드코딩 색상 없음.

### T2. [우선순위 2 · 기반] tmdb-client 모듈 + TMDB 응답 타입
- 모듈: tmdb-client
- 설명:
  - `server-only` 서버 전용 fetch 래퍼: `process.env.TMDB_API_KEY`, `language` 고정값, `include_adult` 파라미터 지원, revalidate 정책(목록 3600 / 상세 86400) 주입.
  - TypeScript 타입 정의: `Movie`, `MovieDetail`, `TVShow`, `TVDetail`, `Season`, `SeasonDetail`, `Episode`, `Person`, `PersonDetail`, `Credit`(cast/crew), `Genre`, `MultiSearchResult`(union: movie|tv|person), `Paginated<T>` 등. `any` 금지.
  - 함수(01_ARCHITECTURE §5.1): `getTrending()`, `getPopularMovies(page)`, `getPopularTv(page)`, `getMovie(id)`, `getMovieCredits(id)`, `getMovieRecommendations(id)`, `getTvShow(id)`, `getTvSeason(id, seasonNumber)`, `getPerson(id)`, `getPersonCombinedCredits(id)`, `searchMulti(query, page, includeAdult)`, `getGenres(type)`, `discoverByGenre(type, genreIds, page, includeAdult)`.
- 에러/엣지케이스 요구사항(§4):
  - 404를 상위에서 `notFound()`로 분기할 수 있도록 구분 가능한 형태로 반환/throw(예: 404 판별 플래그 또는 null).
  - 타임아웃/5xx/네트워크 에러는 throw(삼키지 않음, 로깅). 최상위 `Error`만으로 뭉개지 않기.
  - 429는 상태코드 보존(Route Handler 패스스루가 가능하도록). 자체 재시도 로직 없음.
- 완료 기준: 전 함수 타입 명시, 키가 클라이언트 번들에 포함되지 않음(`server-only` import), typecheck 통과. (실호출은 후속 태스크에서 페이지 통해 검증)

### T3. [우선순위 3 · 기반] 공통 UI 컴포넌트 + QueryProvider
- 모듈: ui
- 설명(03_DESIGN §2):
  - `QueryProvider`(TanStack Query client, `retry: 1` 기본 — §4 rate limit 정책) + RootLayout에 주입.
  - `PosterImage`/`BackdropImage`(next/image, blur, 종횡비 토큰, `alt` 필수, `null` path → 플레이스홀더), `ContentCard`(링크 카드, 포스터+제목 truncate+메타+RatingBadge, hover/focus/loading/no-image 상태, framer-motion `whileHover`/`whileTap`), `RatingBadge`, `Skeleton`(카드/텍스트 프리셋, shimmer), `ErrorState`(재시도 `Button`), `EmptyState`, `Button`(variant/size/상태), `PersonAvatar`, `Pill/Tag`.
- 에러/엣지케이스 요구사항: 데이터 결측 공통 규칙(§2.9) — 텍스트 없으면 대체 문구, 이미지 null → 플레이스홀더. 접근성(alt=작품명, 포커스 링, `aria-*`).
- 완료 기준: 각 컴포넌트 토큰만 사용, framer-motion 모션이 reduced-motion에서 opacity만, typecheck/lint 통과. (실사용 검증은 T4에서 통합)

### T4. [우선순위 4 · FR-1] 홈 화면 `/`
- 모듈: home
- 설명(03_DESIGN §3.1):
  - `/` Server Component에서 `tmdb-client` 직접 호출(`getTrending`, `getPopularMovies`, `getPopularTv`).
  - 히어로: 트렌딩 1건 `BackdropImage` + 보호 그라데이션 + `display` 타이틀 + CTA.
  - 캐러셀 섹션 반복("트렌딩"/"인기 영화"/"인기 TV") — `h2` 헤더 + 가로 스크롤 `ContentCard` 레일. 데스크톱 6~7장, 모바일 2.2장.
  - 각 카드는 `/movie/[id]` 또는 `/tv/[id]` 링크(미디어 타입 분기).
- 에러/엣지케이스 요구사항(§4): fetch 실패 시 세그먼트 `error.tsx`(reset 재시도) 제공. 데이터 결측(poster/backdrop null) 플레이스홀더. 리스트 빈 배열이면 해당 섹션 숨김.
- 완료 기준: 홈 렌더, 반응형 그리드/레일, 이미지 lazy+무CLS, 카드 클릭 시 상세 라우팅(상세 페이지는 이후 태스크라 404 허용 — 링크 경로 정확성만 확인), build/lint 통과.

### T5. [우선순위 5 · FR-2] 검색 Route Handler + useInfiniteQuery 훅
- 모듈: search (+ tmdb-client)
- 설명(01_ARCHITECTURE §5.3, §4):
  - `/api/search` Route Handler: query·page·includeAdult 파라미터 수신 → `tmdb-client.searchMulti` 호출 → 결과 반환. **키는 핸들러 내부에서만**.
  - `useSearchInfinite` 훅: TanStack Query `useInfiniteQuery`, `getNextPageParam`으로 페이지 증가, `retry: 1`.
- 에러/엣지케이스 요구사항(§4): TMDB 429/5xx 상태코드 **그대로 패스스루**(핸들러 재시도 없음). 빈 query 방어. 마지막 페이지에서 `getNextPageParam`이 `undefined` 반환(무한스크롤 정지).
- 완료 기준: 핸들러가 타입 안전한 JSON 반환, 응답 shape가 훅 타입과 일치, 429 패스스루 확인, 네트워크 탭에 키 미노출.

### T6. [우선순위 6 · FR-2] 검색 페이지 `/search` UI + 무한스크롤
- 모듈: search
- 설명(03_DESIGN §3.2):
  - 상단 고정 검색 입력(자동 포커스) + `AdultToggle` 자리(T13에서 기능 연결, 여기선 UI 배치). **제출(Enter) 시에만** 결과 갱신 — 실시간 자동완성 없음(§5.3).
  - 결과 **타입별 섹션 구분**(영화/TV/인물) 반응형 그리드. 인물은 `PersonAvatar`/전용 카드.
  - 무한스크롤: 하단 sentinel(IntersectionObserver) 도달 시 다음 페이지 로드, 로딩 시 `Skeleton` append.
- 에러/엣지케이스 요구사항(§4, §3.2): 초기(입력 전) `EmptyState`, 무결과 `EmptyState`("다른 키워드"), 에러 `ErrorState`. 마지막 페이지 도달 시 추가 UI 없이 스크롤 정지(안내 문구 없음). `aria-live`로 결과 변화 안내.
- 완료 기준: Enter 제출 흐름 동작, 타입별 섹션 렌더, 무한스크롤 append/정지, 로딩/빈/에러 상태 각각 노출, 카드→상세 링크 정확.

### T7. [우선순위 7 · FR-3] 영화 상세 `/movie/[id]`
- 모듈: detail
- 설명(03_DESIGN §3.3):
  - Server Component에서 `getMovie`/`getMovieCredits`/`getMovieRecommendations` 호출.
  - 히어로(백드롭+포스터 오버랩+`display` 제목·연도/러닝타임/장르 `Pill`·`RatingBadge`) → 줄거리 → 출연진 레일(`PersonAvatar` → `/person/[id]`) → 감독/제작진 → 추천/유사 레일(→ 작품 상세).
  - 모든 인물/연관작 링크 연결(탐색 흐름 PRD §2).
- 에러/엣지케이스 요구사항(§4): 존재하지 않는 id → `notFound()` + `not-found.tsx`(03_DESIGN §2.7, 전용 레이아웃). fetch 실패 → `error.tsx`. 데이터 결측: 텍스트 대체 문구(줄거리/러닝타임), 리스트 빈 배열이면 섹션 숨김, 이미지 null 플레이스홀더.
- 완료 기준: 상세 렌더, 출연진→인물·추천→작품 링크 동작, 없는 id에서 not-found, revalidate 86400 적용, build/lint 통과.

### T8. [우선순위 8 · FR-4] TV 상세 `/tv/[id]` 기본
- 모듈: detail
- 설명(03_DESIGN §3.4 히어로 부분):
  - `getTvShow` 기반 상세 — 히어로/개요/출연진 레일/추천 레일(영화 상세와 동일 패턴 재사용). 시즌/에피소드는 T9.
- 에러/엣지케이스 요구사항(§4): 없는 id → `notFound()`. fetch 실패 → `error.tsx`. 데이터 결측 규칙 동일.
- 완료 기준: TV 상세 히어로/개요/출연진/추천 렌더, 링크 동작, 없는 id not-found, build/lint 통과.

### T9. [우선순위 9 · FR-4] TV 시즌/에피소드 모듈
- 모듈: detail (+ tmdb-client, 선택적 Route Handler)
- 설명(03_DESIGN §3.4):
  - 시즌 선택(`FilterChip` 또는 셀렉트) → 해당 시즌 에피소드 목록(스틸 `16/9` + 번호·제목 + 방영일 + 개요 요약). 모바일 1열 / 데스크톱 2열.
  - 시즌 전환은 인터랙티브 → `/api/tv/[id]/season/[n]` Route Handler + `useQuery`로 온디맨드 로드(또는 서버에서 시즌 목록 프리페치 후 선택 시 개별 시즌만 fetch). ADR-0003에 따라 인터랙티브 페치는 Route Handler 경유.
- 에러/엣지케이스 요구사항(§4): 시즌/에피소드 결측(개요/스틸 null)은 대체 처리, 에피소드 빈 배열이면 해당 시즌 섹션 숨김. 시즌 fetch 실패 시 `ErrorState`. 429 패스스루.
- 완료 기준: 시즌 전환 시 에피소드 목록 갱신, 로딩/에러 상태, 반응형 열 수, 키 미노출, 응답 shape와 훅 타입 일치.

### T10. [우선순위 10 · FR-5] 인물 상세 `/person/[id]` + 필모그래피
- 모듈: detail
- 설명(03_DESIGN §3.5):
  - `getPerson` + `getPersonCombinedCredits`. 좌/상 프로필(`1/1`)+이름(`display`)+약력.
  - 필모그래피: 출연작/제작참여 토글 후 `ContentCard` 그리드, **최신순 정렬**, 각 카드 → 작품 상세(movie/tv 분기).
- 에러/엣지케이스 요구사항(§4): 없는 id → `notFound()`. fetch 실패 → `error.tsx`. 약력/프로필 결측 대체 처리, 크레딧 빈 배열이면 섹션 숨김.
- 완료 기준: 인물 상세 렌더, 필모→작품 링크(탐색 흐름 완결), 출연/제작 토글, 최신순 정렬, 없는 id not-found.

### T11. [우선순위 11 · FR-6] 장르 필터 UI + getGenres + discover Route Handler/훅
- 모듈: ui + search/detail (+ tmdb-client)
- 설명(03_DESIGN §2.5, §3.6):
  - `GenreFilter`/`FilterChip`(pill, default/selected, **다중 선택**, 색상+체크 아이콘 병행, `aria-pressed`). 데스크톱 wrap / 모바일 가로 스크롤.
  - `getGenres(type)`로 장르 목록 로드. `/api/discover` Route Handler(type·genreIds·page·includeAdult) + `useInfiniteQuery` 훅(T5 무한스크롤 패턴 재사용).
- 에러/엣지케이스 요구사항(§4): 429/5xx 패스스루, 마지막 페이지 정지, 결과 없음 `EmptyState`. 장르 선택 0개일 때 기본 동작 정의.
- 완료 기준: 장르 다중 선택 → 결과 그리드 갱신 + 무한스크롤, 칩 접근성(aria-pressed+아이콘), 키 미노출.

### T12. [우선순위 12 · FR-6] 장르 탐색 화면 조립
- 모듈: detail/search (라우트)
- 설명(03_DESIGN §3.6): 전용 탐색 화면(예: `/discover` 또는 `/genre`) 또는 홈/검색 상단 `GenreFilter` 스트립에 T11 요소 통합. 선택 상태 URL 동기화(공유 가능·새로고침 유지) 권장.
- 에러/엣지케이스 요구사항(§4): 로딩 `Skeleton`, 에러 `ErrorState`, 무결과 `EmptyState`.
- 완료 기준: 화면에서 장르 선택→그리드→무한스크롤 end-to-end 동작, 반응형(§4 그리드 열 수), build/lint 통과.
- 비고: T11과 결합도가 높아 implementer 판단으로 T11에 병합 가능(그 경우 T12는 통합 검증만).

### T13. [우선순위 13 · FR-7] 성인 콘텐츠 토글 `AdultToggle` + include_adult 배선
- 모듈: ui + search/detail
- 설명(03_DESIGN §2.4, 01_ARCHITECTURE §9):
  - `AdultToggle`(pill 스위치, `role="switch"`+`aria-checked`+텍스트 라벨, OFF=`success` 도트 기본/ON=`danger` 강조).
  - 토글 상태 공유(경계선 후보 결정: React Context + URL searchParams 동기화). 상태를 검색(T5/T6)·디스커버(T11/T12) 요청의 `include_adult`로 전달. 헤더(T1 placeholder)와 검색 페이지(T6 자리)의 토글을 실제 기능에 연결.
  - `include_adult`는 **서버사이드/Route Handler에서 적용**(§9).
- 에러/엣지케이스 요구사항(§4): 토글 변경 시 진행 중 쿼리 무효화/재요청, 상태 전환 애니메이션 reduced-motion 대응.
- 완료 기준: 토글 ON/OFF가 검색·디스커버 결과에 반영, `aria-checked` 정확, 새로고침/URL 공유 시 상태 유지, 키 미노출.

### T14. [우선순위 14 · NFR 마감] 로딩/에러 경계 · 접근성 · 성능 하드닝 (선택)
- 모듈: 전역
- 설명: 세그먼트별 `loading.tsx`/`error.tsx`/`not-found.tsx` 누락분 보강, 랜드마크·h 계층·`aria-live`·포커스 링 점검, Lighthouse(Perf 90+/A11y 90+/BP 90+/SEO 80+) 확인 및 개선(§6, NFR-1·3·4).
- 에러/엣지케이스 요구사항: §4 전 항목 최종 점검.
- 완료 기준: 각 라우트 로딩/에러/notFound 경계 완비, Lighthouse 목표 달성.
- 비고: 각 FR 태스크에서 관련 경계를 이미 만들므로 T14는 통합 QA·잔여 보강 성격. 필요 없으면 생략 가능.

---

## QA 공유용 태스크별 완료 기준 요약

| 태스크 | 핵심 검증 포인트 |
|--------|------------------|
| T1 | 토큰 매핑·sticky 헤더·이미지 remotePatterns·하드코딩 색 없음·build |
| T2 | TMDB 타입 완비·키 서버 전용·404/429/5xx 처리 구분·typecheck |
| T3 | UI 컴포넌트 토큰만 사용·결측 플레이스홀더·reduced-motion·접근성 |
| T4 | 홈 히어로/캐러셀·반응형·lazy 이미지·카드 링크·error.tsx |
| T5 | /api/search 응답 shape=훅 타입·429 패스스루·키 미노출·마지막페이지 undefined |
| T6 | Enter 제출·타입별 섹션·무한스크롤 append/정지·빈/에러/초기 상태·aria-live |
| T7 | 영화상세 렌더·출연진→인물·추천→작품 링크·없는 id notFound·결측 규칙 |
| T8 | TV상세 히어로/개요/출연진/추천·없는 id notFound |
| T9 | 시즌 전환→에피소드 갱신·로딩/에러·반응형 열·응답 shape 일치·키 미노출 |
| T10 | 인물상세·필모→작품 링크·출연/제작 토글·최신순·없는 id notFound |
| T11 | 장르 다중선택→그리드 갱신·무한스크롤·칩 aria-pressed+아이콘·키 미노출 |
| T12 | 장르 탐색 화면 end-to-end·반응형 그리드 |
| T13 | 토글이 검색/디스커버 include_adult 반영·aria-checked·상태 유지·키 미노출 |
| T14 | 라우트 경계 완비·Lighthouse 목표 |
