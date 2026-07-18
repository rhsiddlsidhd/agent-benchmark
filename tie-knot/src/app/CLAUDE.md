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
- 2개 이상 라우트가 공유하는 순수함수/UI/훅/타입/상수를 라우트 폴더 안에 남겨두지 않는다 — 순수함수는 `src/utils/`, UI는 `src/components/`, 훅은 `src/hooks/`, 타입은 `src/types/`, 상수는 `src/constants/`로 승격한다(각 폴더 CLAUDE.md 참고).

## Critical Conventions

- `layout.tsx`는 organisms(`Header`, `SidebarLayout`, 각종 Modal 등)와 molecules(`AnnouncementBar` 등)를 조립해 그 라우트 그룹의 페이지 셸(shell)을 구성한다 — 특정 페이지 하나에만 필요한 데이터 페칭/비즈니스 로직을 여기 두지 않는다(그건 `page.tsx`/`_hooks` 소관). 하위 라우트그룹으로 갈수록 셸이 누적된다(예: `(main)/layout.tsx`가 Header+공지바 셸을 깔면, 그 안의 `(admin)/admin/layout.tsx`가 사이드바 셸을 한 겹 더 얹음).
- 루트 `app/layout.tsx`만 metadata(SEO/OG/Twitter)·전역 CSS import·환경변수 검증을 담당한다 — 하위 `layout.tsx`에서 이걸 중복 정의하지 않는다.
- `error.tsx`와 `not-found.tsx`를 혼용하지 않는다 — `error.tsx`는 fetch 실패/예외 경계, `not-found.tsx`는 존재하지 않는 리소스 전용이다. 현재는 라우트 개별이 아니라 **라우트 그룹 단위**로 배치돼있다(`(main)/error.tsx`, `(main)/(products)/error.tsx`, `(main)/(admin)/error.tsx`, 루트 `not-found.tsx`) — 그룹 내 여러 라우트가 에러 경계를 공유해도 되면 그룹 레벨, 특정 라우트만 다른 처리가 필요하면 그 라우트에 개별 배치한다.
- `page.tsx`에 interface/순수함수/상수/서브 UI 컴포넌트/훅을 인라인으로 쌓지 않는다 — `_components`/`_types`/`_utils`/`_constants`/`_hooks`로 분리한다(새 라우트부터 적용, Gotchas 참고).
- `_components`/`_types`/`_utils`/`_constants`/`_hooks`를 폴더 + `index.ts`(컴포넌트는 `index.tsx`) 배럴 형태 외의 방식으로 만들지 않는다 — 폴더 안 파일이 1개뿐이어도 예외 없이 이 형태를 유지한다.
- 파일명/식별자 케이스는 Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`를 따른다.

## Gotchas

- 기존 라우트는 대부분 `page.tsx`가 `src/components/organisms/{Name}Form.tsx`를 바로 import하는 얇은 래퍼다(예: `login/page.tsx` → `<LoginForm />`) — 라우트 전용 스테이징 없이 처음부터 전역 `src/components/organisms/`에 들어가 있다. 이 구조를 지금 되돌리지 않는다 — 새 라우트/새 기능부터 private 폴더 정책 적용.
- `_components` private 폴더를 실제로 쓰는 라우트는 `payment/` 1곳뿐이고, 그마저도 `index.tsx` 배럴이 없다(개별 파일 3개만 있음) — 이 정책의 "정식 예시"가 아직 없다는 뜻, 다음에 이 폴더를 건드릴 때 배럴부터 채운다.
- `loading.tsx`는 프로젝트 전체에 0개 — 필요해지면 그때 이 문서에 기준을 추가한다(지금은 규정 안 함).
- `layout.tsx` 함수명 케이스가 파일마다 다름 — 루트/`(admin)/admin`은 `RootLayout`/`AdminLayout`(PascalCase), `(main)`/`(auth)`/`(preview)`는 전부 소문자 `layout`. Next.js는 `export default`라 이름 자체가 동작에 영향 없지만, 새로 만들 때 아무거나 따르지 말고 PascalCase(`{Scope}Layout`)로 통일하는 걸 권장 — 기존 3개 리네임은 코드 리팩토링 범위라 지금은 안 건드림.

## 관련 문서

- 파일명/식별자 케이스: Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`
- 승격된 순수함수: `src/utils/CLAUDE.md`
- 승격된 훅: `src/hooks/CLAUDE.md`
- 승격된 타입: `src/types/CLAUDE.md`
- 승격된 상수: `src/constants/CLAUDE.md`
- 컴포넌트 조직 구조: `src/components/CLAUDE.md`
- Route Handler 세부 규칙: `src/app/api/CLAUDE.md`
- Server Actions: `src/actions/CLAUDE.md`
- 응답/에러 계약: `src/api/CLAUDE.md`
