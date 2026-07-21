# CLAUDE.md — src/components/

> Last updated: 2026-07-18

## Overview

이 프로젝트의 컴포넌트 조직 구조를 정의한다. Brad Frost의 Atomic Design 원본 5단계(atoms/molecules/organisms/templates/pages) 중 pages만 빼고 그대로 차용한다 — pages 역할은 `src/app/**/page.tsx`가 대신한다(`src/app/CLAUDE.md` 참고). 각 티어 세부 정의는 `src/components/atoms/CLAUDE.md`/`molecules/CLAUDE.md`/`organisms/CLAUDE.md`/`templates/CLAUDE.md` 소관.

컴포넌트는 두 개의 독립된 축으로 판단한다 — 헷갈리면 이 구분으로 돌아온다: **축 A**(atom/molecule/organism/template, 조합 복잡도)와 **축 B**(공용 `src/components/{tier}/` vs 라우트 전용 `_components/`, 물리적 위치). 이 파일의 Critical Convention이 두 축의 판단 기준과 예외를 정의한다.

## Critical Convention

- **축 A — 티어 분류.** 원본 Atomic Design 기준 그대로 쓴다: 조합 복잡도/책임 범위로 판단한다. "몇 곳에서 재사용되는가"는 이 축과 무관하다. **"무엇을 조합하는가"를 묻지 않고 "공간적으로 어떻게 배치하는가"(예: CSS grid 배치)만 다루는 건 이 축 자체와 직교하는 문제라 어느 티어에도 억지로 끼워 넣지 않는다** — 소비처가 매번 직접 인라인한다(구 `atoms/grid.tsx` 사례, `atoms/CLAUDE.md` Gotchas 참고).
- **축 B — 물리적 위치.** 원본에 없는, 이 프로젝트가 독자적으로 추가한 것 — 순수성 원칙(핵심 원칙 1)과 소비자 수(`src/app/CLAUDE.md` 컨테이너 승격 규칙)로 판단한다. 어떤 티어든 축 B는 동일하게 적용된다. **소비자 수는 직접 호출자가 아니라 실제로 몇 개 라우트에서 최종 렌더되는지로 전이적으로 센다** — 중간에 몇 겹을 거치든(공용 컴포넌트든 라우트 로컬이든) 무관하게 최종 도달 라우트 개수만 본다. 예: organism X의 유일한 소비자가 라우트 로컬 Template Y 하나뿐이고 Template Y도 라우트 1곳 전용이면, organism X도 실질 소비 라우트가 1곳이라 승격 보류 대상이다.
- 과거 `fields/`·`(preview)/` 서브폴더를 "예외존"처럼 다룬 게 혼란의 원인이었다 — 서브폴더에 있다는 사실 자체는 두 축 어느 쪽 판단에도 영향을 주지 않는다.
- **핵심 원칙 1 — atoms/molecules/organisms/templates 전부 순수(presentational)하다(축 B 관련).** 도메인 로직·데이터 페칭·Server Actions을 이 4단계 어디에도 두지 않는다 — props로만 데이터/핸들러를 받는다. 도메인 로직이 필요한 화면은 그 로직을 감싸는 **컨테이너**(`src/app/**/_components/{Name}.tsx`, 라우트 전용)가 순수 organism/molecule을 import해서 props를 채워 넣는 방식으로 만든다.
  - 예: `_components/LoginForm.tsx`(컨테이너 — `useActionState`+`useAuthStore`+`router.push` 처리) → `organisms/Form.tsx`(순수 — props로 필드/핸들러/에러만 받음) import.
  - 컨테이너 승격 규칙은 `src/app/CLAUDE.md`의 `_components/` 규칙과 동일: **소비자가 라우트(또는 그 라우트의 `layout.tsx`) 1곳뿐이면** 그 라우트의 `_components/`에 머문다. 순수 organism/molecule 자체가 2곳 이상의 라우트/컨테이너에서 재사용되면 그게 공용 자격의 근거다. 단, 유일한 소비자가 라우트가 아니라 **다른 공유 컴포넌트**(그 컴포넌트 자체가 이미 2곳 이상에서 쓰임)라면 이 승격-보류 규칙이 적용되지 않는다 — 그 하위 조각은 그냥 같은 공용 티어 폴더에 남는다(예: `DateField`/`AddressField`/`ImageField`의 유일한 소비자는 `BasicInfoSection`인데, `BasicInfoSection`은 라우트가 아니라 2개 라우트가 공유하는 `CoupleInfoFormView`의 하위 조각이라 `molecules/`에 그대로 남는다 — 라우트 전용 `_components`/`_utils`는 Next.js가 라우트 단위로 주는 private 폴더 개념이지 컴포넌트 단위로 확장할 근거가 없다).
  - 소비자 1곳이 `page.tsx`가 아니라 `layout.tsx`(라우트 그룹 셸)여도 축 B는 동일하게 적용된다 — 셸 조각 배치 규칙과 구체 사례(Header/AuthButtons/Footer/GuestbookModal 등)는 `src/app/CLAUDE.md` 참고. (`src/components/layout/`은 이 정리로 폐기됐다 — atoms/molecules/organisms 3단계 밖의 미분류 폴더였다.)
  - **컨테이너가 2곳 이상의 라우트/레이아웃에서 진짜 도메인 로직까지 겹치면(`SidebarLayout`처럼 여러 레이아웃이 같은 `useAuthStore` 조회+렌더를 반복), 억지로 공용 컴포넌트로 승격하지 않는다** — 각 레이아웃이 자기 파일 안에서 직접 정의한다(`(admin)/admin/layout.tsx`, `(my-order)/layout.tsx`, `(my-profile)/layout.tsx` 각각). 지금은 내용이 동일해 보여도 각 레이어가 독립적으로 진화할 수 있는 컨텍스트라, 공용 컴포넌트로 묶으면 나중에 레이어별로 갈라져야 할 때 오히려 인위적으로 갈라야 한다.
  - **컨테이너 로직 자체(순수 UI 말고)가 2곳 이상의 라우트에서 100% 동일하게 재사용돼야 하면, 그 로직을 `src/hooks/`의 커스텀 훅으로 뽑는다** — 각 라우트는 자기 `_components/`에 그 훅을 호출하고 순수 UI를 렌더하는 얇은 컨테이너를 각자 둔다("라우트당 컨테이너 1개" 원칙은 그대로 유지). 공유되는 순수 UI 쪽은 `organisms/`에 남되, 여러 컨테이너가 공유한다는 걸 이름으로 드러낸다(예: `CoupleInfoForm` → `organisms/CoupleInfoFormView.tsx` + `couple-info/_components/CoupleInfoForm.tsx` + `order/edit/_components/CoupleInfoForm.tsx`) — 이름 짓는 방법 자체는 `src/CLAUDE.md`의 추상화 네이밍 규칙 참고.
  - **예외 2 — 단순 페이지 이동은 `useRouter().push()` 대신 `<Link href>`(또는 `Button asChild`)로 쓰면 위반이 아니다.** 데이터 mutation 없이 그냥 다른 라우트로 이동만 하는 클릭 핸들러는 `next/link`로 대체 가능하면 그렇게 한다 — 그러면 애초에 컨테이너 분리가 필요 없어진다. mutation(폼 제출, store 쓰기 등) 뒤에 이어지는 조건부 리다이렉트는 이 예외 대상이 아니다(컨테이너 소관).
