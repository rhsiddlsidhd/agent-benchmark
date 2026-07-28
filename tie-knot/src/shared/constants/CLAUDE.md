# CLAUDE.md — src/shared/constants/

> Last updated: 2026-07-28

## Overview

도메인/전역 상수 전담, 파일당 목적 1개.

## Structure

```
src/shared/constants/
├── index.ts           # 배럴
├── product.ts       # PRODUCT_SORT_KEYS, PRODUCT_SORT_OPTIONS 등 상품 도메인 상수
├── theme.ts           # InvitationTheme, INVITATION_THEME_LABELS + getInvitationThemeOptions 헬퍼(관리자 폼 select용)
├── routes.ts           # 전체 라우트 경로 단일 소스 — 아래 Critical Convention 참고
└── ...                  # 목적당 파일 1개
```

## Critical Convention

- 파일명은 kebab-case, 목적명(기능/역할 기반 이름, 도메인명과 대비)으로 짓는다.
- `export const` 값을 재귀적으로 뜯어봤을 때 문자열/숫자/불리언 리터럴(또는 그 배열/lookup map)로만 이루어져 있으면 SCREAMING_SNAKE_CASE, 값 안에 함수·컴포넌트 참조·이종 필드 객체가 섞이면 camelCase(Global 문서의 식별자 케이스 규칙 — "map이냐 아니냐"가 아니라 "값이 끝까지 리터럴이냐"가 기준).
- 라우트 경로 문자열을 각 소비처(컴포넌트/서버 액션/`proxy.ts`)에 리터럴로 흩어 쓰지 않는다 — `routes.ts` 하나에 전체 라우트 경로를 정의하고 소비처는 이 상수만 참조한다, 같은 경로가 여러 곳에 독립적으로 타이핑돼 있으면 라우트 하나 바뀔 때 일부만 고치고 놓치는 드리프트가 구조적으로 생긴다. 동적 세그먼트(`products/[id]` 등)는 문자열 템플릿이 아니라 경로 빌더 함수로 제공한다(예: `routes.products.detail(id)`) — 문자열 템플릿 오타를 타입으로 막는다.
  - 예외: `src/proxy.ts`의 matcher 배열은 Next.js가 build-time에 정적 분석해 리터럴만 인식한다(변수/상수 참조는 무시됨, 공식 문서 근거) — matcher 안에서만 `routes.ts` 참조 없이 문자열 그대로 둔다.

## Gotchas

- `PRODUCT_SORT_OPTIONS`/`PRODUCT_PRICE_OPTIONS`/`PREMIUM_FEATURE_LABELS`/`INVITATION_THEME_LABELS`/`SUBMENU_PARENT_TITLES`는 값이 순수 리터럴(문자열)이라 SCREAMING_SNAKE_CASE 그대로 맞음 — `sidebar.ts`/`navigation.ts`의 camelCase 식별자(아이콘/함수 참조 섞인 값)와 헷갈려서 같이 고치지 않는다.
- `theme.ts`의 `PRODUCT_THEME_MAP`(상품ID→테마 하드코딩)은 제거됐다 — `product.model.ts`의 `theme` 필드(invitation discriminator 전용)로 대체, 관리자 폼에서 상품마다 직접 설정한다. `getThemeByProductId`도 같이 제거 — 소비처(`preview/[id]/page.tsx`)가 이제 `product.theme`를 직접 읽는다.

## 관련 문서

- 식별자 케이스 공통 규칙: `src/CLAUDE.md`
- 배럴 import 정책: `src/CLAUDE.md`
