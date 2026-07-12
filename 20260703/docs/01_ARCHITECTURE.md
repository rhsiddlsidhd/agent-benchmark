# Architecture Document

> 상태: Draft
> 작성자:
> 작성일:
> 최종 수정일: 2026-07-12
> 관련 문서: [00_PRD.md](./00_PRD.md)

---

## 필드 가이드

| 섹션 | 내용 |
|------|------|
| 개요 | 시스템이 무엇을 하는가 (한두 문단 요약) |
| 목표 및 제약 | 아키텍처가 만족해야 할 목표(성능/확장성/보안 등), 제약조건(기술 스택, 인프라, 팀 역량 등) |
| 시스템 컨텍스트 | 외부 시스템/서비스와의 관계 (C4 Context Level) |
| 전체 구조 | 주요 컴포넌트 및 책임 (C4 Container Level) |
| 모듈/서비스 상세 | 각 모듈/서비스의 책임 / 인터페이스 / 의존성 |
| 데이터 모델 | 주요 엔티티 및 관계 (ERD) |
| 배포 아키텍처 | 배포 환경, CI/CD 파이프라인 |
| 보안 고려사항 | 인증/인가, 데이터 보호, 취약점 대응 |
| 확장성 및 성능 | 병목 지점, 확장 전략 |
| 리스크 및 트레이드오프 | 주요 아키텍처 결정에 따른 트레이드오프 (상세 근거는 [02_ADR](./02_ADR.md) 참고) |

---

## 1. 개요 (Overview)

TMDB API 기반 영화·TV 탐색 웹앱. 콘텐츠 → 출연진/감독 → 다른 작품으로 이어지는 탐색 흐름을 Next.js App Router 기반 SPA/SSR 하이브리드로 구현한다. 실사용 서비스가 아닌 학습/포트폴리오 목적이며, 인증·개인화·DB 없이 TMDB API를 유일한 데이터 소스로 사용한다.

## 2. 목표 및 제약 (Goals & Constraints)

**목표**
- TMDB API 키를 클라이언트에 노출하지 않는다 (NFR-2)
- Lighthouse Performance/Accessibility/Best Practices 90+, SEO 80+ (NFR-1, NFR-4)
- 모바일·데스크톱 반응형 (NFR-3)

**제약**
- 1인 개발, 명시적 마감 없음
- TMDB API 무료 티어 rate limit 준수
- DB 없음 (로그인/찜/리뷰 Non-Goals이므로 영속 저장소 불필요)

## 3. 시스템 컨텍스트 (System Context)

```
[사용자 브라우저]
      │
      ▼
[Next.js App (Vercel)]
      │             │
      ▼             ▼
[TMDB REST API]  [TMDB Image CDN: image.tmdb.org]
```

## 4. 전체 구조 (High-Level Architecture)

```
Server Components ──▶ tmdb-client (서버 전용, TMDB_API_KEY는 env에서만 접근)
      │                     │
      │                     ▼
      │                 TMDB REST API
      ▼
Client Components (검색/무한스크롤)
      │
      ▼
TanStack Query ──▶ /api/* Route Handler ──▶ tmdb-client ──▶ TMDB REST API
```

- 홈/상세 페이지: Server Component에서 직접 `tmdb-client` 호출, fetch revalidate로 캐싱
- 검색/무한스크롤: Client Component + TanStack Query가 Route Handler(`/api/*`) 경유 (API 키는 Route Handler 안에서만 사용)
- 홈 히어로 캐러셀처럼 자동전환 등 인터랙션이 필요한 하위 컴포넌트는 Client Component로 분리하되, 데이터 페칭 자체는 상위 Server Component가 그대로 담당하고 결과만 props로 전달한다(API 키 서버사이드 은닉 원칙은 유지)
- TV 상세 시즌/에피소드처럼 뷰포트 폭에 따라 서로 다른 하위 컴포넌트를 렌더해야 하는 경우, 라우트 전용 `useMediaQuery` 훅으로 분기하고 마운트 전(SSR/최초 페인트)엔 스켈레톤으로 처리한다 — 하이드레이션 시점의 깜빡임을 감수하는 대신 서버/클라이언트 렌더 불일치를 피하는 쪽을 택함

### 에러/엣지케이스 처리 정책

