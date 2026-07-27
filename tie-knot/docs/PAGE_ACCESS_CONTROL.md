# docs/PAGE_ACCESS_CONTROL.md

> Last updated: 2026-07-27
> 초안 — TODO #5(인증 UI 가드) 그릴링 결론. 아직 미구현, 코드 반영 전.
> `src/CLAUDE.md` "인증 토큰" 섹션(access/refresh 이중 토큰 폐기, `token` 단일 쿠키) 결정을 전제로 한다 — 이 문서의 page 게이트 설계는 그 결정 위에서만 성립한다(아래 Page-level DAL 게이트 참고).

## Overview

페이지(Server Component) 렌더링 시점의 접근 제어를 3단계로 나눈다: Proxy(낙관적) → page.tsx(라우팅 게이트) → service 함수(데이터 게이트). `src/CLAUDE.md`가 이미 "Server Action은 Proxy에 위임하지 않고 내부 재검증" 원칙을 갖고 있는데, 이 문서는 그 원칙의 페이지 렌더링 버전이다.

## Proxy

- Proxy는 protected path 전체(admin 포함)에 동일하게 `token` 쿠키를 decrypt해서 검사한다 — path별로 decrypt 여부를 다르게 두지 않는다, presence-only 체크(존재 여부만 봄)로 두지 않는다. 이유: 공식 문서 예제가 낙관적 리다이렉트에도 decrypt를 쓴다, presence-only는 만료/변조 세션을 걸러내지 못한다.
- Proxy 통과를 인가 완료로 취급하지 않는다 — 반드시 아래 page-level 게이트를 다시 태운다. 이유: Proxy는 공식 문서상 낙관적 체크 전용이지 인가의 전체 솔루션이 아니다(`src/CLAUDE.md` Critical Convention에 이미 명시).
- Proxy 자체의 미인증 실패도 아래 "Redirect 목적지" 규칙을 그대로 따른다(`/login`) — page-level 게이트가 뒤에서 잡는 것과 동일한 실패를 Proxy가 먼저 잡았다고 해서 다른 목적지로 보내지 않는다. 이유: 사용자 입장에서 "미인증"은 어느 레이어가 잡았든 같은 실패이고, 다음 행동(재로그인)도 같다 — 레이어에 따라 목적지가 갈리면 그 자체가 비일관 경험이다.
- `/login` 진입에 별도 관문(과거 `entry` 쿠키 요구, `issueEntryToken` 경유 강제)을 두지 않는다 — 로그인 안 한 유저는 `/login`에 직접 진입해도 된다. 이유: 이미 로그인한 유저를 auth 페이지에서 쫓아내는 Proxy의 기존 규칙(`src/CLAUDE.md` Key Files, "로그인 유저의 auth 페이지 차단")이 별도로 있어 그걸로 충분하고, 로그인 안 한 유저 쪽엔 막을 이유가 없다 — 실제로 지금 코드에서도 이 관문(`issueEntryToken`의 `token` 쿠키 삭제)은 그 "이미 로그인한 유저" 분기가 먼저 걸려 도달조차 안 되는 죽은 경로였다. `ENTRY` JWT 타입 자체는 비밀번호 재설정 용도로 남는다(`src/CLAUDE.md` "인증 토큰" 참고) — 이건 그 타입의 로그인-게이트 용도만 폐기하는 것이다.

## Page-level DAL 게이트

