# CLAUDE.md — src/shared/utils/

> Last updated: 2026-07-18

## Overview

side-effect 없는 도메인-무관 순수 함수 전담.

## Structure

```
src/shared/utils/
├── index.ts        # 배럴
├── date.ts        # 날짜 포맷/카운트다운 계산
└── ...                   # 목적당 파일 1개
```

## Critical Convention

- 파일명/파일당 목적 1개 원칙은 `src/shared/CLAUDE.md` 공통 규칙 참고.
- DB 연결, 외부 API 호출, 파일시스템 접근, 브라우저 전용 side-effect(`window.open` 등) 있는 로직을 여기 두지 않는다 — 특정 외부 라이브러리/서비스를 감싸면 `src/server/lib/`(서버 전용) 또는 `src/client/lib/`(브라우저 전용), 특정 라이브러리를 감싸지 않는 순수 브라우저 API 호출(예: `open-app.ts`)이면 `src/client/utils/`로 옮긴다. 반대로 side-effect 없는 로직을 "npm 패키지를 쓴다"는 이유만으로 `lib/`에 두지 않는다.

## Gotchas

- 진단용 `console.error` 호출은 "side-effect 없음" 원칙 위반으로 안 친다(service/util 파일들 공통).


## 관련 문서

- side-effect 로직과의 경계: `src/server/lib/CLAUDE.md`(서버 전용), `src/client/lib/CLAUDE.md`(브라우저 전용)
- 테스트 작성 컨벤션(1차 커버 범위 우선순위): `docs/TESTING_GUIDELINE.md`
