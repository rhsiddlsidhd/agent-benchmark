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

### 4.1 핵심 유스케이스 시퀀스

**커플 — 템플릿 구매** (`00_PRD.md` UC-1 대응, 소스 추적 기준):

```
[상품상세 /products/[id]]
  └─ ProductOptions.handlePurchase()
       → Zustand order.store에 checkoutData 저장(sessionStorage persist)
       → router.push('/couple-info')

[/couple-info] ── 미들웨어: token 쿠키 없으면 → '/' 리다이렉트(비로그인 차단)
  └─ CoupleInfoForm(type=create)
       → 이미지 클라이언트 → Cloudinary 직접 업로드
       → createCoupleInfoAction → CoupleInfo 문서 생성(_id 발급)
       → router.push('/payment?q={coupleInfoId}')

[/payment?q=coupleInfoId] ── 미들웨어: token 없으면 → '/' 리다이렉트
  └─ CheckoutForm
       → createOrderAction → Order 문서 생성(status=PENDING, merchantUid 발급)
       → usePortOnePayment.triggerPayment() → PortOne 결제창(SDK) 팝업
            ├─ [CARD / TRANSFER] 팝업에서 즉시 완료
            └─ [VIRTUAL_ACCOUNT] 팝업은 "계좌 발급"만 완료, 실입금은 비동기(이후)
       → POST /api/payment/complete { paymentId }
            └─ syncPayment(): PortOne 서버 API로 실결제 재조회
                 → verifyPayment(): 금액 검증(order.finalPrice vs 실결제액)
                 → Payment 문서 생성/갱신, Order.orderStatus = CONFIRMED
       → clearOrder(zustand) → router.push('/payment/success?orderId=merchantUid')

[/order], [/order/edit] ── 주문 내역 확인, CoupleInfoForm(type=edit)로 무제한 재수정

[/preview/[coupleInfoId]] (하객, 비로그인)
  └─ getActiveOrderInfoByCoupleInfoId() — CONFIRMED/COMPLETED Order만 조회
       → productId 기반 테마 자동 적용(예: blossom) + 구매한 프리미엄 기능 반영
  └─ GuestBookClientSection → createGuestbook (이름/메시지/비밀번호/공개여부)
```

**커플/유저 — 인증(로그인/회원가입/계정 복구)** (JWT 이중 토큰: REFRESH 쿠키 + ACCESS는 응답 바디로만 전달):

```
[LoginEntryButton 등 보호 라우트 진입 버튼] (전역)
  └─ useEntry(nextPath).handleEntry()
       → POST /api/auth/entry?next={nextPath}
            └─ entryToken 발급(ENTRY) → token 쿠키 삭제 → entry 쿠키 설정(maxAge=600s)
       → router.push(nextPath)

[/login] ── 미들웨어: token 쿠키 있으면 → '/' 리다이렉트(중복 로그인 차단), entry 쿠키 없으면 → '/' 리다이렉트("관문" 강제)
  └─ LoginForm
       → loginUser(action) → getUser({email}) → comparePasswords(bcrypt)
            ├─ [불일치] "이메일 또는 비밀번호가 일치하지 않습니다." (401)
            └─ [일치] refreshJWT 발급(REFRESH, remember 여부로 만료 조정) → setCookie('token')
                 → accessJWT 발급(ACCESS, 쿠키 아닌 응답 바디로만 전달)
       → setToken(zustand auth.store) → router.push('/')

[/signup] ── 미들웨어: token 쿠키 있으면 → '/' 리다이렉트
  └─ SignupForm → signupUser(action)
       → checkEmailDuplicate()
            ├─ [중복] "이미 존재하는 이메일 입니다." (409)
            └─ [통과] hashPassword(bcrypt) → createUser() — 가입 후 자동 로그인 없음(수동 로그인 필요)

[/find-id] ── 미들웨어: token 쿠키 있으면 → '/' 리다이렉트
  └─ FindIdForm → findUserEmail(action) → getUserEmail({name, phone}) → 일치 시 이메일 반환/노출

[/find-pw] ── 미들웨어: token 쿠키 있으면 → '/' 리다이렉트
  └─ ForgotPasswordForm → requestPasswordReset(action)
       → checkEmailDuplicate() → [미가입] "등록되지 않은 이메일입니다." (400)
       → entryToken 발급(ENTRY) → createChangePWDomain(token)
            ├─ [NODE_ENV=development] `http://localhost:3000/change-pw?t={token}`
            └─ [그 외 — 배포 환경 포함] '' (빈 문자열)
       → sendEmail({email, path}) — nodemailer(Gmail SMTP), 링크 10분 TTL 안내 문구 포함