- **존재하지 않는 id** (`/movie/[id]`, `/tv/[id]`, `/person/[id]`): TMDB 404 응답 시 `notFound()` 호출 → App Router 표준 `not-found.tsx`
- **TMDB fetch 실패** (타임아웃/5xx/네트워크 에러): 라우트 세그먼트별 `error.tsx`(Error Boundary), `reset()` 재시도 버튼 기본 제공. 별도 커스텀 에러 레이어 없음
- **TMDB rate limit(429)**: Route Handler는 상태코드를 그대로 클라이언트에 패스스루(재시도 로직 없음). TanStack Query는 `retry: 1`만 설정, 최종 실패 시 `ErrorState` UI 노출
- **데이터 결측** (poster/overview/release_date/cast 등 null 또는 빈 배열): 텍스트 필드는 대체 문구로 표시, 리스트형 필드가 비어있으면 해당 섹션 자체를 숨김
- **무한스크롤 마지막 페이지**: 추가 로딩 UI 없이 스크롤이 조용히 멈춤 (별도 안내 텍스트 없음)

## 5. 모듈/서비스 상세 (Module/Service Details)

### 5.1 tmdb-client
- 책임: TMDB API 호출 캡슐화, 응답 타입 정의, revalidate 정책 적용
- 인터페이스: `getPopularKrDramas()`, `getPopularKrVariety()`, `getPopularKrMovies()`, `getHeroCarouselItems()`, `getMovie(id)`, `getTvShow(id)`, `getPerson(id)`, `searchMulti(query)`, `getGenres(type)` 등
- 의존성: TMDB REST API, `process.env.TMDB_API_KEY`

### 5.2 home
- 책임: 히어로 캐러셀(트렌딩 기반 자동전환) + 인기 세션(드라마/예능/영화) 3종 렌더 (FR-1)
- 인터페이스: `/` 페이지 (Server Component, 데이터 페칭) + `HeroCarousel`(Client Component, 자동전환 인터랙션)
- 의존성: tmdb-client, ui(`ScrollRail`, `useDragScroll`)

### 5.3 search
- 책임: 통합 검색(영화/TV/인물) + 무한스크롤 (FR-2). 검색은 제출(Enter) 시에만 `/search` 결과가 갱신되며, 실시간 자동완성 드롭다운은 제공하지 않는다
- 인터페이스: `/search` 페이지, `/api/search` Route Handler
- 의존성: tmdb-client, TanStack Query, ui

### 5.4 detail
- 책임: 영화/TV/인물 상세 + 연관 탐색 링크(출연진→인물, 필모그래피→작품) (FR-3, FR-4, FR-5)
- 인터페이스: `/movie/[id]`, `/tv/[id]`, `/person/[id]` 페이지. TV 상세 회차 선택은 `md` 뷰포트 기준으로 가로 필름스트립(모바일, `ScrollRail` 재사용)/세로 리스트(데스크톱, 백드롭과 2열)로 분기 렌더하며, 시즌탭·회차선택 전체에 roving tabindex(화살표 키 네비, 라우트 전용 `useRovingTabIndex` 훅) 공유 적용
- 의존성: tmdb-client, ui

### 5.5 ui
- 책임: 공통 컴포넌트(카드, 이미지, 필터/토글, 애니메이션 래퍼, 드래그 스크롤 레일) — 디자인 토큰은 [03_DESIGN.md](./03_DESIGN.md) 참조
- 인터페이스: `<ContentCard>`(성인 콘텐츠 카드 단위 19+ 블러 게이트 담당, FR-7), `<PosterImage>`, `<GenreFilter>`, `<ScrollRail>`(내부적으로 `useDragScroll` 훅 사용, 홈 캐러셀 3종 + movie/tv 상세 레일 공용) 등
- 의존성: Tailwind CSS, framer-motion

## 6. 데이터 모델 (Data Model)

DB 없음 — TMDB API 응답 기반 TypeScript 타입으로 대체. 핵심 엔티티 및 관계:

- **Movie** ↔ **Person** (cast/crew, 다대다)
- **TVShow** ↔ **Season** ↔ **Episode** (1:N, 1:N)
- **TVShow** ↔ **Person** (cast/crew, 다대다)
- **Movie/TVShow** ↔ **Genre** (다대다)
- **Person** ↔ **Movie/TVShow** (필모그래피, 다대다 — cast/crew 관계의 역방향)

## 7. 기술 스택 (Tech Stack)

> Design 토큰(색상/타이포/spacing 등) 및 UI 컴포넌트 라이브러리 선정은 [03_DESIGN.md](./03_DESIGN.md) 담당. 여기선 기술 선택(프레임워크/언어/인프라)만 기록.

