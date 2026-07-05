# 03_DESIGN.md — 디자인 시스템 & UI 스펙

> 상태: Draft
> 작성자:
> 작성일:
> 최종 수정일:
> **관련 문서**: [00_PRD.md](./00_PRD.md) · [01_ARCHITECTURE.md](./01_ARCHITECTURE.md)

---

## 0. 이 문서의 범위

TMDB 탐색 웹앱의 **디자인 토큰**과 **UI 컴포넌트 스펙**만 다룬다.

- **페르소나 / 유저 스토리**는 이 문서에서 재작성하지 않는다. 원본은 [00_PRD.md §3, §5](./00_PRD.md)를 참조한다.
- **기술 스택(프레임워크/DB/인프라 선택)**은 이 문서 범위가 아니다. [01_ARCHITECTURE.md §7](./01_ARCHITECTURE.md)를 참조한다.
- **용어 주의**: "컴포넌트"는 [01_ARCHITECTURE.md §5 모듈/서비스 상세](./01_ARCHITECTURE.md)의 모듈 단위와 이름이 겹친다. 이 문서에서 화면을 구성하는 재사용 UI 단위는 항상 **"UI 컴포넌트"**로 표기한다. (아키텍처 §5.5 `ui` 모듈이 이 UI 컴포넌트들을 담는다.)

스타일링은 **Tailwind CSS**를 전제로 하며, 아래 토큰은 모두 `tailwind.config`에 매핑 가능한 형태로 정의한다. 인터랙션 모션은 **framer-motion**을 사용한다.

---

## 1. 디자인 토큰 (Design Tokens)

콘텐츠(포스터/스틸)가 주인공인 앱이므로, UI는 어두운 시네마틱 배경으로 물러나 이미지를 돋보이게 한다.

### 1.1 색상 팔레트 (Color)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `bg-base` | `#0B0D12` | 페이지 최하단 배경 (거의 검정, 약간의 블루 틴트) |
| `bg-surface` | `#141821` | 카드·패널 서페이스 |
| `bg-surface-hover` | `#1C212D` | 카드 hover / 상승 서페이스 |
| `bg-overlay` | `rgba(11,13,18,0.72)` | 포스터 위 텍스트 보호 그라데이션/딤 |
| `border-subtle` | `#232A38` | 1px 구분선·카드 테두리 |
| `text-primary` | `#F4F6FB` | 제목·본문 강조 (본문 대비 AA↑) |
| `text-secondary` | `#AEB6C6` | 보조 텍스트·메타 |
| `text-muted` | `#6C7688` | 비활성·플레이스홀더 |
| `brand` | `#01B4E4` | TMDB 시안 — 링크·포커스·활성 필터 |
| `brand-strong` | `#0A9BC4` | brand hover/press |
| `accent` | `#F5C518` | 평점(별점) 강조 |
| `success` | `#21C08B` | 성인토글 OFF·성공 상태 |
| `danger` | `#F0506E` | 에러·재시도 |
| `focus-ring` | `#5CD2F0` | 키보드 포커스 링 (대비 강화용 밝은 시안) |

> **대비 원칙 (NFR-4)**: `text-primary`/`bg-base` ≥ 4.5:1, `text-secondary`/`bg-surface` ≥ 4.5:1, 큰 텍스트(18px+)는 ≥ 3:1. `brand`는 링크 텍스트로 쓸 때 어두운 배경에서 3:1 이상을 만족하는 `#01B4E4` 이상 밝기만 사용한다.

**tailwind.config 매핑 예시**
```js
// tailwind.config.ts — theme.extend.colors
colors: {
  base:    '#0B0D12',
  surface: { DEFAULT: '#141821', hover: '#1C212D' },
  overlay: 'rgba(11,13,18,0.72)',
  border:  '#232A38',
  content: { primary: '#F4F6FB', secondary: '#AEB6C6', muted: '#6C7688' },
  brand:   { DEFAULT: '#01B4E4', strong: '#0A9BC4' },
  accent:  '#F5C518',
  success: '#21C08B',
  danger:  '#F0506E',
  focus:   '#5CD2F0',
}
```

### 1.2 타이포그래피 스케일 (Type)

