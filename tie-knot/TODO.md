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
