# TODO

## AdultToggle 제거 → 카드 단위 19+ 블러 게이트로 전환

### 문제점

`AdultToggle`이 `RootLayout` 헤더에 전역으로 떠 있는데, 실제로 `include_adult` 값은 `/search`·`/discover` route handler에만 영향을 줌(홈/상세는 애초에 이 값을 안 씀 — TMDB `/movie/popular` 등 목록 엔드포인트 자체가 `include_adult` 파라미터를 받지 않음). 대부분의 페이지에서 눌러도 아무 효과가 없어 UX상 부적합 판단.

### 결정 사항(grilling으로 확정)

- 전역 토글 완전 제거. `/search`·`/discover` 둘 다 `include_adult=true` 고정 조회로 전환(옵트인 없이 항상 전체 조회).
- TMDB `adult` 필드는 노골적 성인물(주로 헨타이 등 성인 애니메이션) 마커고, 한국 기준 19금 등급 드라마/예능(선정성·폭력성)은 안 잡힘 — 직접 TMDB API 조회로 검증 완료, 이 갭 알고 진행하기로 함.
- 토글 대신 **카드 단위** 블러 게이트 도입: `ContentCard`가 `adult` prop 받아서, `true`면 포스터 블러+스크림 오버레이("19+" + "탭하여 보기") 표시. 전역 상태(Context) 없이 카드별 로컬 `useState`.
- 해제 상태는 저장 안 함 — 새로고침/재방문마다 매번 블러로 리셋.
- 게이트 클릭 동작: 첫 클릭 = 블러만 해제(네비게이션 안 함), 두 번째 클릭부터 정상 네비게이션. 별도 버튼 없이 카드 전체 그대로 사용.
- 상세 페이지(`/movie/[id]`, `/tv/[id]`)는 게이트 미적용 — 원래도 토글 영향 밖이었던 부분이라 스코프 유지.

### 해결

`dev-orchestrator`(planner→implementer×6→qa) 파이프라인으로 3배치 7태스크 구현, 브랜치 `feat/adult-content-gate`(dev에서 분기).

**배치1** — ContentCard 19+ 블러 게이트(카드 루트를 `adult && !revealed`일 때 `<button>`으로 렌더해 리빌 전 네비게이션 차단, 리빌 후 `MotionLink`로 전환) / 카드 뷰모델(`CardItem`/`CardData`)에 `adult` 필드 추가 / `tmdb-client`(`searchMulti`/`discoverByGenre`) `include_adult: true` 하드코딩 + route handler 파라미터 제거 / PRD FR-7·ARCH §5.5·§9·신규 ADR-0005 문서 갱신.

**배치2** — `SearchExplorer`/`DiscoverExplorer`/`useSearchInfinite`/`useDiscoverInfinite`에서 `useAdultContent`·`includeAdult` 플러밍 제거 + `ContentCard`에 `adult` 전달 / `CarouselSection`에 `adult={item.adult}` 전달 + `layout.tsx`에서 Provider·Toggle 참조 제거.

**배치3** — `AdultContentContext.tsx`·`AdultToggle.tsx` 삭제(`src/context/` 폴더·`CLAUDE.md`는 보존 — 향후 다른 Context 추가 시 재사용), `ui/index.ts` 배럴 export 제거, 스테일 gotcha(`src/app/CLAUDE.md`, `src/context/CLAUDE.md`) 및 `buildQuery.ts` 주석 정리.

**검증**: 배치마다 QA(경계면 교차비교) 통과, 최종 배치에서 잔존 참조 0건·전체 타입체크·E2E 데이터 흐름(raw `adult` → 뷰모델 → `ContentCard` prop → 게이트)·route handler 하드코딩·스모크 테스트(홈/검색/디스커버 200) 전부 확인.
