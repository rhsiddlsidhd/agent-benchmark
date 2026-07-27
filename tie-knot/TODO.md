# TODO

## 진행 방식

- 작업 항목 1개 = worktree 1개 = branch 1개 (`docs/GIT.md` worktree 규칙)
- 완료 → PR → `dev` merge → 로컬/원격 branch 삭제 → worktree remove
- 체크리스트 갱신은 `dev` 브랜치에서 진행
- branch prefix는 `docs/GIT.md` Common 표 기준 (`feat/fix/docs/refactor/chore/test`)

---

## 이월 항목

- [ ] **PortOne 결제수단 매핑 코드 실제 검증** (구 Stage B #10 잔여분 — 스키마 재설계 자체는 PR #50으로 완료됨) — `methodDetail` discriminated union 스키마는 반영됐지만 실제 결제 응답이 그 스키마에 맞게 매핑되는지 아직 검증 안 됨. PortOne 스토어에 테스트 결제가 0건이라 확인 불가능했던 게 원인.
  - **막힌 지점**: `npm run dev`가 `MONGO_TEST_URI` 없이 실제 Atlas DB(`DB_USER`/`DB_PASSWORD`)에 붙는 것으로 확인됨(격리된 로컬 DB 아님) — 이 DB가 프로덕션/공유 dev/버려도 되는 테스트용 중 어느 것인지 확인되기 전엔 Playwright로 실제 체크아웃을 진행할 수 없음.
  - **필요한 것**: 어느 DB인지 확인 후 알려주면, 결제 1건 만들어 실제 매핑 코드 검증 진행.

---

## Stage C — 신기능/UI (병렬, 미착수)

- [ ] 세부 항목 미정 (추후 별도 정리)
