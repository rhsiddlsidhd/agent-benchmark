# CLAUDE.md — src/context/

> Last updated: 2026-07-18
> 이 폴더는 Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md` 소관 밖(프로젝트 고유 선택) — 전역 상태 관리 레이어.

## Scope

- **여러 위치(라우트/컴포넌트 트리)가 공유해야 하는 React Context 기반 클라이언트 상태.** 전역이지만 Zustand로 옮길 만큼 앱 전체 범위는 아니고, 특정 도메인/UI 트리에 한정된 상태(예: 상품 필터)에 쓴다.

## Structure

```
src/context/
├── createStateContext.tsx   # Provider+useContext 페어를 만드는 제네릭 팩토리(도메인 무관)
└── productFilter/            # 팩토리를 실제로 쓰는 도메인 하나
    ├── type.ts                # State/Action 타입
    └── reducer.ts              # reducer + Provider/hook export(팩토리 호출)
```

## Critical Convention

- 새 Context 도메인을 추가할 때 `createStateContext.tsx`를 직접 복붙해 새 팩토리를 만들지 않는다 — 기존 팩토리를 import해서 쓴다(제네릭이라 도메인 무관 재사용 가능).
- 도메인 폴더 안 파일은 `type.ts`/`reducer.ts`로 고정한다 — 폴더명이 이미 도메인을 특정하므로 파일명에 도메인명을 반복하지 않는다(`productFilter/productFilterType.ts` 금지).
- Provider/hook은 reducer.ts에서 `createStateContext` 호출 결과로 export한다 — 별도 `provider.tsx` 파일로 쪼개지 않는다(지금까지는 파일 1개로 충분했음).

## Gotchas

- 없음.

## 관련 문서

- 전역 상태(Zustand)와의 경계: `src/store/CLAUDE.md` — 앱 전체 범위면 Context가 아니라 Zustand(`src/store/`)로 간다.
- 상태 범위 확장 순서(로컬→Context→Zustand) 원칙: `src/CLAUDE.md`
