# CLAUDE.md — src/app/

> Last updated: 2026-07-18
> 이 문서의 private 폴더(`_components`/`_types`/`_utils`/`_constants`/`_hooks`) 규칙은 **향후 지향점**이다 — 기존 라우트 대부분은 아직 이 구조를 안 쓴다(Gotchas 참고). 새 라우트/새 파일부터 적용한다.

Next.js App Router 진입점 — 라우트 그룹(`(main)`, `(auth)`, `(checkout)`, `(products)`, `(my-order)`, `(my-profile)`, `(admin)`, `(preview)`)으로 섹션을 나눈다. 괄호 폴더는 URL에 영향 없는 조직화 단위다. Route Handler(API) 세부 규칙은 `src/app/api/CLAUDE.md`에서 관리한다.

## Structure

- 라우트 전용 부속물(타입/순수함수/상수/서브 UI/훅)은 Next 공식 private 폴더(`_folder`)로 분리한다 — **필요한 것만** 생성, 빈 폴더 강제 금지. 목표 형태(`(main)/(checkout)/payment/` 기준):
  ```
  (main)/(checkout)/payment/
  ├── page.tsx              # 조립(JSX)만 — 아래 5종에서 import
  ├── _components/          # 라우트 전용 서브 UI
  │   ├── index.tsx         # 배럴
  │   ├── BuyerInfoCard.tsx
  │   ├── TermsAgreementCard.tsx
  │   └── CheckoutSubmitBar.tsx
  ├── _types/               # 라우트 전용 타입/interface
  ├── _utils/               # 라우트 전용 순수함수
  ├── _constants/           # 라우트 전용 상수
  └── _hooks/               # 라우트 전용 훅
  ```
- 2개 이상 라우트가 공유하는 순수함수/UI/훅/타입/상수를 라우트 폴더 안에 남겨두지 않는다 — 순수함수는 `src/shared/utils/`, UI는 `src/client/components/`, 훅은 `src/client/hooks/`, 타입은 `src/shared/types/`, 상수는 `src/shared/constants/`로 승격한다(각 폴더 CLAUDE.md 참고).

## Critical Conventions

- `layout.tsx`는 그 라우트 그룹의 페이지 셸(shell)을 구성한다 — 특정 페이지 하나에만 필요한 데이터 페칭/비즈니스 로직을 여기 두지 않는다(그건 `page.tsx`/`_hooks` 소관). 하위 라우트그룹으로 갈수록 셸이 누적된다(예: `(main)/layout.tsx`가 Header+공지바 셸을 깔면, 그 안의 `(admin)/admin/layout.tsx`가 사이드바 셸을 한 겹 더 얹음). 셸 전용 조각(`Header`/`AuthButtons`/`UserAccountNav`/`Footer`/`GuestbookModal`처럼 그 layout.tsx 하나만 쓰는 것)은 그 layout이 속한 라우트 그룹의 `_components/`에 둔다 — Zustand 구독 등 도메인 로직이 있어도 된다(라우트 그룹이 사실상의 소유자이므로). 여러 layout이 겹치는 셸 조각(예: `SidebarLayout`이 admin/my-order/my-profile 3곳에서 쓰이던 것)은 공용 컴포넌트로 승격하지 않고 각 `layout.tsx`가 직접 정의한다 — 지금은 내용이 같아 보여도 각 레이어가 독립적으로 진화할 수 있어서다.
- 루트 `app/layout.tsx`만 metadata(SEO/OG/Twitter)·전역 CSS import·환경변수 검증을 담당한다 — 하위 `layout.tsx`에서 이걸 중복 정의하지 않는다.
- `error.tsx`와 `not-found.tsx`를 혼용하지 않는다 — `error.tsx`는 fetch 실패/예외 경계, `not-found.tsx`는 존재하지 않는 리소스 전용이다. 현재는 라우트 개별이 아니라 **라우트 그룹 단위**로 배치돼있다(`(main)/error.tsx`, `(main)/(products)/error.tsx`, `(main)/(admin)/error.tsx`, 루트 `not-found.tsx`) — 그룹 내 여러 라우트가 에러 경계를 공유해도 되면 그룹 레벨, 특정 라우트만 다른 처리가 필요하면 그 라우트에 개별 배치한다.
- `page.tsx`에 interface/순수함수/상수/서브 UI 컴포넌트/훅을 인라인으로 쌓지 않는다 — `_components`/`_types`/`_utils`/`_constants`/`_hooks`로 분리한다(새 라우트부터 적용, Gotchas 참고).
- **`page.tsx`는 Pages 단계만 담당한다** — 실제 데이터를 fetch/조립해서 Template(`src/client/components/templates/{Name}Template.tsx` 또는 그 라우트 `_components/{Name}Template.tsx`)에 props로 넘기는 것까지만 한다. organism을 배치(grid/flex/spacing 등)하는 코드가 하나라도 있으면 Template 추출이 필수다 — organism 딱 1개를 배치 코드 없이 그대로 렌더하는 경우에 한해서만 `page.tsx`가 직접 렌더할 수 있다. Template은 `layout.tsx`(라우트 그룹 셸)와 다른 층위다 — Template은 항상 그 layout.tsx 안에 중첩된다. (Template 자격 조건 자체 — 순수성, self-fetching 자식 있을 때 opt-out 등 — 은 `src/client/components/templates/CLAUDE.md` 소관.)
- `_components`/`_types`/`_utils`/`_constants`/`_hooks`를 폴더 + `index.ts`(컴포넌트는 `index.tsx`) 배럴 형태 외의 방식으로 만들지 않는다 — 폴더 안 파일이 1개뿐이어도 예외 없이 이 형태를 유지한다. **배럴은 `page.tsx`/`layout.tsx`가 직접 소비하는 파일만 재export하면 된다** — 같은 폴더 안 다른 파일에서만 내부적으로 쓰이고 `page.tsx`/`layout.tsx`가 직접 import 안 하는 파일(예: `_components/Navigation.tsx`가 `_components/LocationSection.tsx` 내부에서만 쓰이는 경우)은 배럴에 안 올려도 된다 — 배럴 목적이 "그 라우트 밖에서 이 폴더에 뭐가 있는지 알려주는 것"이지 폴더 안 모든 파일을 강제로 노출하는 게 아니다.
- 파일명/식별자 케이스는 `src/CLAUDE.md`의 공통 규칙을 따른다.
- **`page.tsx`/`layout.tsx`/`error.tsx`/`not-found.tsx`/`proxy.ts`는 `export default`를 쓴다** — Next.js가 강제하는 파일 컨벤션이다.