[/change-pw?t={entryToken}] ── 미들웨어: token 쿠키 있으면 → '/' 리다이렉트, searchParams.t 없으면 → '/' 리다이렉트
  └─ UpdatePasswordForm → updateUserPassword(action)
       → decrypt(token, type=ENTRY) → payload.id 없으면 401
       → changePassword(payload.id, password) → bcrypt 해싱 후 저장
       → deleteCookie('userEmail') (언마운트 시 DELETE /api/auth/cookie로 재시도)
       → router.push('/login')

[세션 부트스트랩] (모든 페이지, AuthButtons → useAuth())
  └─ useSWR('/api/auth/me') → getAuth(): REFRESH 쿠키 검증 → getUser() → ACCESS 재발급(응답만, 쿠키 갱신 없음)
       ├─ [세션 있음] setToken(zustand)
       └─ [세션 없음] clearAuth()

[인증 필요 API 호출] (fetcher(), auth:true)
  └─ Authorization: Bearer {ACCESS} 첨부 → 401 응답 시
       → refreshAccessToken(): POST /api/auth/refresh(REFRESH 쿠키) → 새 ACCESS 발급 → zustand 갱신 → 원 요청 재시도
            └─ [REFRESH도 만료/무효] deleteCookie('token') + clearAuth() (자동 로그아웃)
```

**하객 — 청첩장 열람 & 방명록** (`(preview)/preview/[id]`, 비로그인 접근):

```
[/preview/[id]] (하객, 비로그인, ISR revalidate=300)
  └─ getCoupleInfoById(id) — 없으면 notFound()
  └─ getActiveOrderInfoByCoupleInfoId(id) — CONFIRMED/COMPLETED Order만 조회, 없으면 features:[], productId:null
       → getThemeByProductId(productId) — PRODUCT_THEME_MAP 하드코딩 매핑(특정 productId 1건 → 'blossom'), 미매핑 시 'default'
       → activeFeatures.includes('HORIZONTAL_SLIDE') 등으로 섹션별 프리미엄 기능 on/off
  └─ GuestBookClientSection(id)
       → useSWR('/api/guestbook?id={id}') → GET → getGuestbookService(id) — password 필드 제외 조회
  └─ GuestBookModal (WRITE_GUESTBOOK | DELETE_GUESTBOOK | VIEW_CONTACT, zustand guestbook.modal.store로 타입 분기)

[방명록 작성] CreateGuestbookForm(payload.id)
  └─ createGuestbook(action)
       → GuestbookSchema 검증(author 1~20자, password 4~20자, message 1~500자)
       → hashPassword(bcrypt) → createGuestbookService()
       → revalidatePath('/preview/[id]') → closeModal() → router.refresh()

[방명록 삭제] DeleteGuestbookForm(payload=guestbookId)
  └─ deleteGuestbookAction(action)
       → 스키마 검증(password, guestbookId, coupleInfoId, productId 모두 필수)
       → getPrivateGuestbookService(guestbookId) → comparePasswords(bcrypt)
            ├─ [불일치] "비밀번호가 일치하지 않습니다." (401)
            └─ [일치] deleteGuestbookService() → revalidatePath('/preview/[id]')
