# CLAUDE.md — src/hooks/

> Last updated: 2026-07-18

## Scope

- **이 프로젝트 자체 로직을 담당하는 React 커스텀 훅** — Zustand 구독 + SWR fetch 조합, 폼 상태, UI 상태 등. 특정 외부 SDK 초기화 전용 훅(예: 카카오맵)은 여기 두지 않는다 — `src/lib/{서비스}/`가 소유한다(`src/lib/CLAUDE.md` 참고).

## Structure

```
src/hooks/
├── index.ts               # 배럴(향후 지향점, 아직 없음 — Gotchas 참고)
├── useAuth.ts             # Zustand 구독 + SWR fetch 조합 패턴
├── useCheckoutForm.ts
└── ...                       # 훅 1개당 파일 1개
```

## Critical Convention

- 파일명은 camelCase, `use` 접두사 필수(Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`).
- "use client" 지시어를 파일 최상단에 고정한다.
- 특정 외부 SDK 초기화에 결합된 훅은 이 폴더가 아니라 그 라이브러리 폴더(`src/lib/{서비스}/`)에 둔다 — 훅이라는 형태보다 "무엇을 감싸는가"가 배치 기준.
- 개별 파일을 직접 import하지 않는다 — `index.ts` 배럴을 통해서만 import한다(향후 지향점, 현재 미적용 — Gotchas 참고).

## Gotchas

- `use-mobile.ts` — kebab-case로 돼있어 camelCase 규칙 위반(shadcn 관례로 딸려온 파일). 리네임(`useMobile.ts`) 시 이 파일을 import하는 다른 shadcn 컴포넌트들도 같이 고쳐야 해서 파급 범위 확인 필요(코드 리팩토링은 추후 진행 예정).
- `index.ts` 배럴이 아직 없음 — 지금은 전부 개별 파일 직접 import. 배럴 도입은 향후 지향점이고, 기존 import 전체를 바꾸는 리팩토링은 별도로 진행 예정.

## 관련 문서

- 파일명 케이스: Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`
- 외부 SDK 초기화 훅의 실제 위치: `src/lib/CLAUDE.md`
