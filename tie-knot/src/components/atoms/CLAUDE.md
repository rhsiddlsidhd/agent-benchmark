# CLAUDE.md — src/components/atoms/

> Last updated: 2026-07-18

## Scope

- **atom/molecule 경계는 "누가 조합했는가"다**(`src/components/CLAUDE.md` 핵심 원칙 2 참고). 두 갈래:
  1. shadcn/Radix CLI로 설치된 산출물 — 파일 하나가 여러 하위 요소를 묶은 복합 시스템(`sidebar.tsx`가 `Sidebar`/`SidebarContent`/`SidebarProvider` 등을 한 파일에 묶음)이어도 통째로 atom. 조합의 주체가 이 프로젝트 코드가 아니라 외부 라이브러리라 "물리적으로 더 못 쪼갠다"가 기준이 아니어도 atom 자격이 있다.
  2. 커스텀 프리미티브 — 다른 컴포넌트를 조합하지 않고 그 자체로 완결되는 것(Typography류). 이건 프로젝트가 직접 만들었으므로 "조합했는가"를 그대로 적용 — 조합이 하나라도 있으면 atom 자격 없음(molecules 소관).
- **다른 컴포넌트를 import해서 조합하지 않는다** — 조합이 있는 순간 molecules/organisms 소관이다. 도메인 로직·데이터 페칭 없음(당연히, 이 레벨엔 조합 자체가 없으므로).

## Structure

```
src/components/atoms/
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

- `grid.tsx`(구 `Grid`), `titled-section.tsx`(구 `SectionLayout`, 이름도 역할에 맞게 변경)는 원래 소속 없던 `src/components/layout/` 폴더에 있었다 — 다른 컴포넌트를 조합하지 않고 그 자체로 완결되는 커스텀 프리미티브라 atoms 기준(핵심 원칙 2)에 맞아 여기로 이동했다.

## 관련 문서

- 상위 3단계 정의 및 순수성 원칙: `src/components/CLAUDE.md`
- 조합이 시작되는 다음 단계: `src/components/molecules/CLAUDE.md`
