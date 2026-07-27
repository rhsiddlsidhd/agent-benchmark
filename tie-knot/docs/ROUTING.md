# docs/ROUTING.md

> Last updated: 2026-07-27
> 목표(target) 구조 정의 문서 — 실제 파일 이동/코드 반영은 별도 작업(추후 리팩토링 세션)에서 진행한다. 이 문서만으로 라우트 파일을 옮기지 않는다.
> `src/app/CLAUDE.md`가 페이지 **내부** 구조(private 폴더, layout/error 배치)를 다루는 것과 달리, 이 문서는 URL 계층 구조(라우트 그룹 존재 근거)와 라우트 **네이밍**(경로 문자열 참조 방식)을 다룬다.

## 라우트 그룹 존재 근거

라우트 그룹 `(folder)`는 조직 편의만으로 만들지 않는다 — 공유 `layout.tsx` 또는 독립 `error.tsx` 스코프 중 하나 이상의 실제 근거가 있을 때만 만든다, 근거 없이 만들면 그룹이 몇 개 있는지·왜 있는지가 코드 읽기만으로 추적 불가능해진다.

| 그룹 | 근거 |
|---|---|
| `(auth)` | `layout.tsx` 공유(로그인/회원가입 등 5개 라우트 셸) |
| `(checkout)` | `layout.tsx` 공유(체크아웃 셸) — 아래 "delivery-info" 참고 |
| `(my-order)` | `layout.tsx` 공유(사이드바 셸) |
| `(my-profile)` | `layout.tsx` 공유(사이드바 셸) |
| `(admin)` | `layout.tsx` + 독립 `error.tsx` |
| `(products)` | 독립 `error.tsx`(자체 `layout.tsx`는 없음) |

`(my-profile)`이 감싸는 실제 폴더명(`profile/`)과 그룹명이 다른 것은 의도된 패턴이다 — 그룹명은 "내(my) 소유 리소스" 관점을 표시하고 폴더명은 실제 URL 세그먼트를 그대로 반영한다. 새 "내 것" 계열 라우트를 추가할 때도 이 `(my-{noun})` / `{noun}` 분리를 기본으로 따른다.

`(my-order)`는 이 패턴의 예외다 — 폴더명(현재 `order/`)을 그룹명과 맞춰 `my-orders/`로 리네임하는 게 목표다(아래 목표 라우트 트리 참고). 이유: `sidebar.ts`의 `AUTH_USER_ORDER_NAVIGATE_ITEMS`가 이미 "주문 목록"(`/my-orders`)·"취소/환불"(`/my-orders/refund`) 두 항목을 같은 `/my-orders` 프리픽스로 묶어 참조하고 있다 — 실제 라우트를 이 프리픽스에 맞추면 두 항목이 한 URL 패밀리 아래 정리되고, `navigation.ts`의 `USER_NAV_ITEMS`(현재 `/order`) 쪽 한 곳만 고치면 된다(반대 방향으로 고치면 `sidebar.ts` 두 곳을 고쳐야 한다).

그룹 없이 `(main)/` 바로 아래 단독으로 있는 라우트도 있다(`reviews/`, 아래 "support" 참고) — 공유 `layout.tsx`/독립 `error.tsx` 근거가 없는 단일 라우트는 그룹을 만들지 않는다, 위 표의 그룹 생성 기준과 대칭이다.

## 목표 라우트 트리

| 그룹/경로 | URL | 상태 | 비고 |
|---|---|---|---|
| `(checkout)/couple-info` | `/couple-info` | 구현됨 | |
| `(checkout)/payment` | `/payment` | 구현됨 | |
| `(checkout)/payment/success` | `/payment/success` | **이동 대상** | 현재 `(main)/payment/success`로 그룹 밖에 있음 — 체크아웃 셸(`layout.tsx`)을 못 받는 상태. `(checkout)` 안으로 이동해도 URL 불변(라우트 그룹은 URL에 영향 없음), `CheckoutForm.tsx`의 `router.push('/payment/success?...')` 등 기존 참조 전부 그대로 유효 |
| `(checkout)/delivery-info` | `/delivery-info` | **예정, 미구현** | 아래 "delivery-info" 참고 |
| `(my-order)/my-orders` | `/my-orders` | **리네임 대상** | 현재 폴더명 `order/`(URL `/order`) — `my-orders/`로 리네임해 그룹명·`sidebar.ts` 기존 참조와 맞춘다. `navigation.ts`의 `USER_NAV_ITEMS`(`href: "/order"`)를 `/my-orders`로 함께 수정. `router.push`/`router.replace` 등 다른 소비처에 `/order` 리터럴이 더 있는지 리네임 시 전수 확인 |

## delivery-info (예정 라우트)

- `proxy.ts` matcher에 이미 보호 대상으로 등록돼 있으나 실제 `page.tsx`는 없다 — 죽은 코드로 보고 지우지 않는다. 이유: 프로젝트 개요(`CLAUDE.md`)상 모바일 청첩장 다음으로 답례품·웨딩소품·방명록굿즈·예식용품 등 **실물 상품** 카테고리 확장을 지향하는데, 실물 배송에는 배송지 입력 스텝이 필요하고 이 라우트가 그 자리다.
- 지금은 스캐폴딩(빈 페이지)도 만들지 않는다 — 실물 상품 카테고리가 실제로 추가되는 시점에 그 작업과 함께 구현한다. 이유: 지금 만들면 실물 카테고리의 배송지 데이터 요구사항(주소 형식, 배송비 계산 여부 등)을 모른 채 빈 틀만 먼저 고정하게 되고, 이후 실제 요구사항이 그 틀과 안 맞으면 다시 갈아엎는다 — `src/CLAUDE.md`/`docs/PAGE_ACCESS_CONTROL.md`가 이미 쓰는 "가정만으로 미리 만들지 않는다" 원칙과 동일하다.

