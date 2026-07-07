---
name: tmdb-feature-implementer
description: "TMDB 탐색 웹앱(Next.js App Router)의 기능을 구현할 때 사용 — Route Handler, TanStack Query 훅, UI 컴포넌트(framer-motion, Tailwind 디자인 토큰)를 만든다. '~ 페이지 구현해줘', '~ API 붙여줘', '컴포넌트 만들어줘' 등 이 프로젝트 src/ 코드 작성 요청에 반드시 사용. 이 프로젝트의 Next.js는 학습 데이터와 다른 버전이라 코드 작성 전 필독 규칙이 있다(아래 0번 참조)."
---

# TMDB Feature Implementer

## 0. 코드 작성 전 필독 (건너뛰지 말 것)

`AGENTS.md` 최상단 경고: "이 Next.js는 학습 데이터의 관례와 다르다." 코드를 쓰기 전에 `node_modules/next/dist/docs/`에서 관련 가이드(routing, data-fetching, route-handlers 등 작업 범위에 맞는 문서)를 먼저 확인한다. 확인 없이 익숙한 패턴으로 쓰면 존재하지 않는 API를 부르거나 deprecated된 방식을 쓸 위험이 크다 — 이 프로젝트에서 가장 흔한 실패 원인이다.

## 1. 어디에 뭘 쓰는지 — 모듈 구조

`01_ARCHITECTURE.md §4, §5` 기준:

| 경로 | 방식 | 데이터 소스 |
|------|------|------------|
| 홈(`/`), 상세(`/movie/[id]`, `/tv/[id]`, `/person/[id]`) | Server Component | `tmdb-client`를 직접 호출 (fetch revalidate 캐싱) |
| 검색(`/search`), 무한스크롤 | Client Component + TanStack Query | `/api/*` Route Handler 경유 |

**판단 기준**: 사용자 인터랙션(입력값에 따라 즉시 재요청)이 필요하면 Client Component + Route Handler, 아니면 Server Component 직접 호출. API 키는 Route Handler와 Server Component 안에서만 `process.env.TMDB_API_KEY`로 접근한다(ADR-0003) — Client Component가 TMDB를 직접 부르는 코드는 그 자체로 REDO 대상이다.

## 2. Route Handler 패턴

- 모든 TMDB 호출은 `tmdb-client` 모듈의 함수를 거친다. Route Handler에서 TMDB REST API를 직접 fetch하지 않는다 — 키 접근 지점을 하나로 고정하기 위함(ADR-0003 Consequences).
- 429 응답은 그대로 클라이언트에 패스스루한다. 자체 재시도 로직을 Route Handler에 넣지 않는다(ADR-0004 — rate limiting 인프라 없음을 리스크로 수용한 결정과 상충되므로).
- 응답 shape은 프론트 훅이 기대하는 타입과 미리 맞춘다 — 이후 QA가 이 shape과 훅 타입을 교차 비교한다.

## 3. TanStack Query 훅 패턴

- 검색/무한스크롤은 `useInfiniteQuery` 사용.
- 429/5xx 등 실패 시 `retry: 1`만 설정한다. 그 이상 재시도하면 TMDB rate limit을 앱이 스스로 악화시킨다.
- 최종 실패 시 `ErrorState` UI를 노출한다(별도 커스텀 재시도 루프 없음).
- 훅의 제네릭 타입은 Route Handler 응답 shape과 정확히 일치시킨다. 응답이 `{ items: [...] }`처럼 래핑되어 있으면 훅에서 unwrap하고, 컴포넌트는 배열을 직접 받는다.

## 4. UI 컴포넌트 패턴

- 색상/타이포/spacing/radius는 반드시 `03_DESIGN.md` 토큰만 쓴다. 임의 hex값이나 arbitrary value(`w-[173px]` 류)를 새로 만들지 않는다. 필요한 토큰이 없으면 만들어내지 말고 Planner에게 보고한다.
- 인터랙션 모션(hover, 페이지 전환, 카드 등장)은 framer-motion으로 구현한다.
- 공용 UI 컴포넌트(`ContentCard`, `PosterImage`, `AdultToggle`, `GenreFilter` 등)는 `ui` 모듈 책임이므로, 이미 있는 컴포넌트가 있는지 먼저 확인하고 재사용한다.
- 이미지는 `next/image` + TMDB Image CDN, lazy loading 기본값을 그대로 쓴다.

## 5. 에러/엣지케이스 처리 — 태스크마다 확인

`01_ARCHITECTURE.md §4`에 정의된 정책. Planner 태스크에 명시된 항목만 구현하면 되지만, 아래 표는 누락 방지용 전체 목록이다.

| 상황 | 처리 |
|------|------|
| 존재하지 않는 id (`/movie/[id]` 등) | TMDB 404 → `notFound()` 호출 → `not-found.tsx` |
| TMDB fetch 실패(타임아웃/5xx/네트워크) | 라우트 세그먼트 `error.tsx`(Error Boundary), `reset()` 재시도 버튼 |
| TMDB 429 | Route Handler 패스스루, `useQuery`는 `retry: 1`만 |
| 데이터 결측(poster/overview/release_date/cast 등 null/빈 배열) | 텍스트 필드는 대체 문구, 리스트형 필드가 비면 해당 섹션 자체를 숨김 |
| 무한스크롤 마지막 페이지 | 추가 로딩 UI 없이 조용히 정지, 안내 텍스트 없음 |

## 6. 캐싱

- 목록류(홈/트렌딩/장르): `revalidate: 3600`
- 상세 페이지(영화/TV/인물): `revalidate: 86400`

## 7. 완료 시 산출물

`_workspace/02_implementer_{task-id}.md`에 변경 파일 목록, API 응답 shape(있다면), 훅 제네릭 타입(있다면), 반영한 에러/엣지케이스 항목을 기록한다. QA가 이 파일과 실제 코드를 함께 읽고 교차 검증한다.
