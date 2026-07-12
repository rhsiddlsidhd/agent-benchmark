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

## [TODO] TV 상세 페이지 시즌/에피소드 UI 개편 (백드롭+필름스트립)

### 문제점

`/tv/[id]` 상세 페이지의 `SeasonSelector`(`src/app/tv/[id]/_components/SeasonSelector.tsx`)가 시즌 칩 + 선택된 시즌의 에피소드 카드 그리드를 페이지 본문에 그대로 인라인 렌더함. 에피소드 많은 시즌은 그리드가 길어져서 페이지 전체가 늘어지고, 아래 출연진/추천 작품 레일이 한참 밑으로 밀림.

### 확인된 사실(코드 탐색)

- 이 프로젝트에 모달/다이얼로그 컴포넌트나 관련 라이브러리(radix-ui 등)가 전혀 없음.
- movie 상세 쪽엔 "시리즈/컬렉션" 개념 자체가 없음(TMDB `belongs_to_collection` 미사용) — 이 작업은 TV의 시즌/에피소드 영역에 한정.
- `fixed`는 프로젝트에 전무, `sticky`는 헤더(`layout.tsx`)와 검색바(`SearchExplorer`) 2곳뿐 — 둘 다 자기 섹션 상단 고정이지 페이지 전체를 떠다니는 FAB 패턴은 없음.
- `ScrollRail`(드래그 가능 가로 레일)이 출연진/추천 작품 레일에서 이미 검증됨(hit-box·네이티브 드래그 버그 픽스 완료, 위 TODO 항목 참고) — 재사용 가능한 기존 언어.
- `framer-motion`이 이미 1급 시민(`whileTap`, `useReducedMotion`, 에피소드 카드 entrance stagger)이라 크로스페이드 추가가 이질적이지 않음.

### 결정 사항(grilling 완료 — 확정)

**모달 방식 전면 백지화.** 대신 시즌/에피소드 영역을 **백드롭 크로스페이드 + 필름스트립**으로 교체(오버레이/트리거 UI 자체가 불필요해짐 → radix 등 신규 의존성 설치 안 함).

- **레이아웃**: 선택된 에피소드의 스틸을 풀블리드 백드롭(`aspect-video` 고정 — CLS 방지, TMDB still 원본 비율과 일치)으로 표시, 히어로 섹션과 동일한 그라데이션 스크림(`bg-gradient-to-t from-base via-base/60 to-transparent`) 위에 회차번호·제목(`h3`)·개요(`line-clamp-3`, 기존 `EpisodeCard`와 동일 값) 오버레이. 그 아래 시즌 필 탭(기존 유지) + 회차 필름스트립(`ScrollRail` 재사용, 썸네일 `aspect-video`, 이미지만 — 번호 배지 없음).
- **전환 애니메이션**: 회차 선택 시 백드롭 이미지+텍스트가 framer-motion `AnimatePresence`로 크로스페이드. `useReducedMotion`이면 트랜지션 없이 즉시 교체(`Button`/`SeasonSelector` 기존 컨벤션 동일 적용).
- **시즌 전환**: 시즌 바꾸면 항상 그 시즌 1화로 자동 리셋(백드롭도 1화로 크로스페이드) — 이전 시즌 회차 선택 유지 시도 안 함(혼란 방지).
- **선택 강조**: 필름스트립 선택 항목은 `border-brand` + `scale-105`(시즌 칩의 `isActive` 스타일과 톤 통일).
- **로딩/에러/빈 상태**: 시즌 데이터 로딩 중엔 `Skeleton`(backdrop variant, 필름스트립도 스켈레톤 썸네일) 재사용. fetch 실패는 `ErrorState`(재시도) 백드롭 영역에 표시. 에피소드 0개인 시즌은 `EmptyState`를 백드롭 영역에 표시(시즌 탭은 계속 클릭 가능 — disabled 처리 안 함).
- **접근성**: 필름스트립도 시즌 칩과 동일하게 `role="tablist"`/`role="tab"` 부여 + 선택된 에피소드 텍스트 영역에 `aria-live="polite"`(탭패널 위치). 화살표키 로빙 tabindex는 **구현 안 함** — 기존 시즌 칩도 미구현 상태라 이번 스코프에서 새로 안 얹음(스코프 크리프 방지, 필요하면 시즌 칩까지 포함한 별도 개선 태스크로).
- **모달을 URL에 반영하지 않는다는 전제 자체가 폐기됨**(모달이 없어졌으므로) — 참고용으로만 남김: 애초에 로그인/공유가 PRD상 Non-Goal이고 딥링크 요구사항도 없어 intercepting route는 검토도 안 함.

## [TODO] 상세 페이지 히어로 영역 확대 (스크롤 유도)

### 문제점