- **핵심 원칙 2 — atom/molecule 경계는 "누가 조합했는가"다(축 A 관련).** shadcn/Radix 산출물은 내부적으로 여러 하위 요소를 묶은 복합 시스템(`sidebar.tsx`, `dialog.tsx` 등)이어도 통째로 atom 취급한다 — "물리적으로 더 못 쪼갠다"가 기준이 아니라, **조합의 주체가 이 프로젝트 코드가 아니라 외부 라이브러리**라는 게 기준이다(원본 Atomic Design도 atom=우리가 안 쪼갠 것, molecule=우리가 atom을 조합해 만든 것이 전제라 실제로는 원본과 어긋나지 않는다). 커스텀 프리미티브(예: Typography)는 "다른 컴포넌트를 조합하지 않고 그 자체로 완결"되면 atom이다 — 이건 프로젝트가 직접 만들었으므로 "조합했는가"로 그대로 판단 가능.
- **핵심 원칙 3 — molecule/organism 경계는 "완성됐는가"가 아니라 "단순한가 복잡한가"다(축 A 관련, 원본 그대로).** Brad Frost 원본: molecule은 "relatively simple"(단일 책임의 단순 단위), organism은 "relatively complex... distinct section"(여러 책임을 묶은, 페이지에서 뚜렷이 구분되는 복잡한 구획)이다 — "이대로 바로 쓰이느냐"가 아니라 "책임이 하나냐 여러 개냐"로 판단한다. 예: `TextField`(라벨+입력 필드 하나, 단일 책임)는 그 자체로 완성돼 바로 쓰여도 molecule — `BasicInfoForm`(필드 여러 개+제출 로직을 묶은 폼 섹션 전체)이 organism이다.
- **핵심 원칙 4 — template은 "페이지 전체 배치"이지 organism의 확장판이 아니다(축 A 관련, 원본 그대로).** organism은 페이지 안의 한 구획(section)이고, template은 그 구획들을 모아 **페이지 하나 전체**를 배치한 것 — 원본 정의상 실제 데이터 없이 placeholder 성격 콘텐츠만 다룬다(이 프로젝트에선 "진짜 데이터 없이 props로만 완성된 콘텐츠를 받는다"로 구현). 세부 규칙(순수성, self-fetching 자식 있을 때 opt-out, page.tsx와의 경계)은 `src/components/templates/CLAUDE.md` 참고.

## 관련 문서

- Atoms 세부: `src/components/atoms/CLAUDE.md`
- Molecules 세부: `src/components/molecules/CLAUDE.md`
- Organisms 세부: `src/components/organisms/CLAUDE.md`
- Templates 세부: `src/components/templates/CLAUDE.md`
- 라우트 레이어/컨테이너 승격 규칙: `src/app/CLAUDE.md`
- 추상화 네이밍 규칙(공유 구현체 이름 짓는 법): `src/CLAUDE.md`