본문/UI는 시스템 산세리프 스택(추가 폰트 다운로드 없이 성능 확보, NFR-1). 숫자(평점/연도)는 `tabular-nums`.

| 토큰 | size / line-height | weight | 용도 |
|------|--------------------|--------|------|
| `display` | 40 / 44 (모바일 32/36) | 700 | 상세 페이지 작품 타이틀 |
| `h1` | 30 / 36 | 700 | 화면 섹션 대표 제목 |
| `h2` | 24 / 30 | 600 | 홈 캐러셀 섹션 헤더 |
| `h3` | 18 / 24 | 600 | 카드 제목·서브섹션 |
| `body` | 16 / 24 | 400 | 본문(줄거리 등) |
| `body-sm` | 14 / 20 | 400 | 메타·보조 |
| `caption` | 12 / 16 | 500 | 라벨·칩·배지 |
| `overline` | 11 / 14 · letter-spacing 0.08em · UPPERCASE | 600 | 섹션 오버라인 |

```js
// fontSize: [size, { lineHeight, fontWeight }]
fontSize: {
  display: ['2.5rem',   { lineHeight: '2.75rem', fontWeight: '700' }],
  h1:      ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],
  h2:      ['1.5rem',   { lineHeight: '1.875rem', fontWeight: '600' }],
  h3:      ['1.125rem', { lineHeight: '1.5rem',  fontWeight: '600' }],
  body:    ['1rem',     { lineHeight: '1.5rem' }],
  'body-sm':['0.875rem',{ lineHeight: '1.25rem' }],
  caption: ['0.75rem',  { lineHeight: '1rem', fontWeight: '500' }],
  overline:['0.6875rem',{ lineHeight: '0.875rem', fontWeight: '600', letterSpacing: '0.08em' }],
}
```

### 1.3 Spacing

4px 기반. Tailwind 기본 스케일(0.5=2px … 4=16px)을 그대로 쓰되, 레이아웃 상수만 별칭으로 추가한다.

| 별칭 | 값 | 용도 |
|------|-----|------|
| `space-gutter` | 16px (모바일) / 24px (데스크톱) | 페이지 좌우 여백 |
| `space-section` | 48px | 홈 섹션 간 수직 간격 |
| `space-card-gap` | 12px (모바일) / 16px (데스크톱) | 그리드/캐러셀 카드 간격 |
| `container-max` | 1280px | 콘텐츠 최대 폭 |

### 1.4 Radius

```js
borderRadius: { sm: '6px', md: '10px', lg: '14px', xl: '20px', pill: '9999px' }
```
- 포스터 카드 `lg(14px)` · 버튼/입력 `md(10px)` · 필터 칩/토글 `pill` · 스켈레톤 `md`.

### 1.5 Shadow & Elevation

어두운 UI라 그림자는 약하게, 대신 **밝기 상승 + 얇은 테두리**로 깊이를 표현한다.

```js
boxShadow: {
  card:  '0 1px 2px rgba(0,0,0,0.4)',
  hover: '0 8px 24px rgba(0,0,0,0.5)',   // 카드 hover 상승
  pop:   '0 12px 40px rgba(0,0,0,0.6)',  // 모달/드롭다운
}
```

### 1.6 Z-index / 기타

| 토큰 | 값 |
|------|-----|
| `z-header` | 50 (sticky 헤더) |
| `z-dropdown` | 60 (장르 필터·검색 제안) |
| `z-modal` | 80 |
| `z-toast` | 90 |
| 이미지 종횡비 | 포스터 `2/3`, 백드롭 `16/9`, 인물 프로필 `1/1` |

---

## 2. 공통 UI 컴포넌트 스펙

아키텍처 §5.5 `ui` 모듈에 속하는 재사용 UI 컴포넌트. 각 UI 컴포넌트는 위 토큰만 사용한다.

### 2.1 `ContentCard` — 콘텐츠 카드
- 포스터(`2/3`) + 하단 제목(`h3` 1줄 truncate) + 메타(`body-sm`: 연도·평점).
- 평점 배지: 좌상단, `bg-overlay` 위 `accent` 별 아이콘 + 숫자(`tabular-nums`).
- 상태: default / hover(스케일·상승·제목 밑줄) / focus(포커스 링) / loading(=Skeleton) / no-image(플레이스홀더).
- 전체가 `<a>` (링크 카드) — 콘텐츠→상세 탐색의 기본 진입점.

