# src/

> Last updated: 2026-07-22

## Overview

`src/`는 이 프로젝트 애플리케이션 코드 루트다. `app/`(라우트)·컴포넌트·훅·유틸 등 전체 구현이 이 아래 있다. 폴더 2개 이상에 걸치는 교차 컨벤션(식별자 케이스 등)을 여기서 다룬다 — 한 폴더 안에서 끝나는 규칙은 각자 CLAUDE.md 소관.

## Critical Convention

- **식별자 케이스**: 타입/인터페이스는 PascalCase, 함수/변수는 camelCase다. `export const`의 값을 재귀적으로 뜯어봤을 때 문자열/숫자/불리언 리터럴(또는 그 배열/lookup map)로만 이루어져 있으면 SCREAMING_SNAKE_CASE로 export한다 — 단일 값이든 여러 값 나열이든 키→리터럴 값 lookup map이든 "값이 끝까지 리터럴이냐"가 기준이다. 값 안에 함수·컴포넌트 참조·이종 필드 객체가 하나라도 섞이면 camelCase다. 위치가 `constants/`든 파일 내부 로컬이든 무관하게 적용한다.
- 파일명은 kebab-case가 기본이다(`utils/`, `constants/`, `types/`, `lib/{서비스}/` 등) — 컴포넌트/훅은 예외로 각 폴더 CLAUDE.md의 아티팩트별 케이스를 따른다(컴포넌트 PascalCase, 훅 camelCase+`use` 접두사).
- 같은 아티팩트 타입끼리 파일명 케이스가 겹치지 않게 짓는다 — 파일명만 보고 컴포넌트인지 훅인지 유틸인지 구분할 수 있어야 한다.
- `{목적}` 기반 파일(도메인 무관 범용 카테고리 — `utils/`, `constants/{목적}.ts`, `hooks/use{목적}.ts` 등)에는 도메인/라우트가 드러나는 이름을 쓰지 않는다 — 이름이 도메인에 종속되면 재사용 가능 범위를 파일명만으로 오판하게 된다(예: `movieFormatter.ts` 금지).

## Gotchas

- 없음.