```

**관리자 — 어드민 접근/권한(RBAC)** (`(admin)/admin`):

```
[/admin/*] ── 미들웨어: token 쿠키 없으면 → '/' 리다이렉트, 있으면 decrypt(REFRESH) → payload.role !== 'ADMIN'이면 → '/' 리다이렉트
  └─ AdminLayout(SidebarProvider) → SidebarNavItem(type=ADMIN)
  └─ [/admin/dashboard] — 통계 카드(TODO: 하드코딩된 mock 값, 실제 집계 쿼리 미연결 — 코드 확인됨)
  └─ [/admin/products] — getAllProductsService() 목록 렌더(페이지 레벨 role 재검증 없음, 미들웨어에만 의존)
  └─ [/admin/products/new], [/admin/premium-features/new] — 등록 폼
       ├─ createProductAction: getCookie('token') → decrypt(REFRESH) → getUserById().role !== 'ADMIN'이면 403(액션 레벨 이중 방어)
       └─ createPremiumFeatureAction: 위와 동일한 이중 방어 로직 없음(미들웨어 보호에만 의존)
  └─ [/admin/products, _components/ProductEditDialog] → updateProductAction / updateProductStatusAction / deleteProductAction — 모두 액션 레벨 role 이중 검증 포함
  └─ [/admin/premium-features, _components] → updatePremiumFeatureAction — 액션 레벨 role 검증 없음
  └─ [/admin/orders], [/admin/users], [/admin/settings] — 빈 컴포넌트(`<div></div>`)만 반환, 미구현
```

**단순 CRUD 라우트** (상세 시퀀스 대신 라우트/가드만 정리):

| 라우트 | 미들웨어 가드 | 비고 |
|--------|---------------|------|
| `/order` | 보호(token 필요) | 내 주문 목록 — `getOrdersByUserId(userId)`, force-dynamic |
| `/order/edit?q={coupleInfoId}` | 보호(token 필요) | `CoupleInfoForm(type=edit)` 재사용 — `q` 없으면 `throw new HTTPError`(400), `GET /api/couple-info?q=`(Bearer 인증)로 기존 데이터 조회 |
| `/profile` | 보호(token 필요) — 미들웨어 + 페이지 자체에서도 `getCookie`/`decrypt` 이중 확인(REFRESH 무효 시 `redirect('/login')`) | `BasicInfoForm`, `ChangePasswordForm` |
| `/products?category={category}` | 비보호(공개) | `category` 파라미터 필수 — 없거나 `'all'`이거나 미유효 카테고리면 `notFound()`(전체 목록 뷰 없음) |
| `/products/[id]` | 비보호(공개) | SSG(`revalidate 3600`) + `generateStaticParams`로 전체 상품 사전 생성, `getPremiumFeatureService` 병행 조회 |
| `/reviews` | 비보호(공개) | (TODO: 실제 리뷰 기능 미구현 — "공사중"(Hammer 아이콘) 플레이스홀더 페이지만 존재, 코드 확인됨) |

**유틸리티 API** (페이지 플로우에 속하지 않는 단독 Route Handler):

| API | 미들웨어 가드 | 비고 |
|-----|---------------|------|
| `GET /api/banks` | 없음 | PortOne 은행 코드 목록 프록시 |
| `GET /api/subway` | 없음 | 핸들러 본문 없음(`export const GET = async () => {}`) — 응답을 반환하지 않는 미구현 상태 |
| `GET /api/kakaomap?address=` | 없음 | Kakao 로컬 주소 검색 API 프록시(예식장 주소 좌표 변환) |
| `POST /api/upload/signature` | 미들웨어 matcher 미포함 — 라우트 자체에서 REFRESH 쿠키 검증 | Cloudinary 클라이언트 직접 업로드용 서명 발급 |

### 4.2 에러/엣지케이스 처리 정책

- 비즈니스/시스템 에러 구분, 유저 피드백은 `sonner`(Toast) 우선 사용 (GEMINI.md).
- (TODO: 에러 바운더리/로깅 정책 상세는 `docs/ERROR_HANDLER.md` 별도 확인 필요 — 이번 조사 범위에 미포함)

**구매 플로우에서 발견된 미처리 엣지케이스** (코드 조사로 확인, `00_PRD.md` §8 오픈 이슈와 연결):

| 케이스 | 위치 | 현상 |
|--------|------|------|
| 가상계좌 상태 오판 | `src/hooks/usePortOnePayment.ts` | `/api/payment/complete` 응답이 `PAID`가 아니면 무조건 실패 처리 — 가상계좌 발급(정상 `PENDING`)도 실패로 노출 |
| 결제 확정 단일 경로 | `src/hooks/usePortOnePayment.ts`, `src/app/api/payment/complete/route.ts` | PortOne 웹훅 등 서버-서버 보정 경로 없음(라우트 조사 결과 부재) — 팝업 성공 후 클라이언트 이탈 시 결제는 됐지만 Order는 영구 PENDING |
| Order 중복 생성 | `src/actions/createOrderAction.ts` | 멱등키/중복 체크 없음 — 결제 페이지 새로고침 후 재제출 시 같은 coupleInfoId로 Order가 추가 생성될 수 있음 |
| CoupleInfo 고아 데이터 | `src/components/organisms/CoupleInfoForm.tsx` | CoupleInfo가 Order보다 먼저 생성되는 구조 — 결제 미완료 시 정리되지 않고 남음 |
| 비로그인 구매 시도 무설명 리다이렉트 | `src/middleware.ts`, `ProductOptions.tsx` | `/couple-info` 진입 시 토큰 없으면 안내 없이 `/`로 리다이렉트, 로그인 후 원래 상품으로 복귀하는 경로 없음 |
| `/payment` 잘못된 접근 시 unhandled Error | `src/app/(main)/(checkout)/payment/page.tsx` | `q` 파라미터 없으면 `notFound()`/`redirect()`가 아닌 plain `throw new Error` — 기본 에러 바운더리로 노출 |

**인증/방명록/어드민 플로우에서 발견된 미처리 엣지케이스** (코드 조사로 확인, 추측 배제):

| 케이스 | 위치 | 현상 |
|--------|------|------|
| 비밀번호 재설정 링크 운영환경 미발급 | `src/actions/requestPasswordReset.ts` (`createChangePWDomain`) | `NODE_ENV !== 'development'`면 `path=''`(빈 문자열)로 메일 발송 — 운영 환경에서 비밀번호 재설정 기능이 사실상 동작하지 않음 |
| 고아 쿠키(`userEmail`) 정리 로직만 존재 | `src/lib/cookies/type.ts`, `src/actions/updateUserPassword.ts`, `src/app/api/auth/cookie/route.ts` | `CookieName`에 `'userEmail'`이 정의되고 두 지점에서 `deleteCookie('userEmail')`을 호출하지만, `setCookie('userEmail', ...)` 호출 지점이 코드베이스에 없음 |
| 방명록 작성 후 목록 미즉시 반영 가능 | `src/actions/createGuestbook.ts`, `src/components/organisms/(preview)/GuestBookClientSection.tsx` | 작성 성공 시 `router.refresh()`만 호출 — 목록은 `useSWR` 캐시(`mutate` 미호출)로 유지되어 새 항목이 즉시 반영되지 않을 수 있음 |
| 방명록 삭제 시 `productId` 상시 누락 가능 | `src/components/organisms/DeleteGuestbookForm.tsx`, `src/actions/deleteGuestBookAction.ts` | `productId`를 URL searchParams `?product=`에서 읽으나, `/preview/[id]` 진입 경로 어디서도 해당 쿼리를 설정하지 않아 항상 빈 값 — zod 스키마가 `productId`를 필수로 요구해 삭제 요청이 400으로 실패할 수 있음 |
| 프리미엄 기능 CRUD 액션 권한 이중검증 누락 | `src/actions/createPremiumFeatureAction.ts`, `src/actions/updatePremiumFeatureAction.ts` | 같은 그룹의 `createProductAction`/`updateProductAction`/`deleteProductAction`/`updateProductStatusAction`과 달리 쿠키·토큰 디코딩 및 `role==='ADMIN'` 검증 없이 서비스 계층을 직접 호출(미들웨어 라우트 보호에만 의존) |
| 어드민 하위 페이지 3곳 미구현 | `src/app/(main)/(admin)/admin/orders/page.tsx`, `.../users/page.tsx`, `.../settings/page.tsx` | RBAC 통과 후에도 빈 `<div></div>`만 반환 |

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
