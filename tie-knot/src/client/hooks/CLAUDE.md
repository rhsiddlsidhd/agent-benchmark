# CLAUDE.md — src/client/hooks/

> Last updated: 2026-07-18

## Overview

프로젝트 자체 로직 React 커스텀 훅 전담, 외부 SDK 결합 훅은 제외.

## Structure

```
src/client/hooks/
├── index.ts               # 배럴
├── useAuth.ts             # Zustand 구독 + SWR fetch 조합 패턴
├── useCoupleInfoForm.ts     # 라우트 2곳(couple-info/, order/edit/)이 공유하는 오케스트레이션 — 각 라우트 컨테이너가 이 훅만 호출
└── ...                       # 훅 1개당 파일 1개
```

## Critical Convention

- 파일명은 camelCase, `use` 접두사 필수 — 데이터 페칭 훅은 도메인을 PascalCase로 이어붙이고(`useCoupleInfo.ts`), 페칭 외 공유 로직 훅은 목적을 PascalCase로 이어붙인다(`useCountdown.ts`).
- **"use client" 지시어를 파일 최상단에 고정한다 — 예외 없다.** 훅은 정의상 React hook을 호출하므로 client 전용이다. 호출하는 쪽 컴포넌트가 이미 client 경계 안이라서 괜찮겠거니 하고 생략하지 않는다 — `index.ts` 배럴이 형제 파일 전체를 하나의 모듈 그래프로 묶기 때문에, 이 파일 하나가 경계 선언 없이 hook을 쓰면 그 배럴을 조금이라도 참조하는 아무 Server Component에서나 빌드 에러가 난다(Gotchas 참고).

## Gotchas

- 없음

## 관련 문서

- 식별자 케이스 공통 규칙: `src/CLAUDE.md`
- 외부 SDK 초기화 훅의 실제 위치, 배럴 import 정책, 추상화 네이밍 규칙(`useCoupleInfoForm` 등): `src/CLAUDE.md`
- lib과의 배치 경계 상대측: `src/lib/CLAUDE.md`
