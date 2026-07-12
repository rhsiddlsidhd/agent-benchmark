# TODO

## ScrollRail 드래그 핸들러 hit-box 누락

### 문제점

`ScrollRail`에서 컨테이너(overflow-hidden 뷰포트, `bg-blue-500`)와 트랙(`motion.ul`, `bg-red-500`)을 색으로 구분해보니, 드래그/클릭 핸들러가 red(트랙) 영역에서만 동작하고 blue(컨테이너) 영역에서는 죽어있었음.

### 원인

`useDragScroll`의 `trackProps`(`drag="x"` 포함 전체 핸들러)가 `containerRef`가 아니라 `trackRef`(움직이는 `motion.ul`)에만 스프레드되어 있었음. framer-motion의 `drag` 제스처는 pointerdown 리스너를 그 엘리먼트 자신에 붙이는 방식이라, pointerdown이 컨테이너 쪽(트랙 박스 바깥 — 트랙이 카드 폭/패딩 계산으로 컨테이너 전체를 정확히 못 덮는 서브픽셀 구간 등)에서 시작하면 이벤트가 부모→자식 방향으로는 버블링되지 않아 트랙의 리스너에 닿지 못함. 컨테이너는 트랙의 부모이므로 구조적으로 막혀 있었음.

### 해결

`src/hooks/useDragScroll.ts`
- `useDragControls()`로 드래그를 수동 시작 방식으로 전환
- 트랙(`trackProps`)에 `dragControls`, `dragListener: false` 추가 — 트랙 자체의 자동 pointerdown 리스너를 끔
- 신규 `containerProps.onPointerDown = (e) => dragControls.start(e)` 반환 — 컨테이너 전체(overflow-hidden 클리핑 영역 포함) 어디서 눌러도 드래그가 시작되도록 함

`src/components/ui/ScrollRail.tsx`: 컨테이너 `div`에 `containerProps` 스프레드 추가.

**검증**: playwright로 기존에 죽어있던 blue-only 지점(컨테이너 우측 끝)에서 드래그 시작 → `onDragStart/onDrag/onDragEnd` 정상 발화 확인. 일반 클릭(드래그 없이 카드 클릭) 시 네비게이션도 정상 동작 확인(회귀 없음).

디버그용 `bg-blue-500`/`border-red-500`/`bg-red-500` 컬러 클래스는 `ScrollRail.tsx`에서 제거 완료.

## ContentCard 위에서 가로 드래그 스크롤 안 됨

### 문제점

레일 컨테이너 hit-box 픽스(위 항목) 이후에도 `ContentCard` 카드 영역 위에서 mousedown+move로 드래그를 시작하면 레일이 전혀 스크롤되지 않았음. 카드와 카드 사이 빈 공간에서만 드래그가 먹혀서, 실질적으로 스크롤 시작 가능한 영역이 너무 좁았음.

### 원인

`ContentCard`가 `<a href>`(`MotionLink`)로 감싼 `<Image>`(`<img>`)로 구성되는데, `<a href>`와 `<img>`는 브라우저 기본값으로 native draggable(HTML5 Drag and Drop 대상)임. 카드 위에서 mousedown 후 포인터가 움직이면 브라우저 네이티브 이미지/링크 드래그가 먼저 제스처를 가로채면서 `dragstart`로 전환되고, 이후 `mousemove` 이벤트가 더 이상 발생하지 않아 framer-motion의 포인터 기반 드래그 인식이 아예 못 붙었음. 컨테이너 `onPointerDown` 픽스와는 무관한, 완전히 별도 원인.

### 해결

- `src/components/ui/PosterImage.tsx`: `<Image>`에 `draggable={false}` 추가
- `src/components/ui/ContentCard.tsx`: `MotionLink`(`<a>`)에 `draggable={false}` 추가

**검증**: playwright로 카드 정중앙에서 mousedown→move→up 시뮬레이션 → `onDrag` 로그 정상 발화, `onClickCapture true`로 클릭(네비게이션) 무력화도 정상 확인. 이동 없는 일반 클릭(탭)은 여전히 정상 네비게이션(회귀 없음).

## AdultToggle 제거 → 카드 단위 19+ 블러 게이트로 전환

### 문제점

