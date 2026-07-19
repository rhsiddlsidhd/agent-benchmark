# CLAUDE.md — src/hooks/

> Last updated: 2026-07-18

## Scope

- **이 프로젝트 자체 로직을 담당하는 React 커스텀 훅** — Zustand 구독 + SWR fetch 조합, 폼 상태, UI 상태 등. 특정 외부 SDK 초기화 전용 훅(예: 카카오맵)은 여기 두지 않는다 — `src/lib/{서비스}/`가 소유한다(`src/lib/CLAUDE.md` 참고).

## Structure

```
src/hooks/
├── index.ts               # 배럴
├── useAuth.ts             # Zustand 구독 + SWR fetch 조합 패턴
├── useCoupleInfoForm.ts     # 라우트 2곳(couple-info/, order/edit/)이 공유하는 오케스트레이션 — 각 라우트 컨테이너가 이 훅만 호출
└── ...                       # 훅 1개당 파일 1개
```

## Critical Convention

- 파일명은 camelCase, `use` 접두사 필수(Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`).
- "use client" 지시어를 파일 최상단에 고정한다.

## Gotchas

- `useCoupleInfoForm`과 `useNavigationGeo`는 훅으로 뽑힌 이유가 다르다 — 전자는 "2+ 라우트가 동일 오케스트레이션을 공유"(`src/components/CLAUDE.md` 컨테이너 승격 규칙), 후자는 애초에 "organism 안에 side-effect(fetch/geolocation)가 박혀 있어 순수성 원칙 위반"이 이유였다(추출 당시엔 `Navigation.tsx`가 `organisms/(preview)/`에 있었음 — 지금은 그 폴더 자체가 없어져서 `(preview)/preview/[id]/_components/Navigation.tsx`로 이동했지만, 훅은 그대로 유효). 소비자가 1곳뿐이어도 순수성을 지키려면 훅 추출이 맞다 — 훅 추출 여부를 "몇 곳에서 재사용하는가"만으로 판단하지 않는다.

## 관련 문서

- 파일명 케이스: Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`
- 외부 SDK 초기화 훅의 실제 위치, 배럴 import 정책, 추상화 네이밍 규칙(`useCoupleInfoForm` 등): `src/CLAUDE.md`
- lib과의 배치 경계 상대측: `src/lib/CLAUDE.md`
