# 03. 페이지별 렌더링 전략 (Rendering Strategy)

이 문서는 프로젝트 내 각 페이지군에 적용되는 Next.js App Router 기반의 렌더링 전략을 정의합니다. 성능 최적화와 사용자 경험(UX)을 극대화하기 위한 기준입니다.

## 🏗️ 핵심 렌더링 원칙

1. **Server First**: 모든 페이지는 기본적으로 **서버 컴포넌트(Server Components)**로 설계하여 초기 로딩 속도(FCP)를 높이고 클라이언트 번들 크기를 최소화합니다.
2. **Hybrid Composition**: 데이터 페칭은 서버에서 수행하고, 상호작용(Interactivity)이 필요한 부분만 **클라이언트 컴포넌트**로 분리하여 삽입합니다.
3. **Data Fetching**: 가능하면 `fetch` API의 캐싱 옵션을 활용하여 불필요한 DB 접근을 줄입니다.

---

## 📋 페이지군별 전략 상세

### 1. 메인 랜딩 (`/`)

- **전략**: **SSG (Static Site Generation)** 또는 **ISR (Incremental Static Regeneration)**
- **설명**:
  - 서비스의 첫 인상을 결정하는 페이지로, 가장 빠른 응답 속도를 위해 빌드 시점에 정적으로 생성합니다.
  - 프로모션 배너나 공지사항 등 주기적인 업데이트가 필요한 경우 `revalidate` 옵션을 통해 최신 상태를 유지합니다.
- **데이터 관리**: `src/data/`의 정적 JSON 파일과 서버 측 공지사항 데이터를 조합하여 렌더링합니다.

### 2. 상품 목록 (`/products/**`)

- **전략**: **Hybrid Rendering (SSR + CSR)**
- **설명**:
  - **초기 렌더링(SSR)**: 페이지 진입 시 해당 카테고리의 데이터를 서버에서 미리 페칭하여 `fallbackData`로 주입함으로써 **Zero-Loading UI**를 구현하고 검색 엔진 최적화(SEO)를 확보합니다.
  - **상태 관리(CSR)**: 클라이언트 마운트 이후에는 `useSWR`과 `Context API`를 통해 데이터를 관리합니다. 현재는 카테고리 전체 데이터를 브라우저 메모리에 보유하며, 사용자의 필터 조작에 따라 즉각적인 클라이언트 사이드 리렌더링(In-Memory Filtering)을 수행하여 최상의 반응성을 제공합니다.
- **현재 상태 관리 흐름**:
  1. **서버 데이터 주입**: 카테고리 전체 상품 데이터를 서버에서 한 번에 가져와 Props로 전달.
  2. **SWR 하이드레이션**: `fallbackData`를 통해 초기 `data` 상태를 즉시 채우고 배경에서 데이터 동기화(Revalidation) 수행.
  3. **클라이언트 가공**: `ProductFilterProvider`의 상태값 변경 시, 추가 네트워크 요청 없이 메모리 내 배열에 대해 `filter()` 및 `sort()` 연산을 수행하여 UI에 즉시 반영.
- **확장성 (Scalability Plan)**:
  - **무한 스크롤(Infinite Scroll) 도입**: 상품 데이터가 대형화될 경우, 전체 로드 방식에서 페이지 단위 조각(Chunk)을 가져오는 무한 스크롤 방식으로 전환합니다.
  - **서버 사이드 필터링**: 무한 스크롤 도입 시 필터링 로직은 서버 쿼리(DB Filter) 방식으로 이동합니다.
  - **Reset & Refetch 구조**: 필터 조건이 변경되면 클라이언트에 누적된 데이터를 즉시 리셋하고, 변경된 조건에 맞는 **'필터링된 1페이지'**부터 다시 순차적으로 호출하는 구조를 채택합니다.

### 3. 상품 상세 페이지 (`/products/[id]`)

- **전략**: **Dynamic Rendering (SSR)** + **Caching**
- **설명**:
  - 상품 ID에 따라 실시간으로 데이터를 조회해야 하므로 동적 렌더링을 사용합니다.
  - 자주 조회되는 상품 정보는 서버 계층에서 캐싱 처리하여 응답 속도를 개선합니다.

### 4. 마이페이지 및 관리자 페이지 (`/profile/**`, `/admin/**`)

- **전략**: **Dynamic Rendering (Force Dynamic)**
- **설명**:
  - 사용자별 세션 정보 및 실시간 데이터(주문 현황, 유저 관리 등)가 중요하므로 항상 최신 상태를 유지해야 합니다.
  - `middleware.ts`를 통해 서버 측에서 권한 체크를 수행합니다.

### 5. 청첩장 제작 및 결제 (`/checkout/**`, `/order/**`)

- **전략**: **Client-side Interactivity** + **Server Actions**
- **설명**:
  - 사용자 입력이 많고 실시간 유효성 검사가 중요하므로 폼 영역은 클라이언트 컴포넌트로 구성합니다.
  - 데이터 저장은 **Server Actions**를 통해 보안을 유지하며 서버에서 처리합니다.

### 6. 청첩장 프리뷰 (`/preview/**`)

- **전략**: **Static Layout** + **Client-side Data Sync**
- **설명**:
  - 제작 중인 데이터를 실시간으로 반영해야 하므로, 레이아웃은 서버에서 제공하되 내부 데이터는 Zustand나 Context API를 통해 클라이언트 측에서 동기화합니다.

---

## ⚙️ 데이터 페칭 가이드

- **Server-side**: `src/services/` 내부 함수를 호출하여 직접 DB에 접근합니다. (Server Component 전용)
- **Client-side**: 복잡한 필터링이나 실시간 업데이트가 필요한 경우 `useSWR` 또는 `React Query`를 사용하여 캐싱과 재검증을 관리합니다.
- **Form Submission**: 모든 데이터 변조(CUD)는 `src/actions/`에 정의된 Server Action을 통해서만 수행합니다.

---

_마지막 업데이트: 2025년 3월 7일_
