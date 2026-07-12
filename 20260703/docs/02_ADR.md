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
| ADR-0005 | 성인 콘텐츠: 서버사이드 필터 토글 → 상시 페칭 + 클라이언트 카드 게이트 전환 | Accepted | 2026-07-12 |
| ADR-0004 | Route Handler 오남용 리스크 수용 (Rate Limiting 미적용) | Accepted | 2026-07-05 |
| ADR-0003 | TMDB API 키 서버사이드 은닉 전략 | Accepted | 2026-07-03 |
| ADR-0002 | 영속 데이터베이스 미사용 | Accepted | 2026-07-03 |
| ADR-0001 | Next.js App Router 채택 | Accepted | 2026-07-03 |

---

## Log

### ADR-0005: 성인 콘텐츠: 서버사이드 필터 토글 → 상시 페칭 + 클라이언트 카드 게이트 전환

> 상태: Accepted
> 날짜: 2026-07-12

**Context**

기존(FR-7)은 `include_adult` 전역 토글(`AdultContentContext`/`AdultToggle`)로 성인물을 서버사이드에서 필터링해 기본적으로 노출하지 않는 방식이었다. 이 방식은 (1) Context/Toggle/훅/라우트 파라미터로 이어지는 플러밍이 여러 계층에 걸쳐 있어 구조가 무겁고, (2) 토글 하나로 전체 목록의 노출 여부가 결정돼 콘텐츠별 세밀한 제어가 불가능했다. 또한 TMDB `adult` 필드 자체의 커버리지를 실제 API로 직접 조회해 검증한 결과, 노골적 성인물(주로 성인 애니메이션류) 마커일 뿐이고 한국 기준 19금 등급 드라마/예능(선정성·폭력성 사유로 청소년 관람불가 판정된 작품)은 이 필드로 걸러지지 않는다는 갭이 확인됐다.

**Decision**

성인 콘텐츠는 `include_adult: true`로 고정해 항상 페칭하고, 서버사이드 필터링을 제거한다. 대신 각 카드(`ContentCard`)에서 `adult` 플래그를 받아 카드 단위로 19+ 블러 게이트를 렌더하고, 사용자가 클릭-투-리빌해야 실제 콘텐츠가 노출되게 한다. `AdultContentContext`/`AdultToggle`과 관련 훅 파라미터(`includeAdult`)는 전부 제거한다.

**알려진 한계**

TMDB `adult` 필드는 노골적 성인물(주로 성인 애니메이션류)의 마커일 뿐이며, 한국 기준 19금 등급으로 분류되는 드라마/예능(선정성·폭력성 등의 사유)은 이 필드로 커버되지 않는다. 즉 카드 게이트가 걸리지 않는 국내 19금 콘텐츠가 존재할 수 있다. 이 갭은 TMDB API를 직접 조회해 검증됐고, 본 프로젝트 스코프(학습/포트폴리오)에서는 별도의 등급 데이터 소스를 추가로 통합하지 않고 사용자가 인지한 상태로 리스크를 수용한다.

**Consequences**

- Context/Toggle/훅 파라미터/라우트 쿼리 파라미터로 이어지던 `include_adult` 플러밍이 전부 제거되어 구조가 단순해진다
- 성인물 게이트가 카드 단위로 세밀해져, 전역 on/off가 아니라 콘텐츠별로 블러 해제 여부를 결정할 수 있다
- TMDB `adult` 필드 커버리지 갭(위 "알려진 한계")으로 인해 일부 국내 19금 콘텐츠는 게이트 없이 그대로 노출될 수 있음 — 별도 등급 데이터 연동 없이는 근본 해결 불가, 현재 스코프에서는 리스크로 수용
- `src/context/AdultContentContext.tsx`, `src/components/ui/AdultToggle.tsx` 삭제로 관련 코드-리포 문서(Gotchas)도 함께 정리 필요

---

### ADR-0004: Route Handler 오남용 리스크 수용 (Rate Limiting 미적용)

> 상태: Accepted
> 날짜: 2026-07-05

**Context**

`/api/*` Route Handler(검색·무한스크롤용)는 공개 엔드포인트라 우리 앱 UI를 거치지 않고도 누구나 직접 호출할 수 있다. 내부적으로 `TMDB_API_KEY`(ADR-0003)를 사용해 TMDB를 대신 호출하므로, 제3자가 이를 "키 없는 TMDB 프록시"로 남용해 우리 키의 rate limit을 소진시킬 수 있다. Next.js 공식 문서(`data-security.mdx`, `backend-for-frontend.mdx`)도 이런 엔드포인트에 rate limiting 적용을 권고한다. 본 프로젝트는 실사용 서비스는 아니지만 배포되어 면접관 등 외부인이 실제로 접근할 수 있다.

**Decision**

Upstash Redis 등 별도 rate limiting 인프라는 도입하지 않는다. 대신 이 리스크를 명시적으로 문서화하고, TMDB의 429 응답을 그대로 패스스루하는 최소한의 처리만 유지한다([01_ARCHITECTURE.md §9, §11] 참고).

**Consequences**

- 별도 인프라(Redis 계정, 카운터 로직) 없이 스코프를 단순하게 유지
- 오남용 시 TMDB 키의 rate limit이 실제로 소진될 수 있고, 그 경우 정상 사용자도 일시적으로 검색/무한스크롤이 실패할 수 있음 — 학습용 프로젝트 특성상 실제 발생 확률과 파급力은 낮다고 판단해 수용
- 트래픽이 실제로 늘거나 실서비스로 전환할 경우, Upstash Redis + `@upstash/ratelimit`(IP당 sliding window) 도입을 재검토한다 — 그 시점에 새 ADR로 대체(Superseded)

---

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
