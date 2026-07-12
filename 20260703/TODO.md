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

## [TODO] AdultToggle 제거 → 카드 단위 19+ 블러 게이트로 전환

### 문제점

`AdultToggle`이 `RootLayout` 헤더에 전역으로 떠 있는데, 실제로 `include_adult` 값은 `/search`·`/discover` route handler에만 영향을 줌(홈/상세는 애초에 이 값을 안 씀 — TMDB `/movie/popular` 등 목록 엔드포인트 자체가 `include_adult` 파라미터를 받지 않음). 대부분의 페이지에서 눌러도 아무 효과가 없어 UX상 부적합 판단.

### 결정 사항(grilling으로 확정)

- 전역 토글 완전 제거. `/search`·`/discover` 둘 다 `include_adult=true` 고정 조회로 전환(옵트인 없이 항상 전체 조회).
- TMDB `adult` 필드는 노골적 성인물(주로 헨타이 등 성인 애니메이션) 마커고, 한국 기준 19금 등급 드라마/예능(선정성·폭력성)은 안 잡힘 — 직접 TMDB API 조회로 검증 완료, 이 갭 알고 진행하기로 함.
- 토글 대신 **카드 단위** 블러 게이트 도입: `ContentCard`가 `adult` prop 받아서, `true`면 포스터 블러+스크림 오버레이("19+" + "탭하여 보기") 표시. 전역 상태(Context) 없이 카드별 로컬 `useState`.
- 해제 상태는 저장 안 함 — 새로고침/재방문마다 매번 블러로 리셋.
- 게이트 클릭 동작: 첫 클릭 = 블러만 해제(`preventDefault`, 네비게이션 안 함), 두 번째 클릭부터 정상 네비게이션. 별도 버튼 없이 카드 전체(`MotionLink`) 그대로 사용.
- 상세 페이지(`/movie/[id]`, `/tv/[id]`)는 게이트 미적용 — 원래도 토글 영향 밖이었던 부분이라 스코프 유지(확장 안 함).

### 계획

**제거**
- `src/context/AdultContentContext.tsx` 삭제
- `src/components/ui/AdultToggle.tsx` 삭제 + `ui/index.ts` export 제거
- `layout.tsx`의 `AdultContentProvider`/`AdultToggle` 배선 제거
- `SearchExplorer.tsx`/`DiscoverExplorer.tsx`의 `useAdultContent` 사용 제거
- `useSearchInfinite`/`useDiscoverInfinite`의 `includeAdult` 파라미터 제거(항상 true라 더 이상 가변값 아님)
- `/api/search`, `/api/discover` route handler: `searchParams`에서 `includeAdult` 읽지 않고 `true` 리터럴로 고정 호출
- `buildQuery.ts`의 stale 주석("AdultContentContext가 관리하는 adult 파라미터...") 정리

**추가**
- `CardItem`(+`movieToCard`/`tvToCard`)에 `adult: boolean` 필드 추가
- `SearchExplorer`/`DiscoverExplorer`의 `<ContentCard>` 호출부에 `adult={movie.adult}` 전달
- `ContentCard.tsx`: `adult` prop + 로컬 `revealed` state + 게이트 활성 시 `onClick` `preventDefault`
- 포스터 오버레이(블러+스크림, 중앙 "19+" + "탭하여 보기"), 해제 시 원래 카드(RatingBadge 포함) 노출

**문서 동기화**
- `00_PRD.md` FR-7, `01_ARCHITECTURE.md` §9, `03_DESIGN.md` §2.4/§2.7, `src/app/CLAUDE.md`의 "성인 콘텐츠 토글은 layout.tsx에서 전역 제공" gotcha 항목 전부 새 설계 기준으로 수정
