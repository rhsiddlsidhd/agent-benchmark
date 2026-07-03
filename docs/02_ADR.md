# ADR (Architecture Decision Records)

> 형식: Nygard-style short-form (single-file log)
> 새 결정 추가 시 아래 "Log" 최상단에 다음 번호로 항목 추가 (역순 정렬, 최신이 위)

---

## 필드 가이드

| 필드 | 내용 |
|------|------|
| Context | 왜 이 결정 필요한가, 어떤 문제 상황인가 |
| Decision | 무엇을 결정했나, 왜 이걸 선택했나 |
| Consequences | 이 결정으로 무엇이 바뀌는가 (트레이드오프, 후속 작업, 리스크 포함) |

---

## Index

| ID | 제목 | 상태 | 날짜 |
|----|------|------|------|
| ADR-0003 | TMDB API 키 서버사이드 은닉 전략 | Accepted | 2026-07-03 |
| ADR-0002 | 영속 데이터베이스 미사용 | Accepted | 2026-07-03 |
| ADR-0001 | Next.js App Router 채택 | Accepted | 2026-07-03 |

---

## Log

### ADR-0003: TMDB API 키 서버사이드 은닉 전략

> 상태: Accepted
> 날짜: 2026-07-03

**Context**

TMDB API는 모든 요청에 API 키가 필요하다. 클라이언트 번들에 키가 포함되면 누구나 브라우저에서 키를 탈취해 무료 티어 rate limit을 소진시키거나 남용할 수 있다 (PRD NFR-2).

**Decision**

API 키는 Vercel 환경변수(`TMDB_API_KEY`)로만 관리하고, Server Component와 Route Handler(`/api/*`) 내부에서만 `process.env`로 접근한다. 클라이언트 컴포넌트는 TMDB를 직접 호출하지 않고, 인터랙티브 기능(검색/무한스크롤)은 반드시 자체 Route Handler를 경유한다.

**Consequences**

- 클라이언트 코드/네트워크 탭 어디에서도 API 키가 노출되지 않는다
- 인터랙티브 기능은 TMDB 직접 호출보다 한 홉(Route Handler) 더 거쳐 약간의 지연이 생긴다 — fetch cache로 상쇄
- 모든 TMDB 호출 로직은 `tmdb-client` 모듈에 집중되어 키 접근 지점이 하나로 고정된다

---

### ADR-0002: 영속 데이터베이스 미사용

> 상태: Accepted
> 날짜: 2026-07-03

**Context**

PRD에서 로그인/찜하기/리뷰 등 개인화 기능을 Non-Goals로 확정했다. 앱의 모든 콘텐츠 데이터는 TMDB API에서만 제공되며, 사용자별로 영속시켜야 할 데이터가 없다.

**Decision**

DB(SQL/NoSQL)를 도입하지 않는다. TMDB API를 유일한 데이터 소스로 사용하고, 캐싱은 Next.js fetch cache(revalidate)로만 처리한다.

**Consequences**

- 인프라 구성이 단순해지고 배포/운영 부담이 없다 (Vercel 서버리스만으로 충분)
- 향후 찜/리뷰 등 개인화 기능을 추가하려면 DB 도입 + 인증 체계까지 함께 재설계해야 한다 — 현재 스코프 밖이므로 수용
- 캐싱이 fetch cache에 의존하므로 TMDB rate limit에 여전히 노출됨 (완화책: revalidate 주기 설정)

---

### ADR-0001: Next.js App Router 채택

> 상태: Accepted
> 날짜: 2026-07-03

**Context**

TMDB API 키를 클라이언트에 노출하지 않아야 하고(NFR-2), 반응형·성능(NFR-1) 요구도 있다. 프레임워크 후보는 Next.js(App Router), Next.js(Pages Router), 순수 React SPA + 별도 프록시 서버였다.

**Decision**

Next.js App Router를 채택한다. Server Component에서 TMDB API를 직접 호출해 키를 서버사이드에 은닉하고, `next/image`로 이미지 최적화(lazy loading)를 기본 확보한다. 순수 SPA 방식은 별도 프록시 서버가 필요해 인프라가 늘어나므로 배제했다.

**Consequences**

- 별도 백엔드 서버 없이 API 키 은닉과 이미지 최적화를 동시에 확보
- Pages Router 대비 App Router의 러닝커브가 있으나, 학습 목적 프로젝트라 오히려 목표에 부합
- Server/Client Component 경계를 명확히 나눠야 하는 설계 부담이 생김 (검색/무한스크롤은 Client Component + Route Handler로 분리)

---
