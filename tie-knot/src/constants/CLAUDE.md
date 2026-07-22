# CLAUDE.md — src/constants/

> Last updated: 2026-07-18

## Overview

도메인/전역 상수 전담, 파일당 목적 1개.

## Structure

```
src/constants/
├── index.ts           # 배럴
├── product.ts       # PRODUCT_SORT_KEYS, PRODUCT_SORT_OPTIONS 등 상품 도메인 상수
├── theme.ts           # PRODUCT_THEME_MAP + getThemeByProductId 헬퍼
└── ...                  # 목적당 파일 1개
```

## Critical Convention

- 파일명은 kebab-case, 목적명(기능/역할 기반 이름, 도메인명과 대비)으로 짓는다.
- `export const` 값을 재귀적으로 뜯어봤을 때 문자열/숫자/불리언 리터럴(또는 그 배열/lookup map)로만 이루어져 있으면 SCREAMING_SNAKE_CASE, 값 안에 함수·컴포넌트 참조·이종 필드 객체가 섞이면 camelCase(Global 문서의 식별자 케이스 규칙 — "map이냐 아니냐"가 아니라 "값이 끝까지 리터럴이냐"가 기준).

## Gotchas

- `PRODUCT_SORT_OPTIONS`/`PRODUCT_PRICE_OPTIONS`/`PREMIUM_FEATURE_LABELS`/`PRODUCT_THEME_MAP`/`SUBMENU_PARENT_TITLES`는 값이 순수 리터럴(문자열)이라 SCREAMING_SNAKE_CASE 그대로 맞음 — `sidebar.ts`/`navigation.ts`의 camelCase 식별자(아이콘/함수 참조 섞인 값)와 헷갈려서 같이 고치지 않는다.

## 관련 문서

- 식별자 케이스 공통 규칙: `src/CLAUDE.md`
- 배럴 import 정책: `src/CLAUDE.md`
