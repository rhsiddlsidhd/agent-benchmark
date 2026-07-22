# CLAUDE.md — src/components/molecules/

> Last updated: 2026-07-18

## Overview

`molecules/`는 atoms(및/또는 다른 molecule) 2개 이상을 조합해 만든, 단일 책임의 단순 기능 단위를 모아두는 곳이다 — 순수(presentational)해야 하며 도메인 로직·데이터 페칭·Server Actions 의존은 금지된다(`src/components/CLAUDE.md` 핵심 원칙 1).

organism과의 경계는 "완성됐냐"가 아니라 "단순한가 복잡한가"다(핵심 원칙 3, 원본 Atomic Design 기준) — 책임이 하나뿐이면 그 자체로 완성돼 바로 쓰여도 molecule이다. 예: `TextField`(라벨+입력 필드 하나)는 완성돼서 바로 쓰이지만 책임이 단일하니 molecule — `FormField`(children 꽂아야 완성되는 골격)도 단일 책임이라 molecule("미완성 골격이냐 완성품이냐"는 판단 기준이 아니다). 조합 결과가 여러 책임을 동시에 지게 되면(예: 필드 여러 개를 한데 묶은 폼 섹션) organisms 소관이다(`src/components/organisms/CLAUDE.md` 참고).

## Structure

- **완전 flat 구조 — 하위 폴더를 만들지 않는다**(atoms와 동일 이유, Gotchas 참고 — 서브폴더가 "규칙 예외존"으로 오해되는 걸 원천 차단).

```
src/components/molecules/
├── index.ts               # 배럴 — export *
├── FormField.tsx        # Label(atom)+Alert(molecule) 조합, children 꽂혀야 완성 — 단일 책임
├── Alert.tsx               # Typography(atom) 조합
├── TextField.tsx            # FormField(molecule)+Input(atom) 조합, 완성돼 바로 쓰임 — 단일 책임(입력 필드 하나)이라 organism 아님
├── BaseSelect.tsx            # Select 계열 atom들만 조합, options만 꽂으면 그대로 완성 — 역시 단일 책임
└── ...                         # PascalCase
```

## Critical Convention

- 파일명/export는 PascalCase.
- 소비자가 라우트 1곳뿐인 molecule을 미리 여기로 승격하지 않는다 — 그 라우트의 `_components/` 안에 로컬로 둔다. 라우트 2곳 이상이 실제로 재사용할 때만 승격. 단, 유일한 소비자가 라우트가 아니라 이미 이 폴더/organisms에서 공유 중인 다른 컴포넌트라면 이 규칙 대상이 아니다 — 그 컴포넌트의 구현 디테일로 보고 그냥 여기 둔다(예: `DateField`/`AddressField`/`ImageField`의 유일한 소비자는 `BasicInfoSection`인데, `BasicInfoSection` 자체가 라우트 2곳이 공유하는 `CoupleInfoFormView`의 하위 조각이라 승격 보류 대상이 아니다 — `src/components/CLAUDE.md` 핵심 원칙 1 참고).

## Gotchas

- 이름-바꿔치기 재export 파일(내부 로직 없이 다른 컴포넌트를 도메인스러운 이름으로만 재export)을 만들지 않는다 — 과거 `ProductThumbnail.tsx`가 `CloudImage.tsx`를 그대로 재export하는 1줄짜리 alias였다(Product 도메인 로직 0개, 소비자도 도메인 무관하게 씀).
- `CloudImage.tsx` — Cloudinary라는 인프라에 의존하지만 비즈니스 도메인(Product/Order 등)엔 안 묶여있다 — 인프라 의존은 순수성 위반이 아니므로 그대로 유지.
- `RadioField.tsx`, `SwitchField.tsx` — `FormField`를 안 쓰고 atoms만 직접 조합해서 라벨까지 자체 처리하는 molecule이다. "...Field"라는 이름만 보고 어디 소속인지 판단하지 않는다 — 위치는 이름이 아니라 실제 조합 복잡도(단순=molecule, 복잡=organism)로 판단한다.

## 관련 문서

- 상위 4단계 정의 및 순수성 원칙: `src/components/CLAUDE.md`
- 더 복잡한 다음 단계: `src/components/organisms/CLAUDE.md`
- 라우트 전용 승격 대기 공간: `src/app/CLAUDE.md`
