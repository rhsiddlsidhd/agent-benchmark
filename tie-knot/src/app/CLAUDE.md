# CLAUDE.md — src/app/

> Last updated: 2026-07-28

Next.js App Router 진입점 — 공유 `layout.tsx`/독립 `error.tsx` 근거가 있는 라우트를 그룹(`(folder)`)으로 묶어 섹션을 나눈다(그룹 목록·존재 근거는 아래 "라우트 그룹 구성" 참고). 괄호 폴더는 URL에 영향 없는 조직화 단위다. Route Handler(API) 세부 규칙은 `src/app/api/CLAUDE.md`에서 관리한다.

## Key Files

| File               | Purpose                                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `global-error.tsx` | root layout이 렌더 중 던지는 에러의 마지막 안전망 — `error.tsx`는 route segment 하위만 커버해서 root layout(`layout.tsx`) 자체 에러는 못 잡는다. 없이 배포하지 않는다(필수). |

root layout을 통째로 대체하기 때문에 생기는 제약:

| 제약              | 내용                                                                                                                                                                                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider 소멸     | root layout 자체엔 provider가 없지만 `(main)/layout.tsx`의 Provider/Toaster까지 같이 사라진다 — 렌더하는 컴포넌트는 provider 없이도 동작하는 self-contained 컴포넌트여야 한다(예: `organisms/ErrorFallback.tsx` — atoms만 조합, context 의존 없음) |
| CSS 재import 필요 | root layout이 담당하던 `globals.css` import도 같이 대체된다 — `global-error.tsx` 안에서 별도로 다시 import하지 않으면 스타일이 안 먹는다                                                                                                           |
| metadata 미지원   | `metadata`/`generateMetadata` export가 안 먹힌다 — Client Component 강제라서다, 필요하면 React `<title>` 컴포넌트로 대체한다(공식문서)                                                                                                             |

## 라우트 그룹 구성

라우트 그룹은 공유 `layout.tsx` 또는 독립 `error.tsx` 근거가 있을 때만 만든다 — 조직 편의만으로 만들지 않는다. "내 것" 계열 그룹(`(my-order)`, `(my-profile)` 등)은 그룹명과 폴더명을 동일하게 맞춘다 — URL엔 영향 없지만, 이름이 다르면 그 라우트를 찾을 때마다 "그룹은 my-X인데 폴더는 왜 X야"라는 탐색 비용이 생긴다.

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

- `layout.tsx`는 그 라우트 그룹의 페이지 셸(shell)을 구성한다 — 특정 페이지 하나에만 필요한 데이터 페칭/비즈니스 로직을 여기 두지 않는다(그건 `page.tsx`/`_hooks` 소관).
  - 하위 라우트그룹으로 갈수록 셸이 누적된다(예: `(main)/layout.tsx`가 Header+공지바 셸을 깔면, 그 안의 `(admin)/admin/layout.tsx`가 사이드바 셸을 한 겹 더 얹음).
  - 셸 전용 조각(`Header`/`AuthButtons`/`UserAccountNav`/`Footer`/`GuestbookModal`처럼 그 layout.tsx 하나만 쓰는 것)은 그 layout이 속한 라우트 그룹의 `_components/`에 둔다 — Zustand 구독 등 도메인 로직이 있어도 된다(라우트 그룹이 사실상의 소유자이므로).
  - 여러 layout이 겹치는 셸 조각(예: `SidebarLayout`이 admin/my-order/my-profile 3곳에서 쓰이던 것)은 공용 컴포넌트로 승격하지 않고 각 `layout.tsx`가 직접 정의한다 — 지금은 내용이 같아 보여도 각 레이어가 독립적으로 진화할 수 있어서다.