### 2.2 `PosterImage` / `BackdropImage` — 이미지
- `next/image` 래퍼, lazy loading + blur placeholder (NFR-1). 종횡비 토큰 고정으로 CLS 방지.
- `alt`는 필수 — 작품 제목/인물 이름을 전달(빈 문자열 금지, 2.접근성 참조).
- 이미지 없음(TMDB `null` path): `bg-surface` + 아이콘 + 제목 이니셜 플레이스홀더.

### 2.3 `Button` — 버튼
- variant: `primary`(brand 배경) · `secondary`(surface + border) · `ghost`(투명, hover 시 surface) · `danger`(에러 재시도).
- size: `sm(h32)` · `md(h40)` · `lg(h48)`. radius `md`. 아이콘+텍스트는 `gap 8px`.
- 상태: hover(밝기 상승) · active(scale 0.98) · disabled(opacity 0.5, cursor 불가) · focus(포커스 링).

### 2.4 `AdultToggle` — 성인 콘텐츠 토글 (FR-7)
- pill 스위치. OFF=기본(`success` 도트, "성인 콘텐츠 숨김"), ON=`danger` 계열 강조.
- 반드시 `role="switch"` + `aria-checked` + 텍스트 라벨. 값은 서버사이드 `include_adult`로 전달(아키텍처 §9).

### 2.5 `GenreFilter` / `FilterChip` — 장르 필터 칩 (FR-6)
- 칩: `pill`, default(surface+border) / selected(`brand` 배경, `text-primary`). 다중 선택 가능.
- 데스크톱: 가로 wrap 나열. 모바일: 가로 스크롤 스트립 또는 바텀시트.
- `role="button"` + `aria-pressed`. 선택 상태는 색상만이 아니라 체크 아이콘도 병행(색맹 대응).

### 2.6 `Skeleton` — 로딩 상태 (NFR-1, NFR-3)
- shimmer 애니메이션(2.5절). 카드/텍스트라인/포스터/상세 헤더용 프리셋.
- 실제 콘텐츠와 동일한 종횡비·크기를 유지해 레이아웃 점프 방지.

### 2.7 `ErrorState` / `EmptyState` — 에러·빈 상태 (NFR-3)
- 아이콘 + 메시지(`body`) + 액션(`Button`). 에러: "다시 시도"(danger ghost). 빈 검색결과: "다른 키워드로 검색".
- API 로딩/에러/빈 결과를 화면마다 명확히 구분해 노출.
- 존재하지 않는 id(`/movie/[id]` 등) 접근 시에는 이 컴포넌트 대신 App Router `not-found.tsx` 페이지(별도 전용 레이아웃)로 처리한다.

### 2.9 데이터 결측 처리 공통 규칙
- **텍스트 필드**(줄거리·연도·러닝타임 등)가 없으면 자리 유지 + 대체 문구로 표시(예: "줄거리 정보가 없습니다", "출시일 미정"). 섹션 자체를 숨기지 않는다.
- **리스트형 필드**(출연진·제작진·추천작 등)가 빈 배열이면 해당 섹션 전체를 숨긴다.
- **이미지**(`poster_path`/`profile_path` null)는 2.2절 `PosterImage`/`BackdropImage`의 플레이스홀더로 대체한다.

### 2.8 `RatingBadge` · `Pill/Tag` · `PersonAvatar` (보조)
- `RatingBadge`: 별 + 10점 만점 숫자. `Pill/Tag`: 장르·상태 라벨(caption). `PersonAvatar`: 원형(`1/1`) 프로필 + 이름/역할.

---

## 3. 화면별 레이아웃 가이드

라우트는 아키텍처 §5 기준: `/`, `/search`, `/movie/[id]`, `/tv/[id]`, `/person/[id]`.