- 로그인 필요 페이지는 `auth.service.ts`의 page 전용 DAL 함수를 최상단에서 호출한다 — page.tsx 안에 쿠키 decrypt/조회 로직을 인라인으로 다시 쓰지 않는다. 이유: 지금 3곳(order/page.tsx, order/edit/page.tsx, profile/page.tsx)이 이미 이 로직을 손으로 복붙해 갖고 있고, 복붙본은 서로 동기화가 깨지기 쉽다.
- 이 함수는 `requireAuth()`(throw 시맨틱, Server Action/Route Handler 전용)를 재사용하지 않고 별도로 둔다 — 실패 시 throw가 아니라 redirect한다. 이유: page.tsx는 에러를 캐치해 `ErrorPayload`로 번역하는 채널이 아니라, 실패를 곧바로 라우팅 결과로 처리해야 하는 채널이다.
- 이 함수는 인증 필요 여부와 관리자 role 필요 여부를 하나의 함수로 처리하고, role 유무에 따라 별도 함수를 만들지 않는다 — 이유: 두 검사 모두 같은 세션 조회(`getAuth()`) 결과 위에서 갈리는 조건일 뿐이라, 별도 함수로 쪼개면 세션 조회 로직이 두 곳에 중복된다.
- 이 함수는 React `cache()`로 감싼다 — 세션 조회를 페이지 렌더링 요청당 1회로 제한한다. 이유: page 게이트와 아래 service 데이터 게이트가 같은 렌더 패스 안에서 각자 세션을 다시 조회하면 `cache()` 없이는 DB 왕복이 중복된다.
- 이 함수는 내부에서 `getAuth()`를 그대로 재사용한다 — `getAuth()`가 page.tsx(Server Component render) 안에서 호출해도 안전한 이유(무-side-effect 성질, 공식 문서 근거)는 `src/CLAUDE.md` "인증 토큰" 참고, 여기 반복 안 함. `token` 단일 쿠키 결정이 이 설계가 성립하는 전제조건이다.
- 이 함수는 인증 존재 여부를 먼저 확인하고, 그 다음에 role을 확인한다 — 순서를 바꾸지 않는다. 이유: 순서를 바꾸면 미인증 유저가 role-mismatch로 오분류돼 "Redirect 목적지" 규칙(재로그인 가능/불가능 구분)이 깨진다 — 미인증 상태에서는 role 자체가 없으므로 role 체크가 먼저 오면 그 분기를 통과 못 하고 엉뚱한 목적지로 갈 수 있다.
- 관리자 페이지(`admin/*`)를 포함해 인증·인가가 필요한 모든 page.tsx가 이 함수를 예외 없이 호출한다 — 기존 3곳의 인라인 코드도 이 함수 호출로 교체한다, 예외로 남겨두지 않는다. 이유: 규칙과 어긋난 레퍼런스 코드가 남으면 문서의 강제력이 없어진다.

## Redirect 목적지

- 미인증(세션 없음/만료) 실패는 `/login`으로 보낸다 — 이유: 로그인하면 통과할 수 있는 상태이므로 로그인 폼으로 바로 유도한다.
- 인증은 됐지만 role 불일치(관리자 아님) 실패는 `/`으로 보낸다 — `/login`으로 보내지 않는다. 이유: 로그인해도 통과 못 하는 상태라 로그인 화면을 보여줄 이유가 없다.
- 두 실패를 하나의 목적지로 합치지 않는다 — 이유: 원인이 다르면 사용자가 취할 수 있는 다음 행동도 다르다(재로그인 가능 vs 불가능).

## Service 레이어 방어(defense-in-depth)

- 관리자 전용 데이터 또는 특정 사용자 소유 데이터를 다루는 service 함수는, 그 데이터를 호출하는 page.tsx가 이미 게이트를 통과했더라도 내부에서 인가를 다시 확인한다 — page 게이트 하나만 믿고 생략하지 않는다. 이유: `src/server/services/CLAUDE.md`가 이미 services를 "DAL(비즈니스 로직 + DB 접근 + 인가)"로 정의하고 있고, service 함수는 향후 다른 page/action에서 재사용될 수 있어 그 시점의 page 게이트 존재를 전제할 수 없다.
- 이 인가 재확인은 page 게이트와 별도의 세션 조회를 새로 만들지 않는다 — 같은 렌더 패스 안이면 위 `cache()` 덕분에 추가 DB 비용 없이 재확인이 가능하다.
- 관리자 전용 데이터와 특정 유저 소유 데이터를 같은 service 함수가 같이 다뤄야 하는 경우(예: admin은 전체 조회, 유저는 자기 소유만)의 파라미터 형태는 지금 정하지 않는다 — 현재 코드에 그런 인스턴스가 없다(`admin/orders/page.tsx`가 아직 빈 스텁). 실제로 그 필요가 생기는 시점에 그 자리에서 재검토한다(가정만으로 미리 만들지 않는다, `src/server/services/CLAUDE.md` 트랜잭션 섹션과 같은 원칙).

## Gotchas

- React `cache()`의 dedupe 범위는 Server Component render tree 기준이다 — page 게이트와 그 아래 service 재확인이 "같은 렌더 패스"일 때만 DB 재조회가 안 생긴다는 전제가 성립한다. 같은 service 함수를 나중에 route.ts나 Server Action에서도 호출하게 되면, 그 경로에서는 `cache()`가 이 dedupe를 보장한다고 가정하지 않는다 — 그 경로용 세션 조회 비용은 별도로 계산한다.

## 관련 문서

- Proxy/Server Action 원칙: `src/CLAUDE.md` (Critical Convention, "Proxy에 위임하지 않는다")
- 인증 토큰 아키텍처(access/refresh 폐기, `token` 단일 쿠키, `getAuth()` no-side-effect 근거): `src/CLAUDE.md`("인증 토큰")
- 기존 세션 조회 함수(`getUser`/`getAuth`/`requireAuth`) 계약: `src/server/services/CLAUDE.md`