`AdultToggle`이 `RootLayout` 헤더에 전역으로 떠 있는데, 실제로 `include_adult` 값은 `/search`·`/discover` route handler에만 영향을 줌(홈/상세는 애초에 이 값을 안 씀 — TMDB `/movie/popular` 등 목록 엔드포인트 자체가 `include_adult` 파라미터를 받지 않음). 대부분의 페이지에서 눌러도 아무 효과가 없어 UX상 부적합 판단.

### 결정 사항(grilling으로 확정)

- 전역 토글 완전 제거. `/search`·`/discover` 둘 다 `include_adult=true` 고정 조회로 전환(옵트인 없이 항상 전체 조회).
- TMDB `adult` 필드는 노골적 성인물(주로 헨타이 등 성인 애니메이션) 마커고, 한국 기준 19금 등급 드라마/예능(선정성·폭력성)은 안 잡힘 — 직접 TMDB API 조회로 검증 완료, 이 갭 알고 진행하기로 함.
- 토글 대신 **카드 단위** 블러 게이트 도입: `ContentCard`가 `adult` prop 받아서, `true`면 포스터 블러+스크림 오버레이("19+" + "탭하여 보기") 표시. 전역 상태(Context) 없이 카드별 로컬 `useState`.
- 해제 상태는 저장 안 함 — 새로고침/재방문마다 매번 블러로 리셋.
- 게이트 클릭 동작: 첫 클릭 = 블러만 해제(네비게이션 안 함), 두 번째 클릭부터 정상 네비게이션. 카드 루트를 `<a>` 대신 `<button>`으로 렌더해 앵커 내부 중첩 인터랙티브를 피함(리빌 후 `<a>`로 전환).
- 상세 페이지(`/movie/[id]`, `/tv/[id]`)는 게이트 미적용 — 원래도 토글 영향 밖이었던 부분이라 스코프 유지(확장 안 함).

### 해결

`dev-orchestrator`(planner→implementer×6→qa) 파이프라인으로 3배치 7태스크 구현, 브랜치 `feat/adult-content-gate`(dev에서 분기).

**배치1** — ContentCard 19+ 블러 게이트(카드 루트를 `adult && !revealed`일 때 `<button>`으로 렌더해 리빌 전 네비게이션 차단, 리빌 후 `MotionLink`로 전환) / 카드 뷰모델(`CardItem`/`CardData`)에 `adult` 필드 추가 / `tmdb-client`(`searchMulti`/`discoverByGenre`) `include_adult: true` 하드코딩 + route handler 파라미터 제거 / PRD FR-7·ARCH §5.5·§9·신규 ADR-0005 문서 갱신.

**배치2** — `SearchExplorer`/`DiscoverExplorer`/`useSearchInfinite`/`useDiscoverInfinite`에서 `useAdultContent`·`includeAdult` 플러밍 제거 + `ContentCard`에 `adult` 전달 / `CarouselSection`에 `adult={item.adult}` 전달 + `layout.tsx`에서 Provider·Toggle 참조 제거.

**배치3** — `AdultContentContext.tsx`·`AdultToggle.tsx` 삭제(`src/context/` 폴더·`CLAUDE.md`는 보존 — 향후 다른 Context 추가 시 재사용), `ui/index.ts` 배럴 export 제거, 스테일 gotcha(`src/app/CLAUDE.md`, `src/context/CLAUDE.md`) 및 `buildQuery.ts` 주석 정리.

**검증**: 배치마다 QA(경계면 교차비교) 통과, 최종 배치에서 잔존 참조 0건·전체 타입체크·E2E 데이터 흐름(raw `adult` → 뷰모델 → `ContentCard` prop → 게이트)·route handler 하드코딩·스모크 테스트(홈/검색/디스커버 200) 전부 확인.

**후속 발견(merge 시)**: `feat/adult-content-gate`가 `dev`에서 분기돼 위 두 드래그 픽스(`feat/ui-improvement`)를 모른 채 시작됨 — `ContentCard`/`PosterImage`의 `draggable={false}`, `ScrollRail`/`useDragScroll`의 컨테이너 hit-box 픽스가 전부 누락돼있었음. `feat/ui-improvement`를 `feat/adult-content-gate`로 merge해 `ContentCard.tsx` 충돌 해결(게이트 구조 유지 + `draggable={false}` 위치 재적용)로 통합 완료.