- 루트 `app/layout.tsx`만 metadata(SEO/OG/Twitter)·전역 CSS import·환경변수 검증을 담당한다 — 하위 `layout.tsx`에서 이걸 중복 정의하지 않는다.
- `error.tsx`와 `not-found.tsx`를 혼용하지 않는다 — `error.tsx`는 fetch 실패/예외 경계, `not-found.tsx`는 존재하지 않는 리소스 전용이다. 현재는 라우트 개별이 아니라 **라우트 그룹 단위**로 배치돼있다(`(main)/error.tsx`, `(main)/(products)/error.tsx`, `(admin)/error.tsx`, 루트 `not-found.tsx`) — 그룹 내 여러 라우트가 에러 경계를 공유해도 되면 그룹 레벨, 특정 라우트만 다른 처리가 필요하면 그 라우트에 개별 배치한다.
- `page.tsx`에 interface/순수함수/상수/서브 UI 컴포넌트/훅을 인라인으로 쌓지 않는다 — `_components`/`_types`/`_utils`/`_constants`/`_hooks`로 분리한다(새 라우트부터 적용, Gotchas 참고).
- **`page.tsx`는 Pages 단계만 담당한다** — 실제 데이터를 fetch/조립해서 Template(`src/client/components/templates/{Name}Template.tsx` 또는 그 라우트 `_components/{Name}Template.tsx`)에 props로 넘기는 것까지만 한다. organism을 배치(grid/flex/spacing 등)하는 코드가 하나라도 있으면 Template 추출이 필수다 — organism 딱 1개를 배치 코드 없이 그대로 렌더하는 경우에 한해서만 `page.tsx`가 직접 렌더할 수 있다. Template은 `layout.tsx`(라우트 그룹 셸)와 다른 층위다 — Template은 항상 그 layout.tsx 안에 중첩된다. (Template 자격 조건 자체 — 순수성, self-fetching 자식 있을 때 opt-out 등 — 은 `src/client/components/templates/CLAUDE.md` 소관.)
- `_components`/`_types`/`_utils`/`_constants`/`_hooks`를 폴더 + `index.ts`(컴포넌트는 `index.tsx`) 배럴 형태 외의 방식으로 만들지 않는다 — 폴더 안 파일이 1개뿐이어도 예외 없이 이 형태를 유지한다. **배럴은 `page.tsx`/`layout.tsx`가 직접 소비하는 파일만 재export하면 된다** — 같은 폴더 안 다른 파일에서만 내부적으로 쓰이고 `page.tsx`/`layout.tsx`가 직접 import 안 하는 파일(예: `_components/Navigation.tsx`가 `_components/LocationSection.tsx` 내부에서만 쓰이는 경우)은 배럴에 안 올려도 된다 — 배럴 목적이 "그 라우트 밖에서 이 폴더에 뭐가 있는지 알려주는 것"이지 폴더 안 모든 파일을 강제로 노출하는 게 아니다.
- **`page.tsx`/`layout.tsx`/`error.tsx`/`not-found.tsx`/`proxy.ts`는 `export default`를 쓴다** — Next.js가 강제하는 파일 컨벤션이다.

### 라우트(URL) 세그먼트 네이밍

새 라우트 세그먼트(폴더명)를 지을 때 아래 4가지를 따른다 — 기존 세그먼트를 지금 일괄 소급 변경하지는 않는다.

- **소문자 + kebab-case 고정** — camelCase/snake_case 안 씀. 하이픈만 검색엔진이 단어 구분자로 인식한다.
- **명사 위주, 동사는 관용적으로 굳은 것만 예외 허용** — REST 자원 경로는 명사가 기본(`products`, `my-orders`). "행위 자체가 화면"인 경우만 동사/동사구 예외 허용(`login`, `signup`, `search`, `products/new`).
- **약어는 "어휘화(lexicalized)"된 것만 허용** — 기준: 비개발자가 줄임말인 줄 모를 만큼 이미 굳어졌는가. `id`/`api`/`url`/`info`/`faq`는 허용, `pw`/`addr`/`qty`류는 풀스펠링으로 짓는다(예: 새로 짓는다면 `change-pw`가 아니라 `change-password`).
- **복수=컬렉션, 단수=단일 리소스** — 목록/여러 건 다루는 경로(`products`, `users`, `my-orders`)는 복수형, 설정·액션·단일 인스턴스 화면(`my-profile`, `payment`, `dashboard`, `settings`)은 단수형.

## References

즉시 로드(`@import`) 아님 — 트리거 열 키워드에 해당하는 작업일 때만 해당 문서를 읽는다.

| 문서        | 위치                              | 트리거                                  | 요약                     |
| ----------- | ---------------------------------- | ----------------------------------------- | ------------------------ |
| `CLAUDE.md` | `src/shared/constants/`            | 라우트 경로 문자열(`routes.ts`) 상수화, 승격된 상수 확인 시 | 상수 컨벤션  |
| `CLAUDE.md` | `src/shared/utils/`                | 승격된 순수함수 확인 시                   | 순수함수 컨벤션          |
| `CLAUDE.md` | `src/client/hooks/`                | 승격된 훅 확인 시                         | 훅 컨벤션                |
| `CLAUDE.md` | `src/shared/types/`                | 승격된 타입 확인 시                       | 타입 컨벤션              |
| `CLAUDE.md` | `src/client/components/`           | 컴포넌트 조직 구조 확인 시                | Atomic Design 조직 구조  |
| `CLAUDE.md` | `src/client/components/templates/` | Templates(페이지 전체 배치) 세부 규칙 확인 시 | template 컨벤션      |
| `CLAUDE.md` | `src/app/api/`                     | Route Handler 세부 규칙 확인 시           | Route Handler 컨벤션     |
| `CLAUDE.md` | `src/server/actions/`              | Server Actions 확인 시                    | Server Action 컨벤션     |
| `CLAUDE.md` | `src/server/`                      | 응답/에러 계약(Route Handler) 확인 시     | 성공/에러 응답 빌더 계약 |
| `CLAUDE.md` | `src/client/`                      | 응답/에러 계약(Client fetch) 확인 시      | fetcher 계약             |
