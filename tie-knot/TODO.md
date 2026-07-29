# TODO

## 진행 방식

- 작업 항목 1개 = worktree 1개 = branch 1개 (`docs/GIT.md` worktree 규칙)
- 완료 → PR → `dev` merge → 로컬/원격 branch 삭제 → worktree remove
- 체크리스트 갱신은 `dev` 브랜치에서 진행
- branch prefix는 `docs/GIT.md` Common 표 기준 (`feat/fix/docs/refactor/chore/test`)

---

## 새 피처

- [ ] **결제수단 6종으로 확장** (카드/가상계좌/계좌이체/휴대폰 기존 4종 + 간편결제·상품권 신규 2종) — `PaymentMethodSelector.tsx`, `constants/payment.ts`(`PAY_METHOD`), `payment.model.ts`/`order.model.ts` enum, `my-orders/page.tsx` 라벨 전부 반영 완료(2026-07-28). PayPal/Alipay/편의점 3종은 dev 채널(KG이니시스)이 지원 안 해서 제외 확정(`이니시스 V2에서 지원하지 않는 결제 수단` 에러로 실제 확인됨) — 나중에 채널 계약 추가되면 그때 재검토.
- [ ] Stage C 신기능/UI (병렬, 미착수) — 세부 항목 미정, 추후 별도 정리
- [ ] **결제 워크플로우에서 `couple-info` 입력을 분리(payment 이후로)** — 지금은 `couple-info`(청첩장 콘텐츠 입력, 신랑/신부·결혼식 정보·갤러리)가 결제 전 필수 게이트다: `Order.coupleInfoId`가 `required: true`(`order.model.ts`)라 coupleInfo 없이는 주문 자체가 생성 불가, `ProductSummary`의 "구매하기"가 무조건 `routes.coupleInfo`로 먼저 보내고, `payment/page.tsx`는 `?q={coupleInfoId}` 없으면 렌더 자체를 거부한다. 이 결합이 잘못됐다고 판단 — 논의 결과(2026-07-29) 방향:
  - 근거: `coupleInfoId`는 가격(`ProductSnapShot.pricing`)에 영향 없음 — 결제 전에 반드시 알아야 할 정보가 아니라 주문 후 채워도 되는 콘텐츠. 무거운 폼(계좌 정보까지 포함)을 결제 직전에 강제하면 이탈 위험. `my-orders/edit/_components/CoupleInfoForm.tsx`가 이미 "주문목록 → 폼 입력(update)" 패턴을 구현해놔서, CREATE 쪽도 같은 패턴(결제 완료 → 주문목록에서 안내 → 폼 라우팅에서 POST)으로 맞추면 됨.
  - 비용: `Order.coupleInfoId`를 `required: false`로(불변조건 약화, `getActiveOrderInfoByCoupleInfoId` 등 이 필드로 역조회하는 로직 전부 nullable 대응 필요) / "결제완료·정보입력 대기" order status 신설 / `payment/page.tsx`가 `q`(coupleInfoId) 대신 product/cart(`order.store.ts`의 `CheckoutItem`) 기반으로 렌더하도록 변경 / 결제만 하고 정보 영영 안 채우는 케이스 운영 정책 필요(비즈니스 판단, 엔지니어링만으론 결정 불가).
  - 라우팅: `(checkout)/couple-info`(현재 create 진입점)는 개념상 더 이상 체크아웃 단계가 아니므로 `(my-order)` 그룹 쪽(기존 `my-orders/edit`와 같은 자리)으로 재배치돼야 함. **식별자가 `coupleInfoId`→`orderId`로 바뀐다** — 지금은 coupleInfo를 먼저 만들고 그 id로 order를 만들지만, 새 흐름은 order가 먼저 생기므로 진입 시점엔 coupleInfoId가 없고 orderId만 있다. `useCoupleInfoForm`(`searchParams.get("q")`로 create/edit 공용 처리)의 create 모드가 이 의미 변화를 반영해야 함 — 정확한 URL/라우트 이름은 구현 시점에 결정.
  - `delivery-info`(현재 mock, 같은 `(checkout)` 그룹)도 실제 구현 시 동일 함정(무거운 폼을 결제 전에 강제)에 안 빠지도록 이 논의를 같이 참고할 것.
  - 착수 전 제품 담당자 컨펌 필요 — 비용 항목 중 운영 정책은 순수 기술 결정이 아님.

---

## 버그 수정