### 3.1 홈 `/` (FR-1)
- **헤더(sticky)**: 로고 · 검색 진입 · `AdultToggle`.
- **히어로**: 트렌딩 1건의 `BackdropImage` + 하단 보호 그라데이션 위 `display` 타이틀 + CTA.
- **캐러셀 섹션 반복**: "트렌딩", "인기 영화", "인기 TV" 등 — 섹션 헤더(`h2`) + 가로 스크롤 `ContentCard` 레일.
- 데스크톱은 레일당 6~7장 보임, 모바일은 2.2장(다음 카드 살짝 보여 스크롤 유도).

### 3.2 검색 `/search` (FR-2)
- 상단 고정 검색 입력(자동 포커스) + `AdultToggle`. **제출(Enter)해야 결과가 갱신** — 실시간 자동완성 드롭다운은 제공하지 않는다.
- 결과는 **타입별 섹션 구분**(영화 / TV / 인물) — PRD FR-2 비고 준수. 각 섹션은 반응형 그리드.
- **무한스크롤**: 하단 sentinel 도달 시 다음 페이지 로드(TanStack Query `useInfiniteQuery`, 아키텍처 §10). 로딩 시 `Skeleton` 카드 append. 마지막 페이지 도달 시 추가 UI 없이 스크롤만 멈춘다(별도 안내 문구 없음).
- 초기(입력 전) EmptyState, 무결과 EmptyState, 에러 ErrorState 각각 노출.

### 3.3 영화 상세 `/movie/[id]` (FR-3)
- **히어로**: 백드롭 + 포스터 오버랩 + `display` 제목 · 메타(연도·러닝타임·장르 `Pill`) · `RatingBadge`.
- **줄거리**(`body`) → **출연진 레일**(`PersonAvatar`, 클릭 시 `/person/[id]`) → **감독/제작진** → **추천/유사 작품 레일**.
- 모든 인물·연관작은 링크 — 콘텐츠→인물→다른 작품 탐색 흐름(PRD §2) 유지.

### 3.4 TV 상세 `/tv/[id]` (FR-4)
- 영화 상세와 동일 히어로 + **시즌/에피소드 영역 추가**.
- 시즌 선택(`FilterChip` 또는 셀렉트) → 해당 시즌 **에피소드 목록**(에피소드 스틸 `16/9` + 번호·제목 + 방영일 + 개요 요약).
- 에피소드 목록은 모바일 1열 / 데스크톱 2열.

### 3.5 인물 상세 `/person/[id]` (FR-5)
- 좌(데스크톱)/상(모바일): 프로필(`1/1`) + 이름(`display`) + 약력.
- **필모그래피**: 출연작/제작참여 토글 후 `ContentCard` 그리드. 최신순 정렬, 각 카드 → 작품 상세.

### 3.6 장르 필터 탐색 (FR-6)
- 전용 화면 또는 홈/검색 상단 `GenreFilter` 스트립. 선택 시 결과 그리드 갱신 + 무한스크롤(3.2와 동일 패턴).

---

## 4. 반응형 브레이크포인트 규칙 (NFR-3)

Tailwind 기본 브레이크포인트를 사용한다.

| 이름 | min-width | 대표 레이아웃 |
|------|-----------|---------------|
| (base) | 0 | 모바일 1차. 포스터 그리드 2열, 캐러셀 2.2장, gutter 16px |
| `sm` | 640px | 그리드 3열 |
| `md` | 768px | 그리드 4열, gutter 24px, 상세 히어로 가로 배치 시작 |
| `lg` | 1024px | 그리드 5열, 캐러셀 6장, 사이드 정보 2열 |
| `xl` | 1280px | 그리드 6열, `container-max` 적용(양옆 여백 auto) |

규칙
- **모바일 퍼스트**: base 스타일 = 모바일, 상위 브레이크포인트에서 확장.
- 포스터 그리드는 `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`.
- 터치 타깃 최소 44×44px(모바일 칩·토글·카드 액션).
- 상세 히어로: `md` 미만 세로 스택 / `md` 이상 백드롭+포스터 가로 오버랩.

---

## 5. 인터랙션 / 애니메이션 가이드 (framer-motion)

