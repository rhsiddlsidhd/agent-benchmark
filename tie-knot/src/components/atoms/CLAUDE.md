# CLAUDE.md — src/components/atoms/

> Last updated: 2026-07-18

## Scope

- **이 프로젝트의 파운데이션 프리미티브 레이어.** "물리적으로 더 못 쪼갠다"가 기준이 아니라 "이 프로젝트가 더 안 쪼개기로 했다"가 기준이다(`src/components/CLAUDE.md` 핵심 원칙 2 참고). 두 갈래:
  1. shadcn/Radix CLI로 설치된 산출물 — 파일 하나가 여러 하위 요소를 묶은 복합 시스템(`sidebar.tsx`가 `Sidebar`/`SidebarContent`/`SidebarProvider` 등을 한 파일에 묶음)이어도 통째로 atom.
  2. 커스텀 프리미티브 — 다른 컴포넌트를 조합하지 않고 그 자체로 완결되는 것(Typography류). 조합이 하나라도 있으면 atom 자격 없음(molecules 소관).
- **다른 컴포넌트를 import해서 조합하지 않는다** — 조합이 있는 순간 molecules/organisms 소관이다. 도메인 로직·데이터 페칭 없음(당연히, 이 레벨엔 조합 자체가 없으므로).

## Structure

```
src/components/atoms/
├── button.tsx
├── dialog.tsx        # 복합 시스템(Root/Trigger/Content 등)이어도 통째로 atom
├── sidebar.tsx         # 위와 동일
├── typoqraphy.tsx        # 커스텀 프리미티브(오타, Gotchas 참고)
└── ...                     # 완전 flat, 하위 폴더 없음
```

## Critical Convention

- **완전 flat 구조** — 하위 폴더를 만들지 않는다.
- 파일명은 **소문자 kebab-case**(shadcn/Radix 라이브러리 표준을 그대로 따름, Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`의 PascalCase 컴포넌트 규칙과 다른 이 폴더만의 예외).
- 비즈니스 로직·테마 확장(Tailwind/CVA) 외의 기능을 추가하지 않는다.

## Gotchas

- `typoqraphy.tsx` — "typography" 오타. shadcn CLI로 설치되는 정식 컴포넌트가 아니라 커스텀 프리미티브인데, 오타 때문에 shadcn 산출물처럼 보임 — 리네임 대상(`typography.tsx`, 코드 리팩토링은 추후 진행 예정). import하는 모든 파일(Header/Footer 등) 같이 고쳐야 해서 파급 범위 있음.

## 관련 문서

- 상위 3단계 정의 및 순수성 원칙: `src/components/CLAUDE.md`
- 조합이 시작되는 다음 단계: `src/components/molecules/CLAUDE.md`