- [ ] **PortOne 결제수단 매핑 코드 실제 검증** (구 Stage B #10 잔여분 — 스키마 재설계 자체는 PR #50으로 완료됨) — `methodDetail` discriminated union 스키마는 반영됐지만 실제 결제 응답이 그 스키마에 맞게 매핑되는지 아직 검증 안 됨. PortOne 스토어에 테스트 결제가 0건이라 확인 불가능했던 게 원인.
  - **DB 확인 완료**: `new-invitation-cluster`(Atlas)는 개발자 전용 dev DB, 고객 데이터 없음 — 현재 product 상품 자체가 아직 노출 안 된 상태라 고객 트래픽도 없음. Playwright 실결제 테스트로 인한 오염 위험 없음, 블로커 해제.
  - **결제창 호출 필수 파라미터 누락 버그 3건 수정(2026-07-28)**: `src/client/hooks/usePortOnePayment.ts`의 `PortOne.requestPayment()` 호출에서 발견 — `productType`(휴대폰 결제 시 이니시스 V2 필수) 누락, `virtualAccount`(가상계좌 결제 시 필수) 누락, `easyPay.easyPayProvider`(간편결제 시 필수, `KAKAOPAY`로 고정) 누락. Playwright로 6개 결제수단 전부 결제하기 버튼까지 태워보며 발견·수정 완료 — 수정 후 6개 전부 결제창 정상 호출 확인(신용카드는 카드번호 입력 화면까지, 간편결제는 카카오페이 브릿지 오픈까지 확인).
  - **다음 단계(대기)**: 실제 결제 1건(카드번호 직접입력 완주)까지 끝내서 PortOne 응답의 `methodDetail`이 DB(`payment.model.ts`)에 스키마대로 저장되는지까지는 아직 미검증 — 카드번호 입력 화면 도달까지만 확인하고 완주는 보류함.

---

## 성능 개선

- [ ] 세부 항목 미정

---

## UI 수정

- [ ] **PaymentMethodSelector 라디오 UI 6종 대응** — 기존 4종 라디오 목록에 간편결제/상품권 옵션 추가(아이콘: `Wallet`/`Gift`), 기존 라디오 스타일 그대로 유지. `PaymentMethodSelector.test.tsx` 렌더링/상호작용 테스트 동반 작성 완료(2026-07-28).

---

## 컨벤션 정합화

3개 병렬 조사(서버 레이어/클라이언트 컴포넌트·라우팅/shared·client-util)로 34개 위반 항목 발견(2026-07-29) — 리스크 낮은 순으로 Phase 분리, Phase 1개 = branch 1개 = PR 1개(`docs/GIT.md` 원칙). 상세는 각 Phase PR 설명 참고.

- [ ] **Phase 1 — 서비스 레이어 데이터 정합성/에러 처리**(`refactor/services-data-integrity`, 최우선) — `runValidators: true` 누락(6곳), mongoose 에러 AppError 미포장, `.lean()` ObjectId 미변환(2곳), ObjectId 형식 검증 누락(2곳), `auth.service.ts`의 `getAuth()`가 인프라 예외까지 삼켜 `null` 리턴하는 문제(DB 장애→미로그인 오분류 위험) 등 실제 버그 위험 수정.
- [ ] **Phase 2 — Server Action revalidate/에러 처리 누락**(`refactor/actions-revalidate-error`) — `toggleProductLike`/`completePayment` revalidate 누락, `incrementProductViews`/`logoutUser`/`clearUserEmailCookie` try/catch+`actionError` 누락.
- [ ] **Phase 3 — 모델 레이어 정리**(`refactor/models-cleanup`) — `coupleInfo.model.ts`/`guestbook.model.ts` 캐스팅 없는 `||` 가드, `product.feature.model.ts` 파일명 불일치.
- [ ] **Phase 4 — shared 상수 케이스/하드코딩/오배치**(`refactor/shared-constants-cleanup`) — `navigation.ts`/`sidebar.ts` SCREAMING_SNAKE_CASE 오적용(컴포넌트 참조 섞임) 3곳, `(admin)/error.tsx` 라우트 하드코딩, `useDaumPopup.ts` 오배치(`hooks/`→`client/lib/daum/`), `product-table-row.ts` 라우트 로컬로 강등.
- [ ] **Phase 5 — 배럴 import 정합화**(`refactor/barrel-import-fix`, Phase 6보다 먼저 머지) — molecules/organisms 내부 딥패스 import ~17곳.
- [ ] **Phase 6 — 컴포넌트 계층 재분류**(`refactor/component-tier-reclassify`, Phase 5 이후 분기) — `ProductGrid`/`ProductFilters`가 props 대신 Context 직접 구독(핵심 원칙 1 위반) 수정, `LoginEntryButton` organisms→molecules 강등, `ComingSoonPage` organisms→templates 승격.
- [ ] **Phase 7 — page.tsx Template 추출**(`refactor/page-template-extraction`) — `my-orders`/`admin/products`/`products/[category]/[id]`/`products/[category]`/`(main)`/`payment/success` 6개 라우트, 라우트당 커밋 분리.