## support (예정 라우트, 그룹 없음)

- `sidebar.ts`의 `AUTH_USER_ORDER_NAVIGATE_ITEMS`에 href `/support`(고객센터)가 이미 있으나 실제 `page.tsx`는 없다 — 죽은 코드가 아니라 미구현 상태로 남겨둔 것이다. `/reviews`(고객후기, "공사중" placeholder는 이미 구현됨)와는 다른 도메인이니 혼동하지 않는다.
- 그룹 불필요 — `reviews/`처럼 공유 layout/error 근거 없는 단일 라우트이므로 만들 때 `(main)/support/page.tsx`로 바로 둔다.
- 같은 `AUTH_USER_ORDER_NAVIGATE_ITEMS`의 `/my-orders`, `/my-orders/refund`는 `/support`와 별개 사안이다 — "주문 목록" 항목의 `/my-orders`가 목표 URL이다(위 "라우트 그룹 존재 근거"의 `(my-order)` 예외 참고, 실제 폴더 `order/` → `my-orders/` 리네임 대상). `navigation.ts`의 `USER_NAV_ITEMS`(현재 `/order`) 쪽이 수정 대상이다. "취소/환불"(`/my-orders/refund`)은 아직 구현 안 된 기능이라 실제 경로는 그 기능을 만들 때 확정한다.

## 카테고리 라우팅

- 지금은 `/products?category=invitation`처럼 쿼리 파라미터로 카테고리를 구분한다(`navigation.ts` `MAIN_NAV_ITEMS`) — 경로 세그먼트(`/products/[category]`)로 지금 전환하지 않는다. 이유: 카테고리가 1개(모바일 청첩장)뿐인 지금 시점엔 세그먼트 전환의 이득(카테고리별 독립 메타데이터/OG, 카테고리별 `error.tsx`/`loading.tsx` 스코프)이 실현되지 않는다.
- 전환 트리거: ①카테고리가 2개 이상 실제로 런칭되거나, ②카테고리별로 다른 SEO 메타데이터/OG 이미지가 필요해지는 시점 중 먼저 오는 쪽에서 `/products/[category]`로 전환을 재검토한다 — 그 전까지 미리 만들지 않는다.

## 라우트 네이밍 — 경로 문자열 참조 방식

- 라우트 경로 문자열을 각 소비처(컴포넌트/서버 액션/`proxy.ts`)에 리터럴로 흩어 쓰지 않는다 — 지금 `sidebar.ts`/`navigation.ts`가 일부(관리자 사이드바, 헤더 네비)만 상수화돼 있고, 나머지는 `proxy.ts` matcher·`revalidatePath` 호출부(`createProduct`/`updateProduct`/`deleteProduct`/`updateProductStatus`/`updatePremiumFeature`)·`router.push`/`router.replace`(`ProductSummary.tsx`, `CheckoutForm.tsx`, `useCheckoutData.ts`, `useCheckoutForm.ts` 등) 15곳+ 에 리터럴로 중복돼 있다. 이유: 동일 경로가 여러 곳에 독립적으로 타이핑돼 있으면 라우트 하나 바뀔 때 일부만 고치고 놓치는 드리프트가 구조적으로 발생한다.
- 이미 드리프트가 실제로 벌어진 사례가 있다 — `sidebar.ts`의 `AUTH_USER_ORDER_NAVIGATE_ITEMS`(`/my-orders`)와 헤더 `navigation.ts`의 `USER_NAV_ITEMS`(`/order`)가 같은 "마이 주문" 개념을 다른 문자열로 들고 있다. 목표는 `/my-orders`로 통일(위 "support" 섹션, 목표 라우트 트리의 `(my-order)/my-orders` 참고) — `navigation.ts` 쪽이 수정 대상이다. `routes.ts`로 이관할 때는 이 리네임이 먼저 끝나 있어야 한다 — 어긋난 두 값 중 하나를 임의로 골라 그대로 상수화하지 않는다.
- 대신 `src/shared/constants/routes.ts` 단일 파일에 전체 라우트 경로를 정의하고, 위 소비처 전부가 이 상수만 참조하도록 한다. 동적 세그먼트(`products/[id]`, `subway/[station]` 등)는 문자열 상수가 아니라 경로 빌더 함수로 제공한다(예: `ROUTES.products.detail(id)` → 문자열 템플릿 오타를 타입으로 막는다).
- `sidebar.ts`/`navigation.ts`의 기존 href는 이 파일이 생기면 그 값을 직접 들고 있지 않고 `routes.ts`를 import해서 참조하는 형태로 정리한다 — 같은 경로를 두 번 정의하지 않는다.
- 이 상수화는 이 문서가 정의하는 "목표"이자 즉시 착수 가능한 리팩토링 대상이다(구조 변경처럼 요구사항 확정을 기다릴 필요 없음, 이미 15곳+ 드리프트 위험이 실증돼 있음) — 단 실행은 이 문서 확정 후 별도 세션에서 진행한다.

## 관련 문서

- 페이지 내부 구조(private 폴더, layout/error 배치): `src/app/CLAUDE.md`
- 인증/인가 접근 제어(Proxy·page.tsx·service 3단 게이트): `docs/PAGE_ACCESS_CONTROL.md`
- 식별자 케이스 공통 규칙(SCREAMING_SNAKE_CASE lookup map 기준): `src/CLAUDE.md`