| 영역 | 기술 | 선택 이유 |
|------|------|-----------|
| Frontend | Next.js (App Router), TypeScript | Server Component로 API 키 서버사이드 은닉, 최신 표준 스택 |
| 데이터 페칭 | TanStack Query | 검색/무한스크롤 캐싱·상태관리 |
| 스타일링 | Tailwind CSS | 03_DESIGN 토큰과 config 매핑 용이 |
| 애니메이션 | framer-motion | 탐색 흐름 전환/인터랙션 애니메이션 |
| Backend | Next.js Route Handler (`/api/*`) | 별도 서버 없이 API 키 은닉 겸 클라이언트 인터랙션 프록시 |
| Database | 없음 | 로그인/찜/리뷰 Non-Goals — 영속 저장소 불필요 |
| Infra | Vercel | Next.js 네이티브 지원, 무료 티어로 충분 |

## 8. 배포 아키텍처 (Deployment)

- Vercel에 Next.js 앱 배포, `TMDB_API_KEY`는 Vercel 환경변수로 관리 (Server Component/Route Handler에서만 `process.env`로 접근, 클라이언트 번들 미포함)
- 캐싱: 목록류(홈/트렌딩/장르) `revalidate: 3600`(1시간), 상세 페이지(영화/TV/인물) `revalidate: 86400`(1일)
- 별도 CI/CD 파이프라인 없음 — Vercel Git 연동 자동 배포로 대체

## 9. 보안 고려사항 (Security Considerations)

- TMDB API 키는 Server Component/Route Handler 내부에서만 사용, 클라이언트에 절대 노출 안 함 (NFR-2)
- 인증/인가 없음 (로그인 기능 자체가 Non-Goal)
- 성인 콘텐츠(FR-7)는 TMDB `include_adult` 파라미터를 상시 true로 고정해 항상 페칭하고, 서버사이드 필터링 없이 클라이언트에서 카드 단위 19+ 블러 게이트를 적용 — 상세는 [ADR-0005](./02_ADR.md)
- XSS: TMDB 응답 텍스트(줄거리/제목 등)는 외부 입력으로 취급하되, React/Next.js의 기본 JSX 자동 이스케이프에 의존한다. `dangerouslySetInnerHTML`은 사용하지 않는다
- **알려진 리스크 (수용, 미방어)**: `/api/*` Route Handler는 공개 엔드포인트라 우리 앱을 거치지 않고도 누구나 직접 호출할 수 있다. 내부적으로 `TMDB_API_KEY`를 사용해 TMDB를 대신 호출하므로, 이론적으로 제3자가 우리 키의 rate limit을 소진시키는 오픈 프록시로 악용 가능하다. 본 프로젝트는 학습/포트폴리오 스코프이므로 별도 rate limiting 인프라를 도입하지 않고 리스크로 수용한다 — 근거와 재검토 조건은 [ADR-0004](./02_ADR.md)에 기록

## 10. 확장성 및 성능 (Scalability & Performance)

- 이미지: `next/image` + TMDB Image CDN으로 lazy loading (NFR-1)
- 리스트: TanStack Query `useInfiniteQuery`로 무한스크롤 (NFR-1)
- API 응답: Next.js fetch cache(revalidate)로 재요청 최소화, TMDB rate limit 리스크 완화 (NFR-1)
- 별도 수평 확장 불필요 (실사용 트래픽 없음, Vercel 서버리스로 자동 스케일)

## 11. 리스크 및 트레이드오프 (Risks & Trade-offs)

- **TMDB rate limit**: fetch cache로 완화하나 트래픽 급증 시 여전히 취약 — 실사용 서비스 아니므로 수용
- **DB 없음**: 향후 찜/리뷰 등 개인화 기능 확장 시 아키텍처 재설계 필요 — 현재 스코프에선 Non-Goal이라 수용
- **App Router 학습 곡선**: Pages Router 대비 러닝커브 있으나, 학습 목적 프로젝트이므로 오히려 목표에 부합
- **Route Handler 오픈 프록시 리스크**: `/api/*`가 공개 엔드포인트라 제3자가 우리 TMDB 키의 rate limit을 소진시킬 수 있음. 배포 후 면접관 등 외부인이 실제로 볼 프로젝트이지만, rate limiting 인프라 도입은 현재 스코프에서 과함 — 리스크로 수용, 방어 미적용 ([ADR-0004](./02_ADR.md))

## 12. 참고자료 (References)

- TMDB API 공식 문서: https://developer.themoviedb.org/docs

