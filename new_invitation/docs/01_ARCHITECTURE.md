# Architecture Document

> 상태: Draft
> 작성자:
> 작성일:
> 최종 수정일:
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

Next.js(App Router) 기반 풀스택 모놀리스. 프론트엔드 렌더링, Server Actions/Route Handler를 통한 백엔드 API, MongoDB(Mongoose) 데이터 계층을 단일 Next.js 앱에서 처리하고 Vercel에 배포한다. 결제(PortOne), 이미지 스토리지(Cloudinary), 지도(Kakao Maps/Daum 우편번호) 등 외부 서비스와 연동한다.

## 2. 목표 및 제약 (Goals & Constraints)

**목표**
- 페이지 성격별 최적 렌더링 전략 적용으로 TTFB/LCP 개선 (정적 페이지는 Static/SSG 유지).
- 결제 위변조 방지를 위한 서버 측 금액/상품 재검증.
- SSR/ISR 환경에서 서버-클라이언트 렌더링 결과 일치 보장(hydration mismatch 방지).

**제약**
- Next.js Server Action 요청 바디 1MB 제한.
- 배포 환경(Vercel) 서버는 UTC, 클라이언트 브라우저는 KST — timezone 불일치 가능성 상존.
- 기술 스택(Next.js/MongoDB/PortOne/Cloudinary/Kakao) 고정, 교체 계획 없음.

## 3. 시스템 컨텍스트 (System Context)

```
[하객 브라우저] ──열람/방명록──▶ [Tie Knot (Next.js, Vercel)] ◀──관리──[커플/관리자 브라우저]
                                        │
        ┌───────────────┬──────────────┼───────────────┬───────────────┐
        ▼               ▼              ▼               ▼               ▼
   [MongoDB]       [Cloudinary]   [PortOne 결제]   [Kakao Maps /   [GitHub Actions
   (Mongoose)      (이미지 CDN)   (PG 게이트웨이)   Daum 우편번호]   → Claude 코드리뷰
                                                                      → Slack 알림]
```

## 4. 전체 구조 (High-Level Architecture)

```
src/app/            Next.js App Router — 라우트 그룹별 렌더링 전략 분리
  (main)/(auth|checkout|admin|products|my-order|my-profile)
  (preview)/preview/[id]
  api/               Route Handlers (auth, order, payment, upload, kakaomap, subway 등)
src/actions/         Server Actions — 클라이언트→서버 데이터 변조(CUD) 진입점
src/services/        비즈니스 로직 + DB 접근 계층 (actions/route handler가 호출)
src/models/          Mongoose 스키마 (User, Product, ProductFeature, CoupleInfo, Order, Payment, Guestbook)
src/schemas/         Zod 검증 스키마 (폼/서버 공용)
src/store/           Zustand 전역 상태 (인증, 주문 등 앱 전반)
src/context/         Context API 지역 상태 (예: 상품 필터, 특정 View 한정)
src/components/      atoms → molecules → organisms (Atomic Design)
```

호출 흐름: `components/organisms(폼)` → `actions/`(Server Action, `"use server"`) → `services/`(비즈니스 로직) → `models/`(Mongoose, DB) — 검증은 `schemas/`(Zod)를 액션·폼 양쪽에서 공유.

### 에러/엣지케이스 처리 정책

- 비즈니스/시스템 에러 구분, 유저 피드백은 `sonner`(Toast) 우선 사용 (GEMINI.md).
- (TODO: 에러 바운더리/로깅 정책 상세는 `docs/ERROR_HANDLER.md` 별도 확인 필요 — 이번 조사 범위에 미포함)

## 5. 모듈/서비스 상세 (Module/Service Details)

### 5.1 actions (`src/actions/`)
- 책임: 클라이언트에서 호출되는 Server Action 진입점. `createOrderAction`, `createCoupleInfoAction`, `createGuestbook`, `loginUser`, `signupUser` 등.
- 인터페이스: 폼/컴포넌트에서 직접 호출되는 async 함수 (`"use server"`).
- 의존성: `services/`, `schemas/`(입력 검증).

### 5.2 services (`src/services/`)
- 책임: 비즈니스 로직 및 DB 접근 계층 추상화 (`auth.service.ts`, `order.service.ts`, `payment.service.ts`, `product.service.ts`, `coupleInfo.service.ts`, `premiumFeature.service.ts`, `guestbook.service.ts`, `user.service.ts`).
- 인터페이스: `actions/`, `app/api/*`(Route Handler)에서 호출.
- 의존성: `models/`(Mongoose), 외부 SDK(PortOne server-sdk 등).

### 5.3 models (`src/models/`)
- 책임: MongoDB 데이터 모델 정의(Mongoose Schema). `.lean()` 적극 활용 (GEMINI.md).
- 의존성: MongoDB.

### 5.4 store (`src/store/`) vs context (`src/context/`)
- Zustand: 인증·주문 등 앱 전반에 걸쳐 소비되는 전역 상태.
- Context API: 특정 View 안에서만 영향을 주고받는 상태(예: 상품 필터) — 전역으로 끌어올리지 않고 격리. `createStateContext.tsx`가 제네릭 기반 Context 팩토리.

## 6. 데이터 모델 (Data Model)

