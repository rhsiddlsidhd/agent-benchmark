# TODO

## 진행 방식

- 작업 항목 1개 = worktree 1개 = branch 1개 (`docs/GIT.md` worktree 규칙)
- 완료 → PR → `dev` merge → 로컬/원격 branch 삭제 → worktree remove
- 체크리스트 갱신은 `dev` 브랜치에서 진행
- branch prefix는 `docs/GIT.md` Common 표 기준 (`feat/fix/docs/refactor/chore/test`)

---

## 새 피처

- [ ] **상품 카테고리별 확장 설계 (quantity 옵션화 포함)** (2026-07-30 논의) — 현재 카테고리가 `invitation`(모바일 청첩장) 하나뿐이라 `ProductOptions.tsx:87`의 `quantity`가 `const quantity = 1`로 하드코딩(수량 선택 UI 자체 없음, 청첩장은 원래 1개 구매가 정석이라 지금은 정상). 답례품 등 실물 상품 카테고리가 추가되면 수량이 의미를 가지므로:
  - 착수 전 카테고리별 목데이터를 DB에 하나씩 실제로 insert해서 데이터 형태부터 확정(`product.service.ts`의 `category` discriminator 구조 활용, 현재 `invitation` 외 실 데이터 없음).
  - 그 다음 `Product` 스키마에 카테고리별 수량 정책 필드(예: `maxQuantity`/`quantitySelectable`) 추가 — 이름/shape는 목데이터 확정 후 결정(지금 확정하면 추측성 설계 위험, `docs: 문서 먼저 리팩토링 나중` 원칙과 동일 이유).
  - `ProductOptions.tsx`가 그 값 기준으로 수량 필드를 항상 노출하되 `maxQuantity===1`이면 `disabled` 고정("1개"), 그 외엔 선택 가능한 stepper로 렌더 — 카테고리 분기를 컴포넌트 if문이 아니라 product 데이터가 결정하게.
  - **(2026-07-30 발견한 선행 문제, PR #92로 이미 해소됨)** `category` 값이 `category.ts`/`product.model.ts`/`product.schema.ts` 3군데에 독립 하드코딩돼있던 동기화 리스크 — `category.ts`가 `PRODUCT_CATEGORIES`/`SUB_CATEGORY_MAP` 원본 배열을 갖고 model/schema가 그걸 import해서 참조하는 구조로 이미 전환 완료(확인: `product.model.ts:88` `enum: PRODUCT_CATEGORIES`, `product.schema.ts:8` `z.enum(PRODUCT_CATEGORIES)`). 이번 항목(quantity 옵션화) 착수 시 이 구조를 그대로 활용하면 됨 — 별도 조치 불필요.

---

## 버그 수정

- [ ] 없음

---

## 성능 개선

- [ ] 세부 항목 미정

---

## UI 수정

- [ ] 세부 항목 미정
