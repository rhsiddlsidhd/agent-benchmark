# ADR (Architecture Decision Records)

> 형식: Nygard-style short-form (single-file log)
> 새 결정 추가 시 아래 "Log" 최상단에 다음 번호로 항목 추가 (역순 정렬, 최신이 위)
> 아래 항목은 README.md 트러블슈팅 섹션 및 GEMINI.md 컨벤션을 근거로 재구성함 — 원 문서에 날짜 기재 없음

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
| ADR-0005 | 전역 상태(Zustand)와 지역 상태(Context API) 분리 원칙 | Accepted | |
| ADR-0004 | 서버 상태 캐싱 라이브러리로 SWR 채택 | Accepted | |
| ADR-0003 | 날짜 포맷 timezone 명시적 고정 (date-fns-tz) | Accepted | |
| ADR-0002 | 이미지 업로드를 클라이언트→Cloudinary 직접 업로드로 전환 | Accepted | |
| ADR-0001 | 쿠키 기반 리다이렉트 로직을 Middleware로 이관 | Accepted | |

---

## Log

### ADR-0001: 쿠키 기반 리다이렉트 로직을 Middleware로 이관

> 상태: Accepted
> 날짜:

**Context**

Root Layout에서 쿠키 존재 여부를 확인함에 따라, 정적으로 생성되어야 할 페이지들이 강제로 SSR로 전환되는 구조적 결함이 있었다. 모든 요청이 서버 런타임 연산을 거치며 응답 경로가 길어지는 성능 병목이 발생했다.

**Decision**

레이아웃에서 수행하던 쿠키 기반 리다이렉트 로직을 `middleware.ts`로 이관해 SSR 의존성을 제거했다. 클라이언트 단에서 쿠키 확인이 필요한 동적 컴포넌트는 별도 API 호출 방식으로 전환하고, `useSearchParams`를 사용하는 컴포넌트는 `Suspense`로 감싸 Dynamic 환경이 상위로 전파되는 것을 억제했다.

**Consequences**

- Static 페이지 생성이 보존되어 빌드 시 미리 생성된 최적화 자산을 즉시 제공, TTFB 개선 및 서버 부하 최소화.
- 책임이 미들웨어와 클라이언트 컴포넌트로 분리되어 구조적 무결성 확보.

---

### ADR-0002: 이미지 업로드를 클라이언트→Cloudinary 직접 업로드로 전환

> 상태: Accepted
> 날짜:

**Context**

초기 설계는 Next.js API 서버에서 `fs` 모듈로 로컬에 이미지를 저장하는 방식이었으나, Server Action의 `bodySizeLimit` 1MB 제한에 걸려 업로드가 실패했다.

**Decision**

서버를 거치지 않고 클라이언트에서 직접 Cloudinary로 업로드하도록 변경했다. 클라이언트는 Cloudinary로부터 받은 이미지 URL을 서버 API에 전달하고, 서버는 해당 문자열만 DB에 저장한다.

**Consequences**

- 서버 1MB 제한 문제를 근본적으로 해결, 대용량 바이너리 처리를 외부 인프라(Cloudinary)로 위임해 서버 부하 감소.
- Cloudinary CDN을 통해 이미지 서빙 속도(TTFB) 개선.
- `CloudImage` 커스텀 컴포넌트에서 브라우저 환경에 맞는 최적화 포맷/리사이징을 서빙해 LCP 성능 향상.

---

### ADR-0003: 날짜 포맷 timezone 명시적 고정 (date-fns-tz)

> 상태: Accepted
> 날짜:

**Context**

배포 환경에서 preview 페이지에 React #418 hydration 오류가 발생했다. `WeddingMonthCalendar` 컴포넌트에서 `date-fns`의 `format()`으로 날짜를 포맷할 때, 서버(Vercel, UTC)와 클라이언트(브라우저, KST) 간 timezone이 달라 렌더링 결과가 불일치했으며, 로컬 환경에서는 재현되지 않아 원인 파악이 어려웠다.

**Decision**

`date-fns-tz`의 `formatInTimeZone()`을 도입해 서버와 클라이언트 모두 `Asia/Seoul` timezone으로 고정하여 포맷하도록 수정했다. MongoDB는 내부적으로 항상 UTC로 저장하므로 저장 방식 변경으로는 해결 불가능하며, 포맷 시점에 timezone을 명시적으로 고정하는 것이 근본 해결책이다.

**Consequences**

- 배포 환경에서 발생하던 hydration 오류 제거.
- 서버 생성 HTML과 클라이언트 렌더링 결과가 일치해 SSR/ISR 환경에서 안정적인 렌더링 보장.
- 날짜를 다루는 신규 컴포넌트는 반드시 `formatInTimeZone()` 경유해야 하는 컨벤션이 생김(암묵적 제약).

---

### ADR-0004: 서버 상태 캐싱 라이브러리로 SWR 채택

> 상태: Accepted
> 날짜:

**Context**

서버 상태(Server State) 캐싱 및 재검증, 중복 호출 방지가 필요했다. React Query와 SWR 중 선택이 필요한 상황이었다.

**Decision**

SWR을 채택했다. React Query 대비 API가 단순하고 번들 크기가 작으며, 이 프로젝트 규모에서는 복잡한 mutation 관리 등 고급 기능이 불필요하다고 판단했다.

**Consequences**

- 번들 크기·러닝 커브 이점을 얻는 대신, React Query가 제공하는 고급 mutation/캐시 무효화 기능은 포기.
- 상품 목록 등에서 `fallbackData`(SSR 데이터) → SWR 하이드레이션 패턴을 표준으로 사용.

---

### ADR-0005: 전역 상태(Zustand)와 지역 상태(Context API) 분리 원칙

> 상태: Accepted
> 날짜:

**Context**

상태 관리 범위(전역 vs 지역)를 일관되지 않게 다루면 불필요한 리렌더링과 상태 추적 어려움이 발생한다.

**Decision**

인증·주문 등 앱 전반에 걸쳐 소비되는 상태는 Zustand로 관리한다. 특정 View 안에서만 영향을 주고받는 상태(예: 상품 필터)는 Zustand로 끌어올리지 않고 Context API로 격리한다. `createStateContext.tsx`를 제네릭 기반 Context 팩토리로 두어 일관된 패턴을 유지한다. 원칙: 로컬 상태 → Context API → Zustand 순으로 상태 범위를 확장한다(GEMINI.md).

**Consequences**

- 전역 상태 오염을 방지하고, View 한정 상태의 재사용성/격리성을 확보.
- 새 상태를 추가할 때 "이게 정말 전역이 필요한가"를 먼저 검토하는 습관을 강제.

---
