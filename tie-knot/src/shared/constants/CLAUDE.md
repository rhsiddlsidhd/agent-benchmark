# CLAUDE.md — src/shared/constants/

> Last updated: 2026-07-28

## Overview

도메인/전역 상수 전담, 파일당 목적 1개.

## Structure

```
src/shared/constants/
├── index.ts           # 배럴
├── product.ts       # PRODUCT_SORT_KEYS, PRODUCT_SORT_OPTIONS 등 상품 도메인 상수
├── product-category.ts # PRODUCT_CATEGORIES/SUB_CATEGORY_MAP/ProductCategory/SubCategory/라벨 — 카테고리 타입·상수 단일 소스
├── theme.ts           # InvitationTheme, INVITATION_THEME_LABELS + getInvitationThemeOptions 헬퍼(관리자 폼 select용)
├── routes.ts           # 전체 라우트 경로 단일 소스 — 아래 Critical Convention 참고
└── ...                  # 목적당 파일 1개
```

## Critical Convention

- 파일명/파일당 목적 1개 원칙은 `src/shared/CLAUDE.md` 공통 규칙 참고.
- `export const` 값을 재귀적으로 뜯어봤을 때 문자열/숫자/불리언 리터럴(또는 그 배열/lookup map)로만 이루어져 있으면 SCREAMING_SNAKE_CASE, 값 안에 함수·컴포넌트 참조·이종 필드 객체가 섞이면 camelCase(Global 문서의 식별자 케이스 규칙 — "map이냐 아니냐"가 아니라 "값이 끝까지 리터럴이냐"가 기준).
- `(typeof X)[number]`로 배열/맵에서 타입을 파생시킬 땐 그 타입 선언을 원본 값과 그 값을 소비하는 다른 값(라벨 `Record` 등) 사이에 끼워 넣지 않는다 — 원본 값들과 그로부터 파생된 값들을 전부 위로 모으고, `typeof` 파생 타입 선언은 파일 맨 아래에 모은다. 타입은 런타임에 지워지므로 선언 위치와 무관하게 전방 참조가 항상 안전하다 — `product-category.ts`가 이 순서의 기준 예시다.
- 라우트 경로 문자열을 각 소비처(컴포넌트/서버 액션/`proxy.ts`)에 리터럴로 흩어 쓰지 않는다 — `routes.ts` 하나에 전체 라우트 경로를 정의하고 소비처는 이 상수만 참조한다, 같은 경로가 여러 곳에 독립적으로 타이핑돼 있으면 라우트 하나 바뀔 때 일부만 고치고 놓치는 드리프트가 구조적으로 생긴다. 동적 세그먼트(`products/[id]` 등)는 문자열 템플릿이 아니라 경로 빌더 함수로 제공한다(예: `routes.products.detail(id)`) — 문자열 템플릿 오타를 타입으로 막는다.
  - 예외: `src/proxy.ts`의 matcher 배열은 Next.js가 build-time에 정적 분석해 리터럴만 인식한다(변수/상수 참조는 무시됨, 공식 문서 근거) — matcher 안에서만 `routes.ts` 참조 없이 문자열 그대로 둔다.

## Gotchas

- `PRODUCT_SORT_OPTIONS`/`PRODUCT_PRICE_OPTIONS`/`PREMIUM_FEATURE_LABELS`/`INVITATION_THEME_LABELS`/`SUBMENU_PARENT_TITLES`는 값이 순수 리터럴(문자열)이라 SCREAMING_SNAKE_CASE 그대로 맞음 — `sidebar.ts`/`navigation.ts`의 camelCase 식별자(아이콘/함수 참조 섞인 값)와 헷갈려서 같이 고치지 않는다.
- `product-category.ts`의 `ProductCategory`/`SUB_CATEGORY_MAP`은 카테고리 타입·상수의 단일 소스다 — 새 카테고리를 추가할 땐 여기부터 넓힌다. `src/server/models/product.model.ts`가 이 타입/상수를 그대로 re-export하고, `products/[category]` route의 `generateStaticParams()`/카테고리 검증(`isProductCategory`, `src/shared/utils/category.ts`)이 전부 이 타입을 기준으로 삼으므로 여기 안 넓히면 하위가 다 어긋난다(`src/app/(main)/(products)/products/CLAUDE.md` 참고). 카테고리 관련 순수 함수는 `src/shared/utils/category.ts`에 별도로 있다 — 상수·타입은 여기, 함수는 그쪽으로 나뉘어 있음에 주의(`src/shared/utils/CLAUDE.md` 참고).