`/movie/[id]`, `/tv/[id]` 히어로(`BackdropImage`)가 `aspect-backdrop`(16:9) 고정이라 화면 폭 기준으로 높이가 정해짐. 모바일처럼 폭이 좁은 화면에서는 히어로 높이가 짧아져서(예: 375px 폭 → 약 211px), 스크롤 없이 개요·시즌 등 다음 콘텐츠까지 한 화면에 다 보임 — 히어로가 "스크롤해야 다음 내용이 보이는" 몰입감을 못 줌.

### 확인된 사실(코드 탐색)

- `BackdropImage`(`src/components/ui/BackdropImage.tsx`)는 공용 컴포넌트 — 히어로뿐 아니라 에피소드 카드/필름스트립(위 TODO 항목)에서도 16:9 고정으로 재사용됨. 이 컴포넌트 자체의 기본 `aspect-backdrop`는 건드리지 않는다.
- 프로젝트에 `vh`/`svh`/`dvh` 단위 사용 이력 없음 — 이번이 첫 도입.
- 포스터/타이틀 블록은 현재 `-mt-16 md:-mt-24`(고정 px)로 백드롭 하단에 오버랩.

### 결정 사항(grilling 완료 — 확정)

- 히어로 높이를 화면 폭 기준(16:9) 대신 **뷰포트 높이 비율로 고정** — `h-[70svh]`(화면 크기 무관 항상 동일 비율, 브레이크포인트 분기 없음). 히어로 섹션(`page.tsx` 내 `<section aria-labelledby="...-title">`)에서 `BackdropImage`에 `className`으로 오버라이드(컴포넌트 기본값 불변, 다른 사용처엔 영향 없음).
- 단위는 `vh` 대신 **`svh`** 사용 — 모바일 주소창 접힘/펼침에 따른 높이 출렁임 방지(`Safari 15.4+`/`Chrome 108+` 지원, 구형 브라우저 타겟팅 안 함).
- 포스터/타이틀 오버랩도 px 고정값 대신 **`-mt-[15svh]`**로 전환 — 히어로 자체가 vh 기준이 됐으니 오버랩도 같은 기준으로 통일(화면 크기 달라져도 비율 일관).
- `movie/[id]`·`tv/[id]` 양쪽 히어로 구조 동일(현재도 동일 컨벤션 재사용 중) — 이번 변경도 둘 다 동일 적용.

## [TODO] 상세 페이지 스크롤 진입 애니메이션

### 문제점

`movie/[id]`·`tv/[id]` 상세 페이지의 히어로 아래 섹션(개요·시즌/에피소드·출연진·추천 작품)이 스크롤과 무관하게 그냥 정적으로 배치돼있음. 스크롤해서 뷰포트에 들어올 때 등장하는 모션이 없어 밋밋함.

### 확인된 사실(코드 탐색)

- `SeasonSelector.tsx`에 이미 유사 모션 패턴 있음 — 에피소드 카드 마운트 시 `opacity: 0→1, y: 8→0, duration: 0.25`(stagger delay 포함). 다만 이건 "마운트 시" 트리거고, 이번 요청은 "스크롤 뷰포트 진입 시"(`whileInView`) 트리거라 메커니즘이 다름.
- `useReducedMotion` 기반 모션 비활성화가 프로젝트 전반 컨벤션(`Button`, `SeasonSelector` 등).

### 결정 사항(grilling 완료 — 확정)

- **적용 범위**: 히어로 아래 전체 섹션(개요/시즌·에피소드/출연진/추천 작품). 히어로 자체는 제외(페이지 로드 시 이미 화면에 있어 "스크롤 진입" 트리거가 성립 안 함).
- **모션 값**: 기존 `SeasonSelector` 카드 진입 패턴 그대로 재사용 — `opacity: 0→1, y: 8→0, duration: 0.25`. 섹션 단위라고 값을 키우지 않고 페이지 전체에서 하나의 모션 토큰으로 통일.
- **트리거 단위**: 섹션당 1블록(제목+콘텐츠 통째로) 애니메이션. 출연진/추천작 레일의 아이템별 stagger는 안 함 — `ScrollRail`(공용 컴포넌트) 내부까지 손대야 해서 스코프 커짐, 이번 요청 범위 초과로 판단.
- **재생 횟수**: `viewport={{ once: true }}` — 최초 진입 시 1회만 재생, 스크롤 왔다갔다해도 재재생 안 함.
- **트리거 시점**: `amount: 0.1~0.2`(섹션이 살짝 보이자마자 시작) — 빠른 스크롤에서도 애니메이션이 끊기지 않고 자연스럽게 이어짐.
- reduced-motion 시 기존 컨벤션대로 트랜지션 생략, 즉시 노출.
- `movie/[id]`·`tv/[id]` 양쪽 동일 적용.
