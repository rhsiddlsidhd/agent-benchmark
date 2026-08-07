# CLAUDE.md — src/app/(main)/(products)/products/

> Last updated: 2026-07-29

## Overview

`/products/[category]`(목록)와 `/products/[category]/[id]`(상세) — 카테고리 라우팅 규칙 전담.

## Critical Convention

- 카테고리는 경로 세그먼트로 구분한다(`/products/[category]`, `routes.products.byCategory`) — 상품 상세는 `/products/[category]/[id]`로 그 아래 중첩한다. Next.js는 같은 레벨의 형제 dynamic segment가 서로 다른 이름을 갖는 걸 허용하지 않는다("You cannot use different slug names for the same dynamic path", 공식 문서 근거) — `[category]`와 `[id]`를 형제로 두면 이 제약에 걸려서, `[id]`를 `[category]` 하위로 중첩했다.
- 새 카테고리 추가 절차(타입 확장부터 시작)는 `src/shared/constants/CLAUDE.md` 참고 — `product-category.ts`가 단일 소스다.
