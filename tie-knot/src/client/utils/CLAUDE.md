# CLAUDE.md — src/client/utils/

> Last updated: 2026-07-27

## Overview

브라우저 전용 side-effect 유틸 전담 — 단, `src/client/lib/`과 달리 특정 외부 라이브러리/SDK를 감싸지 않는다. raw 브라우저 API(`window.open`/`location`/`matchMedia` 등)를 직접 쓰는 로직이 여기 온다. `src/shared/utils/`(side-effect 없는 순수 함수)와도 구분된다.

## Structure

```
src/client/utils/
├── index.ts        # 배럴
└── open-app.ts     # Tmap/NaverMap/KakaoMap 딥링크(window.open/location.href) — 특정 SDK 없이 raw 브라우저 API + URL 스킴만 씀
```

## Critical Convention

- 파일명은 kebab-case, 목적명으로 짓는다(`src/shared/utils/CLAUDE.md`와 동일 원칙).
- 특정 외부 라이브러리/SDK를 감싸게 되면 이 폴더가 아니라 `src/client/lib/{서비스명}/`으로 간다 — "브라우저 전용"이라는 이유만으로 여기 두지 않는다, 기준은 "SDK를 감싸는가"다.
- 서버 전용 코드(DB 드라이버, `next/headers` 등)를 이 트리에 두지 않는다.

## Gotchas

- 없음.

## 관련 문서

- 순수 함수와의 경계: `src/shared/utils/CLAUDE.md`
- 외부 SDK 래퍼와의 경계: `src/client/lib/CLAUDE.md`
