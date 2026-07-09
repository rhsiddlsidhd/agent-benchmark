# TODO

## 홈페이지 개선

### 레이아웃 와이어프레임(ASCII) [초안 — 세션 순서 미정]

**데스크톱**
```
┌──────────────────────────────────────────────────────────────────┐
│░░░░░░░░░░░░░░ BackdropImage (16:9, min-h-420px/max-h-60vh) ░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│                                                     ●  ○  ○  ○  ○│ ← 캐러셀 dot(3~5장, 자동전환+일시정지 버튼)
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 하단 보호 그라데이션 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│ 지금 뜨는 콘텐츠                                                  │
│ 타이틀(display)                                                  │
│ 개요 3줄 clamp...                                                │
│ [ 상세 정보 보기 ]                                               │
└──────────────────────────────────────────────────────────────────┘

  ── 인기 OOO / 인기 OOO / 인기 예능 (순서 미정, 3개 반복) ──
┌──────────────────────────────────────────────────────────────────┐
│ h2 섹션 타이틀                                                    │
│ ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐  ···   ← 드래그 스크롤 │
│ │card││card││card││card││card││card││card│                       │
│ └────┘└────┘└────┘└────┘└────┘└────┘└────┘                       │
└──────────────────────────────────────────────────────────────────┘
(× 3, 순서 미정)
```

**모바일**
```
┌───────────────┐
│░░░░░░░░░░░░░░░│ ← BackdropImage(min-h-420px 우선 적용 — 16:9 계산치보다 세로로 김)
│░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░│
│     ● ○ ○     │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│지금 뜨는 콘텐츠│
│타이틀          │
│개요 3줄...     │
│[상세 정보 보기]│
└───────────────┘

── 인기 OOO (섹션 1) ──
┌───────────────┐
│h2              │
│┌───┐┌───┐┌──  │ ← 터치 스와이프(약 2.2장 노출)
││card││card││ca│
│└───┘└───┘└──  │
└───────────────┘
(× 3, 순서 미정)
```

- 히어로/카드 레일 순서·개수는 확정 API 파라미터 아래 참고, 세션 간 세로 배치 순서는 아직 근거 없이 미정 상태(별도 결정 필요)

### API 개선

#### 인기 드라마 세션 [확정]

`/discover/tv` 호출, 파라미터:
- `with_origin_country=KR`
- `with_type=2|4` (Miniseries + Scripted — 2만 쓰면 최근 드라마 절반 가까이 누락됨, 실측 확인)
- `sort_by=popularity.desc`
- `vote_count.gte=3` (0표 노이즈만 제거, 신작 화제작은 살림 — 최근성 필터와 vote_count가 상충하는 특성 고려)
- `first_air_date.gte=(오늘 기준 최근 1년, 동적 계산)`
- `first_air_date.lte=(오늘 날짜, 동적 계산)` — 미방영 예정작 유입 방지, `.gte`/`.lte` 둘 다 요청 시점마다 재계산해야 함(하드코딩 금지)
- `language=ko-KR`
- 응답 순서는 `sort_by`만 믿지 말고 클라이언트단에서 `popularity` 기준 재정렬 필요(실측상 완전한 내림차순 아님)

#### 인기 예능 세션 [확정]

`/discover/tv` 호출, 파라미터:
- `with_origin_country=KR`
- `with_type=3|5` (Reality + Talk Show)
- `sort_by=popularity.desc`
- `vote_count.gte=5`
- `air_date.gte=(오늘 기준 최근 6개월, 동적 계산)`
- `air_date.lte=(오늘 날짜, 동적 계산)` — **`first_air_date` 아니라 `air_date`(에피소드 방영일) 써야 함**: 예능은 런닝맨(2010)/아는 형님(2015)처럼 장수 프랜차이즈가 많아서 `first_air_date`(시리즈 최초 방영일) 기준으로 최근성 거르면 지금도 방영 중인 대표 프로그램들이 전부 빠짐(실측 확인 — `first_air_date` 기준 6개월로는 런닝맨/아는형님/라디오스타 등 전부 누락, `air_date`로 바꾸니 정상 노출)
- `language=ko-KR`
- 응답 순서는 `sort_by`만 믿지 말고 클라이언트단에서 `popularity` 기준 재정렬 필요(실측상 완전한 내림차순 아님)

#### 인기 영화 세션 [확정]

`/discover/movie` 호출, 파라미터:
- `with_original_language=ko` (movie는 국가 필드 없어서 언어로 근사)
- `sort_by=popularity.desc` (vote_count 기준 별도 정렬 불필요 — popularity 자체가 TMDB의 "인기" 지표, vote_count는 아래 문턱값으로만 사용)
- `vote_count.gte=2` (0~1표 노이즈만 제거)
- `primary_release_date.gte=(오늘 기준 최근 6개월, 동적 계산)`
- `primary_release_date.lte=(오늘 날짜, 동적 계산)` — 미개봉작 유입 방지, `.gte`/`.lte` 둘 다 요청 시점마다 재계산해야 함(하드코딩 금지)
- `without_genres=99,10402` (다큐+음악 — 콘서트 실황/특별상영 필름 배제. `with_release_type`은 값 무관하게 결과 불변, 작동 안 함 확인됨 → 이 방식으로 대체)
- `language=ko-KR`
- 응답 순서는 `sort_by`만 믿지 말고 클라이언트단에서 `popularity` 기준 재정렬 필요(실측상 완전한 내림차순 아님)

