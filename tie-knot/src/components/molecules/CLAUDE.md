# CLAUDE.md — src/components/molecules/

> Last updated: 2026-07-18

## Scope

- **atoms 2개 이상을 조합한, 아직 완성되지 않은 작은 기능 단위.** "완성되지 않았다"는 건 이 자체로 페이지에 바로 쓰이는 게 아니라 뭔가(주로 `children`으로 받는 실제 콘텐츠/입력 요소) 더 꽂혀야 쓸모가 생긴다는 뜻이다 — 예: `FormField`는 `children`(실제 input)이 꽂혀야 완성되는 레이아웃 골격, 그 자체론 미완성.
- **순수(presentational)**해야 한다 — 도메인 로직·데이터 페칭·Server Actions 의존 금지(`src/components/CLAUDE.md` 핵심 원칙 1). 조합 대상은 원칙적으로 atoms다 — molecule을 조합하게 되면(예: `FormField`가 `Alert`를 조합) 그 결과가 여전히 "미완성 골격"으로 남는지 확인한다. 완성돼서 그 자체로 바로 쓰이는 결과물이 되면 organisms 소관이다(`src/components/organisms/CLAUDE.md` 참고).

## Structure

```
src/components/molecules/
├── FormField.tsx        # Label(atom)+Alert(molecule) 조합, children 꽂혀야 완성 — 미완성 골격
├── Alert.tsx               # Typography(atom) 조합
├── BaseSelect.tsx            # Select 계열 atom들만 조합, options만 꽂으면 그대로 완성(주의: Structure 참고)
└── ...                         # PascalCase, 2개 이상 도메인이 재사용하게 됐다고 소비자 1개짜리를 미리 승격하지 않음
```

## Critical Convention

- 파일명/export는 PascalCase(Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`).
- 소비자가 1개뿐인 molecule을 미리 여기로 승격하지 않는다 — 그 소비자(라우트의 `_components/` 또는 상위 organism) 안에 로컬로 둔다. 2개 이상이 실제로 재사용할 때만 승격(`src/utils/CLAUDE.md` 등과 동일 원칙).
- `BaseSelect`처럼 atom들만 조합해서 `options`(데이터) 하나만 꽂으면 그대로 완성되는 경우가 있다 — 이런 건 "미완성 골격" 정의에서 벗어나 보이지만, 완성되는 그 결과물 자체가 여전히 **작고 단일 기능**(선택 위젯 하나)이라 organism(완결된 화면 섹션)까지는 아니다. molecule 여부 판단은 "미완성이냐"보다 최종적으로 "**작은 단일 기능 조각이냐 vs 완결된 화면 섹션이냐**"가 우선한다 — 애매하면 이 기준으로 되돌아온다.

## Gotchas

- `PaymentButton.tsx`(소비자 1곳: `order/page.tsx`), `PaymentPendingOverlay.tsx`(소비자 1곳: `CheckoutForm.tsx`), `ProductLikeBadge.tsx`(소비자 1곳: `ProductSummary.tsx`) — 전부 도메인 결합(Payment/Product)돼있는데 소비자가 1곳뿐이라 애초에 여기 승격될 자격이 없었다. 그 유일한 소비자 쪽으로 인라인하거나 라우트 `_components/`로 이동 대상(코드 리팩토링은 추후 진행 예정).
- `ProductThumbnail.tsx` — 소비자 6곳(다중 재사용 자격 있음)이지만 Product 도메인에 결합돼있다 — molecule은 순수해야 하므로 `organisms/`로 승격 위치 자체를 옮겨야 한다(리네임 아니라 이동).
- `CloudImage.tsx` — Cloudinary라는 인프라에 의존하지만 비즈니스 도메인(Product/Order 등)엔 안 묶여있다 — 인프라 의존은 순수성 위반이 아니므로 그대로 유지.
- `__wedding/Subway.tsx` — 유일하게 하위 폴더(`__wedding/`)가 있고, 이름 자체가 도메인 결합(wedding) — 위 두 문제(폴더 구조+도메인 결합)가 겹친 케이스, 별도 검토 필요(코드 리팩토링은 추후 진행 예정).
- `RadioField.tsx`, `SwitchField.tsx` — 이름이 `organisms/fields/`의 `{Type}Field` 패턴과 똑같아서 그 폴더 소속처럼 보이지만, 실제로는 `FormField`를 안 쓰고 atoms만 직접 조합해서 라벨까지 자체 처리하는 molecule이다(그래서 여기 있는 게 맞음, 이동 대상 아님). 새 필드 만들 때 "...Field"라는 이름만 보고 organisms/fields 템플릿을 따라야 한다고 착각하지 않는다 — 위치와 구조는 실제 조합 방식(atoms만이면 molecule)으로 판단한다.

## 관련 문서

- 상위 3단계 정의 및 순수성 원칙: `src/components/CLAUDE.md`
- 완성품 다음 단계: `src/components/organisms/CLAUDE.md`
- 라우트 전용 승격 대기 공간: `src/app/CLAUDE.md`
