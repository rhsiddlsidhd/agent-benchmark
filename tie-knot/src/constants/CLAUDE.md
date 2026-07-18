# CLAUDE.md — src/constants/

> Last updated: 2026-07-18

## Scope

- **도메인 종속/전역 공통 상수** — 파일당 목적 1개(`navigation`, `page`, `payment`, `price`, `product`, `sidebar`, `theme`). 단순 상수뿐 아니라 그 상수에 종속된 룩업 헬퍼 함수(`theme.ts`의 `getThemeByProductId`)도 같은 파일에 둔다.

## Structure

```
src/constants/
├── index.ts           # 배럴(향후 지향점, 아직 없음 — Gotchas 참고)
├── product.ts       # PRODUCT_SORT_KEYS, PRODUCT_SORT_OPTIONS 등 상품 도메인 상수
├── theme.ts           # PRODUCT_THEME_MAP + getThemeByProductId 헬퍼
└── ...                  # 목적당 파일 1개
```

## Critical Convention

- 파일명은 kebab-case, 목적명(기능/역할 기반 이름, 도메인명과 대비)으로 짓는다.
- `export const` 값을 재귀적으로 뜯어봤을 때 문자열/숫자/불리언 리터럴(또는 그 배열/lookup map)로만 이루어져 있으면 SCREAMING_SNAKE_CASE, 값 안에 함수·컴포넌트 참조·이종 필드 객체가 섞이면 camelCase(Global 문서의 식별자 케이스 규칙 — "map이냐 아니냐"가 아니라 "값이 끝까지 리터럴이냐"가 기준).
- 개별 파일을 직접 import하지 않는다 — `index.ts` 배럴을 통해서만 import한다(향후 지향점, 현재 미적용 — Gotchas 참고).

## Gotchas

- `sidebar.ts`의 `ALL_NAVIGATE_ITEMS` — 값 안에 아이콘 컴포넌트 참조(`icon: LayoutDashboard`)가 섞인 구조 객체인데 SCREAMING_SNAKE_CASE로 돼있음. Global 규칙 위반, `allNavigateItems`로 리네임 대상.
- `navigation.ts`의 `NAVIGATION_BUTTONS` — 값 안에 `onClick` 함수가 섞인 객체 배열인데 SCREAMING_SNAKE_CASE. 같은 이유로 위반, `navigationButtons`로 리네임 대상.
- `PRODUCT_SORT_OPTIONS`/`PRODUCT_PRICE_OPTIONS`/`PREMIUM_FEATURE_LABELS`/`PRODUCT_THEME_MAP`/`SUBMENU_PARENT_TITLES`는 값이 순수 리터럴(문자열)이라 SCREAMING_SNAKE_CASE 그대로 맞음 — 위 두 개와 헷갈려서 같이 고치지 않는다.
- `index.ts` 배럴이 아직 없음 — 지금은 전부 개별 파일 직접 import. 배럴 도입은 향후 지향점이고, 기존 import 전체를 바꾸는 리팩토링은 별도로 진행 예정.
- (코드 리팩토링은 추후 진행 예정 — 지금은 문서만 정리)

## 관련 문서

- 파일명/식별자 케이스 일반 규칙: Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`