## Gotchas

- 기존 라우트는 대부분 `page.tsx`가 `src/client/components/organisms/{Name}Form.tsx`를 바로 import하는 얇은 래퍼다 — 라우트 전용 스테이징 없이 처음부터 전역 `src/client/components/organisms/`에 들어가 있다. 이 구조를 지금 일괄로 되돌리지 않는다 — 새 라우트/새 기능부터, 그리고 컨테이너/순수 분리 리팩토링 대상이 되는 라우트부터 순차 적용(`login/`이 첫 사례: `_components/LoginForm.tsx`(컨테이너)가 `organisms/LoginForm.tsx`(순수)를 감쌈, `src/client/components/organisms/CLAUDE.md` Gotchas 참고). Templates 티어도 같은 정책 — 도입 시점/소급 범위는 `src/client/components/templates/CLAUDE.md` Gotchas 참고.
- `_components` private 폴더는 두 종류로 쓰인다 — 라우트 그룹 셸 전용과 페이지 전용. 둘 다 컨테이너/순수 분리가 끝난 라우트에 있다(각각 `index.tsx` 배럴 완비).
- `loading.tsx`는 프로젝트 전체에 0개 — 필요해지면 그때 이 문서에 기준을 추가한다(지금은 규정 안 함).
- `layout.tsx` 함수명 케이스가 파일마다 다름 — 루트/`(admin)/admin`은 `RootLayout`/`AdminLayout`(PascalCase), `(main)`/`(auth)`/`(preview)`는 전부 소문자 `layout`. Next.js는 `export default`라 이름 자체가 동작에 영향 없지만, 새로 만들 때 아무거나 따르지 말고 PascalCase(`{Scope}Layout`)로 통일하는 걸 권장 — 기존 3개 리네임은 코드 리팩토링 범위라 지금은 안 건드림.

## 관련 문서

- 식별자 케이스 공통 규칙: `src/CLAUDE.md`
- 승격된 순수함수: `src/shared/utils/CLAUDE.md`
- 승격된 훅: `src/client/hooks/CLAUDE.md`
- 승격된 타입: `src/shared/types/CLAUDE.md`
- 승격된 상수: `src/shared/constants/CLAUDE.md`
- 컴포넌트 조직 구조: `src/client/components/CLAUDE.md`
- Templates(페이지 전체 배치) 세부 규칙: `src/client/components/templates/CLAUDE.md`
- Route Handler 세부 규칙: `src/app/api/CLAUDE.md`
- Server Actions: `src/server/actions/CLAUDE.md`
- 응답/에러 계약: `src/server/CLAUDE.md`(Route Handler), `src/client/CLAUDE.md`(Client fetch)