| 엔티티 | 주요 필드 | 관계 |
|--------|-----------|------|
| User | email, name, phone, password, role(USER/ADMIN), isDelete | — |
| Product | authorId, title, price, category/subCategory, isPremium, featureIds[], discount(rate/amount), status | featureIds → ProductFeature |
| ProductFeature | code, label, additionalPrice, isActive | Product.featureIds가 참조 |
| CoupleInfo | userId, groom/bride(Person+계좌), weddingDate, venue/address, guestbookEnabled, thumbnailImages[], galleryImages[] | userId → User |
| Order | 상품 스냅샷(가격/수량/선택 기능 snapshot), buyer 정보 | productId/featureId를 스냅샷으로 보관(원본 변경과 분리) |
| Payment | merchantUid, impUid, orderId, requestAmount/paidAmount, payMethod, status(PENDING/PAID/FAILED/CANCELLED/PARTIAL_CANCELLED/REFUNDED) | orderId → Order |
| Guestbook | coupleInfoId, author, message, password(수정/삭제용), isPrivate | coupleInfoId → CoupleInfo |

Order는 Product/ProductFeature를 참조가 아닌 **스냅샷**으로 저장한다 — 주문 시점 가격/구성이 이후 상품 변경에 영향받지 않도록 하는 설계.

## 7. 기술 스택 (Tech Stack)

| 영역 | 기술 | 선택 이유 |
|------|------|-----------|
| Frontend | Next.js(App Router), TypeScript, React 19, Tailwind CSS, Framer Motion | (TODO: 명시적 선정 근거 자료 없음) |
| 서버 상태 | SWR | React Query 대비 API가 단순하고 번들 크기가 작으며, 이 프로젝트 규모에 복잡한 mutation 관리 등 고급 기능이 불필요해 선택 (README) |
| 전역 상태 | Zustand | 인증·주문 등 앱 전반 상태 (README) |
| 지역 상태 | Context API | 특정 View 한정 상태를 전역으로 끌어올리지 않기 위함 (README) |
| DB | MongoDB, Mongoose | (TODO) |
| 이미지 스토리지 | Cloudinary | 서버 경유 없이 클라이언트 직접 업로드, Server Action 1MB 제한 회피 ([02_ADR.md](./02_ADR.md) ADR-0002) |
| 결제 | PortOne (browser-sdk + server-sdk) | (TODO) |
| 지도 | Kakao Maps SDK, react-daum-postcode | 예식장 주소·지도 설정 |
| CI/CD | GitHub Actions, Vercel | Claude AI 코드 리뷰 자동화 + Slack PR 알림 포함 |

## 8. 배포 아키텍처 (Deployment)

- 배포: Vercel (배포 링크: https://new-invitation-5dib.vercel.app/)
- CI: GitHub Actions — Claude AI 코드 리뷰 자동화, Slack PR 알림 워크플로우 포함 (README)
- (TODO: 환경변수/시크릿 관리, 스테이징 환경 유무 등은 원본 자료에서 확인되지 않음)

## 9. 보안 고려사항 (Security Considerations)

- JWT 이중 토큰(Access + Refresh) 인증. `getAuth()`가 Refresh 토큰 쿠키를 검증해 Access 토큰을 재발급 (`src/services/auth.service.ts`).
- 역할 기반 접근 제어(USER/ADMIN) — `middleware.ts`에서 서버 측 권한 체크 수행 (`.docs/03_rendering_strategy.md`).
- 결제 금액/상품 정보는 클라이언트 값을 신뢰하지 않고 서버에서 재검증(fraud prevention) — `payment.service.ts`.
- 비밀번호(User.password, Guestbook.password)는 해시 저장 추정(`bcryptjs` 의존성 존재) — (TODO: 실제 해시 처리 지점 코드 확인 필요, 이번 조사 범위에 미포함).

## 10. 확장성 및 성능 (Scalability & Performance)

렌더링 전략 (`.docs/03_rendering_strategy.md`):

| 페이지군 | 전략 | 이유 |
|----------|------|------|
| 홈, 상품 목록 | Static / ISR | 서버 데이터 불필요, 빌드 시 최적화 자산 활용 |
| 상품 상세 | SSG + 캐싱 | 상품 데이터 변경 빈도 낮음 |
| 프리뷰 | Static Layout + 클라이언트 데이터 동기화 | 레이아웃은 서버 제공, 내부 데이터는 Zustand/Context로 동기화 |
| 프로필, 대시보드, 어드민 | SSR(Force Dynamic) | 사용자별/실시간 데이터, 미들웨어 권한 체크 |
| 청첩장 제작/결제 | 클라이언트 인터랙션 + Server Actions | 실시간 유효성 검사, 데이터 저장은 서버에서 |

- 현재 상품 목록은 카테고리 전체 데이터를 클라이언트 메모리에 로드해 In-Memory Filtering. 데이터 증가 시 **무한 스크롤 + 서버 사이드 필터링**으로 전환 예정(미착수) — Reset & Refetch 구조로 필터 변경 시 1페이지부터 재조회하는 방식을 채택할 계획.
- 이미지는 Cloudinary CDN 경유로 서빙 속도(TTFB) 개선, `CloudImage` 커스텀 컴포넌트로 브라우저 환경별 최적화 포맷/리사이징 제공 (LCP 개선).

## 11. 리스크 및 트레이드오프 (Risks & Trade-offs)

- In-Memory Filtering 방식은 카테고리 상품 수가 커지면 초기 페이로드/메모리 사용량이 함께 증가 — 서버 사이드 필터링 전환 전까지는 확장성 리스크로 남아있음.
- SWR 채택으로 React Query 대비 고급 캐싱/mutation 관리 기능은 포기 — 현재 규모에서는 트레이드오프 감내 가능하다고 판단(README).
- 상세 결정 이력은 [02_ADR.md](./02_ADR.md) 참고.

## 12. 참고자료 (References)

- [README.md](../README.md)
- [GEMINI.md](../GEMINI.md)
- `.docs/01_component_architecture.md`, `.docs/03_rendering_strategy.md`
- `src/models/*`, `src/services/*`, `src/app/globals.css`
