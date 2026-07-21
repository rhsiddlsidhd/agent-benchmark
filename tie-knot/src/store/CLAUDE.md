# CLAUDE.md — src/store/

> Last updated: 2026-07-18
> 이 폴더는 Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md` 소관 밖(프로젝트 고유 선택) — 전역 클라이언트 상태(Zustand) 레이어.

## Scope

- **앱 전체 범위 클라이언트 상태.** 두 성격이 있다: 도메인 데이터 상태(`auth.store.ts`, `order.store.ts`)와 모달 UI 상태(`guestbook.modal.store.ts`, `admin.modal.store.ts`). 특정 UI 트리에만 한정된 상태는 여기가 아니라 `src/context/`(`src/context/CLAUDE.md` 참고).

## Structure

```
src/store/
├── index.ts                   # 배럴 — export *
├── auth.store.ts             # 도메인 데이터 상태
├── order.store.ts
├── guestbook.modal.store.ts    # 모달 UI 상태(open/type/payload)
└── admin.modal.store.ts
```

## Critical Convention

- 파일명은 도메인 데이터 상태면 `{도메인}.store.ts`, 모달 전용 UI 상태면 `{도메인}.modal.store.ts`로 구분한다 — 이 구분은 우연이 아니라 실제로 상태 성격(데이터 vs UI 열림/닫힘)이 다르기 때문이니 새 모달 상태를 `{도메인}.store.ts`에 합치지 않는다.
- 전부 named export(`export const useXStore`)로 통일한다 — `src/CLAUDE.md`의 `src/` 전체 default export 금지 규칙 참고.

## Gotchas

- 2026-07-22, `index.ts` 배럴 추가(소비처 21곳 전환). Zustand `create()`만 쓰고 React hook을 직접 import하지 않아 배럴화 안전 — `next build`로 검증.
- `auth.store.ts`만 한때 default export였다(다른 3개 store는 처음부터 named export) — `src/` 전체 default export 금지 규칙 정리하며 named export로 전환, 소비처 8곳(`import useAuthStore from "@/store/auth.store"` 형태)도 전부 `import { useAuthStore } from "@/store/auth.store"`로 같이 수정 완료.
- `order.store.ts`만 zustand `persist` 미들웨어(sessionStorage)를 씀 — 새로고침에도 유지돼야 하는 상태(주문 진행 중 데이터)라 그런 것으로 보이나, 다른 store엔 이 근거가 명시된 곳이 없다. 새 store에 persist를 넣을지는 "새로고침 생존 필요성"으로 그때그때 판단.
- `auth.store.ts`에 있던 `token` 필드는 제거됐다 — access token이 httpOnly 쿠키로 옮겨가면서 클라이언트가 토큰 값을 들고 있을 필요가 없어졌다(`src/CLAUDE.md` 참고). `setToken` 액션도 `setSession`으로 개명(더 이상 토큰을 세팅하는 게 아니라 `role`/`email`/`userId`만 세팅).

## 관련 문서

- 특정 UI 트리 한정 상태와의 경계: `src/context/CLAUDE.md`
- 상태 범위 확장 순서(로컬→Context→Zustand) 원칙: `src/CLAUDE.md`
