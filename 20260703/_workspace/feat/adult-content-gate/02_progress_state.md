# 02_progress_state — feat/adult-content-gate

## Phase 2: 계획
- planner 완료. `01_planner_tasks.md` 3배치 7태스크. 미정 사항 3건 전부 사용자 확인 후 해결.

## 배치1 (4개 병렬) — 완료
- [x] ContentCard 19+ 블러 게이트 — worktree-agent-a27c21e5d39bfac52(1차 시도는 worktree provisioning 문제로 실패, 2차 재시도 성공). 카드 루트를 `adult && !revealed`일 때 `<button>`으로 렌더(리빌 후 `MotionLink`로 전환). 게이트 중 RatingBadge 숨김(계획에 없던 자체 판단, QA에서 합리적이라 확인).
- [x] 카드 뷰모델에 adult 필드 추가 — worktree `adult-field-card-vm`(자동 격리 worktree가 stale해서 수동 재생성함, merge-back 시 커밋 필요했음). `CardItem`/`CardData` + `movieToCard`/`tvToCard`/`toCardData`.
- [x] tmdb-client include_adult 상시 노출 + Route Handler 파라미터 제거 — worktree-agent-a05888c33b611ee48. `client.ts`(include_adult:true 하드코딩), `/api/discover`, `/api/search`.
- [x] 문서 갱신 (PRD/ARCH/ADR) — worktree-agent-afda3e9968af1fb97. `00_PRD.md`(FR-7 재작성), `01_ARCHITECTURE.md`(§5.5·§9), `02_ADR.md`(ADR-0005 신규). `03_DESIGN.md` 미변경.

**merge-back**: 4개 worktree 전부 uncommitted 상태 → 각각 커밋 후 `feat/adult-content-gate`로 순차 merge, 충돌 없음. worktree/브랜치 정리 완료.
**QA**: 통과. 경계면 5개 항목(adult prop 계약/미배선 안전성/tmdb-client 파급/문서-코드 정합/RatingBadge 숨김 판단) 전부 OK, 분해이슈 없음.

## 배치2 (2개 병렬) — 완료
- [x] 검색·디스커버 배선 전환 — worktree-agent-a1b8d4626c8ed96f7, 커밋 5a85405. Explorer 2종 + 훅 2종에서 includeAdult 플러밍 제거, adult 전달.
- [x] 홈·레이아웃 배선 전환 — worktree-agent-ac1565de28884ab8e, 커밋 6612ad6. `CarouselSection.tsx`에 `adult={item.adult}`, `layout.tsx`에서 Provider/Toggle 참조 제거. (두 태스크 모두 npm install 부작용으로 생긴 package-lock.json 변경은 커밋 전 되돌림.)

**merge-back**: 2개 브랜치 충돌 없이 merge, worktree/브랜치 정리 완료.
**QA**: 통과. adult prop 출처(raw/CardData/CardItem) 정확, 훅 시그니처 정합, layout 정리 완전, 배치3 삭제 대상 잔존 참조 0(배럴 export 제외 — 배치3 스코프). buildQuery.ts 스테일 주석 1건은 비차단 관찰.

## 배치3 (태스크 1개, 오케스트레이터 직접 처리) — 완료
- [x] AdultContentContext·AdultToggle 삭제 및 잔여 정리 — 커밋 5165832. `.tsx` 2개 삭제(`src/context/` 폴더+CLAUDE.md는 보존, 사용자 확인됨), `ui/index.ts` 배럴 export 제거, `src/app/CLAUDE.md`/`src/context/CLAUDE.md` 스테일 gotcha 정리, `buildQuery.ts` 스테일 주석도 같이 정리(배치2 QA 비차단 관찰 반영).

**QA(최종)**: 통과. 잔존 참조 0건, 삭제 스코프 정확, 전체 타입체크 통과, E2E 데이터 흐름 무결(raw `adult` → CardItem/CardData/raw → ContentCard adult prop → 게이트), route handler 하드코딩 확인, 스모크 테스트(홈/검색/디스커버 전부 200) 통과.

## 전체 완료 — 배치1·2·3 전부 QA 통과. 기능 종료.