전역 원칙: 빠르고 절제된 모션. duration 150~300ms, ease `[0.22, 1, 0.36, 1]`(easeOutExpo 계열). **`prefers-reduced-motion: reduce`이면 모든 트랜지션·애니메이션을 opacity만 남기고 비활성화**(2.접근성).

```ts
// 공통 트랜지션 프리셋
const easeOut = [0.22, 1, 0.36, 1];
export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: easeOut } },
};
```

- **카드 hover** (`ContentCard`): `whileHover={{ scale: 1.04, y: -4 }}` + `boxShadow: hover` + 제목 강조. `whileTap={{ scale: 0.98 }}`. 스프링 `{ type:'spring', stiffness:300, damping:24 }`.
- **페이지 전환**: `AnimatePresence` + `fadeUp`. 상세 진입 시 히어로 포스터 `layoutId`로 카드→상세 공유 전환. exit는 opacity 페이드.
- **섹션/그리드 진입**: `staggerChildren: 0.04`로 카드 순차 등장(첫 뷰포트 1회, `viewport={{ once:true }}`).
- **무한스크롤 로딩**: sentinel 진입 시 하단 `Skeleton` 카드가 `fadeUp`으로 나타나고, 실제 데이터 도착 시 크로스페이드 교체.
- **Skeleton shimmer**: 배경 그라데이션 x축 이동 1.4s 무한(감속 모션 설정 시 정적 회색으로 대체).
- **토글/칩**: 상태 변화 시 배경색 150ms 트랜지션 + 스위치 노브 스프링 이동.
- **모달/드롭다운**: `scale 0.96→1` + opacity, `pop` 그림자. 배경 오버레이 opacity 페이드.

주의: 무한 반복 장식 애니메이션은 shimmer 외 사용하지 않는다(성능·접근성).

---

## 6. 접근성 체크리스트 (NFR-4 · Lighthouse A11y 90+)

**색상 · 대비**
- [ ] 본문 텍스트 대비 ≥ 4.5:1, 큰 텍스트/아이콘 ≥ 3:1 (1.1 토큰 기준 검증).
- [ ] 상태(선택/활성/에러)를 **색상만으로** 구분하지 않는다 — 아이콘·텍스트·밑줄 병행(예: 필터 칩 체크 아이콘).

**키보드 · 포커스**
- [ ] 모든 인터랙티브 요소(카드 링크, 버튼, 칩, 토글, 검색 입력) 키보드 도달·조작 가능.
- [ ] 포커스 링(`focus-ring`) 항상 시각적으로 노출 — `outline:none`만 두고 대체 스타일 없는 경우 금지.
- [ ] 논리적 탭 순서(헤더→필터→콘텐츠→푸터), 캐러셀은 방향키 지원 권장.
- [ ] 검색 제안·드롭다운은 Esc로 닫힘, 포커스 트랩 없는 자연스러운 이동.

**의미 · 스크린리더**
- [ ] 이미지 `alt`: 포스터=작품 제목, 프로필=인물 이름(+역할). 순수 장식 이미지만 `alt=""`.
- [ ] `AdultToggle`은 `role="switch"`+`aria-checked`, 필터 칩은 `aria-pressed`.
- [ ] 랜드마크(`header`/`main`/`nav`/`footer`)와 제목 계층(h1→h2→h3) 준수, 페이지당 h1 1개.
- [ ] 로딩 영역은 `aria-busy`/`aria-live="polite"`로 상태 변화 안내(검색 결과·무한스크롤).
- [ ] 링크 텍스트는 맥락 자립적("자세히" 남발 금지) — 카드 링크는 작품 제목을 접근명으로.

**모션 · 반응형**
- [ ] `prefers-reduced-motion` 존중(5절).
- [ ] 320px 폭까지 가로 스크롤 없이 레이아웃 유지, 터치 타깃 ≥ 44px.
- [ ] 400% 확대 시에도 콘텐츠 가독·조작 가능.

---

## 7. 참고

- 페르소나/유저 스토리/요구사항 원본: [00_PRD.md](./00_PRD.md)
- 아키텍처·기술 스택·모듈(`ui` 등): [01_ARCHITECTURE.md](./01_ARCHITECTURE.md)
- TMDB 이미지 규격: https://developer.themoviedb.org/docs/image-basics