#### 히어로(hero) 캐러셀 세션 [확정]

`/trending/all/week` 호출(현재 히어로 소스와 동일 엔드포인트, 단 단일 선택 → 3~5개 자동 캐러셀로 확장):
- `language=ko-KR`
- `media_type=all`(movie+tv+person 혼합) → `isTitledResult`로 person 제외
- backdrop_path 있는 항목만 후보로 필터링
- 상위 3~5개 선택(popularity 기준 재정렬 후) — day/week 비교 결과 top5는 거의 동일하나 week가 리스트 전체 품질 바닥선이 더 안정적이라 week로 확정
- `release_date`/`first_air_date` 별도 최근성 필터 **불필요** — trending 자체가 half-life 감쇠로 최신성 반영함(discover 기반 popular/now_playing과 달리 감쇠 없는 정렬이 아님), 오히려 재화제화된 구작(예: 하우스 오브 드래곤 신규 시즌)을 부당 배제할 위험
- **구현 영향**: 정적 Server Component였던 히어로가 자동 전환 상태를 가져야 해서 Client Component 전환 필요(framer-motion 기존 스택 재사용)
- **접근성 요건**: NFR-4(Lighthouse Accessibility 90+) 대비 WCAG 2.2.2(Pause, Stop, Hide) 충족 위해 자동 전환에 일시정지 컨트롤 필요 — 그냥 자동재생만 하면 감점 위험

### UI 개선

#### 캐러셀 드래그(그랩) 스크롤 지원 [확정]

**배경**: `CarouselSection`(홈) 등 가로 스크롤 레일이 모바일 터치는 되는데 데스크톱 마우스로는 조작 불가(스크롤바 숨김 + 휠은 세로만 + 드래그 미지원). `.rail`/`.railItem` CSS가 `home.module.css`/`movie/[id]/detail.module.css`/`tv/[id]/detail.module.css` 3곳에 중복돼있음 — 이번에 공용화.

- **범위**: 홈 `CarouselSection` + movie/tv 상세 레일 3곳 전부 공용화(단, 마우스 휠→가로 스크롤 변환은 이번 스코프 제외 — 필요하면 후속 검토)
- **CSS**: 기존 3개 `.module.css`의 `.rail`/`.railItem` 제거 → Tailwind 유틸로 대체
  - 반응형 카드 폭: `w-[42%] sm:w-[29%] md:w-[22%] lg:w-[15.5%] xl:w-[13.2%]`(브레이크포인트가 Tailwind 기본값과 일치해 arbitrary value로 그대로 이식 가능)
  - 간격/여백: 기존 토큰 그대로(`gap-card-gap`/`-lg`, `px-gutter`/`-lg`)
  - 부족한 2개는 `globals.css`에 커스텀 `@utility`로 추가(기존 `z-header`/`skeleton` 패턴과 동일): `scrollbar-hide`(스크롤바 숨김), snap 관련 묶음(`scroll-snap-type: x proximity` + `overscroll-behavior-x: contain` + `-webkit-overflow-scrolling: touch`)
- **인터랙션 엔진**: 새 라이브러리 설치 없이 기존 `framer-motion`의 `drag="x"`로 마우스/터치/펜 통합 처리(모멘텀 포함, `pointerType` 분기 불필요)
- **스크롤 스냅**: 네이티브 스크롤 스냅이 transform 방식과 호환 안 되므로 `onDragEnd`에서 속도/위치 계산 후 가장 가까운 카드로 `animate()` 재구현 — 03_DESIGN §3.1/§4에 명시된 스펙이라 포기 불가
- **키보드 접근성**: 네이티브 `overflow-x:auto`가 주던 Tab-포커스 자동 scrollIntoView가 transform 방식에선 깨지므로 `focus` 이벤트 위임으로 재구현 + `←`/`→` 화살표 키로 레일 직접 스크롤 추가 구현
- **클릭/드래그 구분**: 카드 전체가 `Link`(`ContentCard`)라 드래그를 클릭으로 오인식 방지 필요 — 5px 임계값 넘으면 해당 드래그 사이클 동안 `Link` 클릭 무력화
- **Reduced motion**: `useReducedMotion()` 체크해 스냅 애니메이션은 즉시 이동(점프)으로 대체. 히어로 자동전환은 시각 효과뿐 아니라 **타이머 자체를 미실행**(CSS 감쇠만으론 JS 타이머가 안 멈춰서 콘텐츠가 계속 자동으로 바뀌는 문제 남음)
- **아키텍처**:
  - `src/hooks/useDragScroll.ts` — 순수 로직(ref, 드래그 바인딩, 스냅 계산, 키보드 핸들러, focus 위임) 전용, 마크업 모름
  - `src/components/ui/ScrollRail.tsx` — 카드 레일 전용 래퍼(위 훅 내부 사용), `CarouselSection`(홈) + movie/tv 상세 레일이 여기로 통합
  - 히어로 캐러셀은 마크업이 달라서 `src/app/_components/HeroCarousel.tsx`에서 `useDragScroll` 훅만 직접 사용, 별도 마크업 구현
