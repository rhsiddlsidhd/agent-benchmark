# CLAUDE.md — src/components/templates/

> Last updated: 2026-07-21
> 신규 도입된 티어 — 아직 이 폴더에 실사례 없음(Gotchas 참고, 강제 소급 적용 안 함).

## Overview

`templates/`는 페이지 하나의 전체 배치(organism/molecule/atom을 모아 완성한 화면 전체 구조)를 모아두는 곳이다 — 진짜 데이터 없이 순수해야 한다(`src/components/CLAUDE.md` 핵심 원칙 1). organism과의 경계는 "범위"다 — organism은 페이지 안 한 구획(section), template은 그 구획들을 모은 페이지 전체. Brad Frost 원본은 이 레벨에서 실제 콘텐츠 대신 placeholder를 쓴다고 정의하는데, 이 프로젝트는 그걸 "진짜 fetch된 데이터 없이, 완성된 콘텐츠를 props로만 받는다"로 구현한다 — 데이터가 어디서 왔는지(fetch냐 하드코딩이냐)는 template이 몰라야 한다.

조합 대상 organism/molecule 중 단 하나라도 내부에서 자체 데이터 페칭(예: `useSWR`)을 한다면, 그 페칭 결과가 template 관점에선 "진짜 데이터"라서 순수성이 깨져 애초에 template으로 만들 수 없다 — 이런 경우 도입을 강제하지 않고 지금처럼 라우트 로컬 구성(`_components/`)을 그대로 유지한다(예: `(preview)/preview/[id]`의 `GuestbookSection`류 — `organisms/CLAUDE.md` Gotchas 참고).

## Structure

- **완전 flat 구조 — 하위 폴더를 만들지 않는다**(atoms/molecules/organisms와 동일 이유).

```
src/components/templates/
└── {Name}Template.tsx   # PascalCase + Template 접미사, 페이지 전체 배치
```

## Critical Convention

- 파일명/export는 PascalCase + `Template` 접미사 고정(예: `ProductCatalogTemplate.tsx`) — organism과 이름만 보고 구분되어야 한다.
- **이 폴더로 승격하는 건 2곳 이상의 라우트가 "의도적으로 동일한" 전체 배치를 공유할 때만이다.** 원본 정의상 template은 태생적으로 페이지 하나 전용인 경우가 압도적으로 많다 — 그래서 대부분의 template은 이 폴더가 아니라 그 라우트의 `_components/{Name}Template.tsx`(라우트 로컬)에 머문다. 시각적으로 비슷해 보인다는 이유만으로 승격하지 않는다 — `SidebarLayout` 전례(`src/app/CLAUDE.md`)와 동일 사유: 지금 같아 보여도 각 페이지가 독립적으로 진화할 수 있는 컨텍스트면 억지로 합치지 않는다.
- `page.tsx`가 언제 이 티어를 추출해야 하는지(추출 트리거 — organism 1개+배치 코드 없음 예외 외엔 필수)와, `layout.tsx`(라우트 그룹 셸)와의 층위 구분은 `src/app/CLAUDE.md` 소관 — 이 파일에서 중복 서술하지 않는다.

## Gotchas

- 신규 도입(2026-07-21) — 기존 라우트의 `page.tsx` 얇은 래퍼(organism을 배치 코드와 함께 바로 렌더하던 것들)를 지금 일괄 리팩토링하지 않는다. 새 라우트, 또는 컨테이너/순수 분리 리팩토링 대상이 되는 라우트부터 순차 적용한다(`src/app/CLAUDE.md`의 private 폴더 도입 때와 동일 정책).
- 구 `atoms/grid.tsx`는 이 티어 후보로도 검토됐으나 탈락했다 — template은 "페이지 전체" 배치인데 Grid는 페이지 안 한 섹션(구획)만 다뤄서 범위가 안 맞았다. 결국 컴포넌트 자체를 해체하고 소비처마다 배치 클래스를 인라인하는 걸로 정리됨(`src/components/atoms/CLAUDE.md` Gotchas 참고).

## 관련 문서

- 상위 4단계 정의 및 순수성 원칙, 축 A/축 B: `src/components/CLAUDE.md`
- 한 단계 아래(organism): `src/components/organisms/CLAUDE.md`
- Pages(`page.tsx`) 역할, private 폴더, layout.tsx 경계: `src/app/CLAUDE.md`
