# CLAUDE.md — src/components/atoms/

> Last updated: 2026-07-18

## Overview

`atoms/`는 더 이상 쪼갤 수 없는 개별 UI 요소를 모아두는 곳이다 — 두 갈래로 구성된다: shadcn/Radix CLI 산출물(파일 하나가 여러 하위 요소를 묶은 복합 시스템, 예: `sidebar.tsx`)과, 다른 컴포넌트를 조합하지 않고 그 자체로 완결되는 커스텀 프리미티브(Typography류). 다른 컴포넌트를 import해서 조합하지 않으며, 도메인 로직·데이터 페칭도 없다.

molecule과의 경계는 "누가 조합했는가"다(`src/components/CLAUDE.md` 핵심 원칙 2) — shadcn/Radix 산출물은 조합 주체가 외부 라이브러리라 "물리적으로 더 못 쪼갠다"가 기준이 아니어도 atom 자격이 있고, 커스텀 프리미티브는 조합이 하나라도 있으면 atom 자격이 없다(molecules 소관).

## Structure

```
src/components/atoms/
├── index.ts               # 배럴 — export *
├── button.tsx
├── dialog.tsx        # 복합 시스템(Root/Trigger/Content 등)이어도 통째로 atom
├── typography.tsx        # 커스텀 프리미티브(조합 없음)
└── ...                     # 완전 flat, 하위 폴더 없음
```

## Critical Convention

- **완전 flat 구조** — 하위 폴더를 만들지 않는다.
- 파일명은 **소문자 kebab-case**(shadcn/Radix 라이브러리 표준을 그대로 따름, Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`의 PascalCase 컴포넌트 규칙과 다른 이 폴더만의 예외).
- 비즈니스 로직·테마 확장(Tailwind/CVA) 외의 기능을 추가하지 않는다.

## Gotchas

- 2026-07-22, `index.ts` 배럴 추가 — `src/CLAUDE.md`의 src 전체 배럴 정책을 여기도 예외 없이 적용. 소비처 91곳 전부 `@/components/atoms/{file}` 개별 경로에서 `@/components/atoms`로 전환 완료. `next build`로 실제 검증함 — `calendar.tsx`/`carousel.tsx`/`sidebar.tsx`(내부에서 hook 씀)도 전부 자체 `"use client"`가 이미 있어서 배럴화해도 문제없었다(hook 파일에 경계 선언 누락되면 배럴 전체가 깨지는 문제는 `src/hooks/CLAUDE.md` Gotchas 참고 — atoms는 여기 해당 안 됨).
- `grid.tsx`(구 `Grid`)는 결국 완전히 해체돼 삭제됐다 — atom/molecule/organism 축(축 A)은 "무엇을 조합하는가"로 판단하는데, Grid는 조합 대상이 아니라 "공간적으로 어떻게 배치하는가"(CSS `display: grid`)만 다뤄서 이 축 자체와 직교하는 문제였다(atom도 template도 아님, 실제로 admin에선 `Card`(atom)를, `ProductGrid`에선 `ProductCard`(organism)를 감싸 대상이 매번 달랐다). 컴포넌트로 감싸 재사용하는 대신 그 배치 클래스(`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`)를 소비처 3곳(`organisms/ProductGrid.tsx`, admin `dashboard`/`premium-features` `page.tsx`) 각자가 직접 `<section className="...">`으로 인라인하는 걸로 정리했다 — `slot` prop(호출부마다 고유 문자열을 지어 `data-slot`에 넘겼지만 실제로 읽는 CSS/테스트 셀렉터가 0곳이던 죽은 prop)도 이걸로 자연히 없어졌다.
- `titled-section.tsx`(구 `SectionLayout`)는 `grid.tsx`와 같이 `layout/`에서 여기로 옮겨졌었지만, 다시 삭제됐다 — 축 A(조합 여부) 판단만 하고 축 B(공용 vs 라우트 전용)를 놓친 실수였다. 실제 소비자 6곳이 전부 `(preview)/preview/[id]/_components/` 하나뿐이라 애초에 atoms 자격이 없었다. title/subTitle 텍스트를 직접 하드코딩하던 것도 `atoms/typography.tsx`의 `TypographyEyebrow`(신규)/`TypographyLead` 조합으로 바뀌면서 atom(조합 없음) 자격도 잃어 molecule 성격이 됐다 — `(preview)/preview/[id]/_components/EyebrowSection.tsx`(라우트 전용, prop명도 `title`/`subTitle`→`eyebrow`/`heading`으로 개명)로 이동 완료.

## 관련 문서

- 상위 4단계 정의 및 순수성 원칙: `src/components/CLAUDE.md`
- 조합이 시작되는 다음 단계: `src/components/molecules/CLAUDE.md`
