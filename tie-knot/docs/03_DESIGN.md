# 03_DESIGN.md — 디자인 시스템 & UI 스펙

> 상태: Draft
> 작성자:
> 작성일:
> 최종 수정일:
> **관련 문서**: [00_PRD.md](./00_PRD.md) · [01_ARCHITECTURE.md](./01_ARCHITECTURE.md)

---

## 0. 이 문서의 범위

- **페르소나 / 유저 스토리**는 이 문서에서 재작성하지 않는다. 원본은 [00_PRD.md](./00_PRD.md)를 참조한다.
- **기술 스택(프레임워크/DB/인프라 선택)**은 이 문서 범위가 아니다. [01_ARCHITECTURE.md](./01_ARCHITECTURE.md)를 참조한다.

스타일링: Tailwind CSS v4(`@theme` CSS 기반 설정) + shadcn/ui(Radix 기반) + `class-variance-authority`(CVA). 애니메이션: Framer Motion(`framer-motion`/`motion`) + `globals.css` 내 CSS keyframes 병행. (출처: `src/app/globals.css`, `package.json`)

---

## 1. 디자인 토큰 (Design Tokens)

### 1.1 색상 팔레트 (Color)

기본(shadcn 표준) 토큰 — `oklch()`로 정의, `:root`(light)/`.dark` 두 세트 존재:

| 토큰 | 용도 |
|------|------|
| `--background` / `--foreground` | 기본 배경/텍스트 |
| `--card` / `--card-foreground` | 카드 표면 |
| `--popover` / `--popover-foreground` | 팝오버/드롭다운 |
| `--primary` / `--primary-foreground` | 주요 액션(버튼 등) |
| `--secondary` / `--secondary-foreground` | 보조 액션 |
| `--muted` / `--muted-foreground` | 저강조 텍스트/배경 |
| `--accent` / `--accent-foreground` | 강조 |
| `--destructive` | 위험/삭제 액션 |
| `--border` / `--input` / `--ring` | 테두리 / 인풋 테두리 / 포커스 링 |
| `--chart-1` ~ `--chart-5` | 차트 색상 5종 |
| `--sidebar*` | 사이드바 전용 배경/텍스트/보더 |

실제 값(light 기준, `oklch`): `--background: oklch(1 0 0)`, `--foreground: oklch(0.141 0.005 285.823)`, `--primary: oklch(0.21 0.006 285.885)`, `--destructive: oklch(0.577 0.245 27.325)` 등 — 전체 값은 `src/app/globals.css` `:root` 블록 참조.

**청첩장 테마 확장 토큰** — `[data-theme="blossom"]`(벚꽃 테마) 예시로, 상품(템플릿)별 테마 오버라이드 패턴이 존재:

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--blossom-pink` | `oklch(0.70 0.16 355)` | 포인트 컬러(D-day 하이라이트, 섹션 타이틀 등) |
| `--blossom-light` | `oklch(0.90 0.07 355)` | 연한 배경 톤 |

(TODO: `blossom` 외 다른 테마 존재 여부는 `globals.css` 전수 검사 범위 밖 — 필요 시 재확인)

### 1.2 타이포그래피 스케일 (Type)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--font-NotoSansKR` | `"NotoSansKR"` | 본문용 산세리프 |
| `--font-NotoSerif` | `"NotoSerif"` | `:root` 기본 `font-family`(세리프 우선, 산세리프 폴백) |

(TODO: size/line-height/weight 스케일은 별도 토큰으로 정의되어 있지 않음 — Tailwind 기본 `text-*` 유틸리티를 그대로 사용하는 것으로 추정, 컴포넌트별 실사용 조사 필요)

### 1.3 Spacing

(TODO: 커스텀 spacing alias 없음 — Tailwind v4 기본 spacing scale 사용으로 추정)

### 1.4 Radius

`--radius: 0.625rem` 기준, 나머지는 `calc()` 파생:

| 토큰 | 값 |
|------|-----|
| `--radius-sm` | `calc(var(--radius) - 4px)` |
| `--radius-md` | `calc(var(--radius) - 2px)` |
| `--radius-lg` | `var(--radius)` (0.625rem) |
| `--radius-xl` | `calc(var(--radius) + 4px)` |

### 1.5 Shadow & Elevation

(TODO: `globals.css`에 커스텀 shadow 토큰 없음 — Tailwind 기본 `shadow-*` 유틸리티 사용으로 추정)

### 1.6 Z-index / 기타

전역 z-index 스케일은 정의되어 있지 않고, 개별 요소에 인라인으로 지정됨 (예: `.blossom-petal { z-index: 50; }`). (TODO: 전역 z-index 정책 수립 필요 — 현재는 컴포넌트별 임의 값)

---

## 2. 공통 UI 컴포넌트 스펙

Atomic Design을 다음과 같이 엄격 재정의해 적용 (`.docs/01_component_architecture.md`):

### 2.1 Atoms (`src/components/atoms/**`)
- 완전한 Flat 구조(하위 폴더 금지). shadcn-ui/Radix UI 기반 컴포넌트만 위치.
- 파일명: 소문자/케밥 케이스 (예: `button.tsx`, `select.tsx`).
- 비즈니스 로직 없음 — 테마/스타일(Tailwind, CVA) 확장에만 집중.

### 2.2 Molecules (`src/components/molecules/**`)
- 2개 이상의 Atoms를 조합한 순수 UI 기능 단위.
- 파일명: PascalCase (예: `Alert.tsx`, `BaseSelect.tsx`, `FormField.tsx`).
- 도메인 로직/데이터 페칭에 의존하지 않는 순수 함수형 UI.

### 2.3 Organisms (`src/components/organisms/**`)
- Atoms/Molecules를 조합한 도메인 결합적 섹션 또는 완성된 폼 필드.
- 파일명: PascalCase.
- `fields/`(`src/components/organisms/fields/**`): `FormField` 레이아웃 + `Base` Molecule 결합.
- 데이터 페칭(SWR), Server Actions 호출, 복잡한 도메인 로직 포함 가능.

---

## 3. 화면별 레이아웃 가이드

라우트 그룹 (`src/app/(main)/**`, `src/app/(preview)/**`):

| 라우트 그룹 | 화면 |
|-------------|------|
| `(auth)` | login, signup, find-id, find-pw, change-pw |
| `(products)` | products (템플릿 마켓플레이스 목록/상세) |
| `(checkout)` | couple-info, payment |
| `(my-order)` | order |
| `(my-profile)` | profile |
| `(admin)` | admin (관리자 패널) |
| `(preview)` | preview/[id] (청첩장 미리보기/실제 배포 뷰) |
| `payment/success` | 결제 성공 페이지 |
| `reviews` | 리뷰 |

(TODO: 화면별 상세 레이아웃/와이어프레임은 원본 자료에 없음 — 각 라우트 진입 시 실제 컴포넌트 트리 조사 필요)

---

## 4. 반응형 브레이크포인트 규칙

`globals.css`에 커스텀 breakpoint 오버라이드가 없어 Tailwind CSS v4 기본값을 그대로 사용하는 것으로 추정:

| 이름 | min-width | 대표 레이아웃 |
|------|-----------|---------------|
| (base) | 0 | 모바일(청첩장 특성상 모바일 우선) |
| `sm` | 640px | |
| `md` | 768px | |
| `lg` | 1024px | |
| `xl` | 1280px | |

(TODO: 실제 컴포넌트에서 어떤 breakpoint를 주로 쓰는지는 미조사 — 서비스 특성상 모바일 우선(mobile-first)일 가능성이 높음)

---

## 5. 인터랙션 / 애니메이션 가이드

- **Framer Motion**(`framer-motion`, `motion`): 컴포넌트 단위 인터랙션 애니메이션.
- **CSS keyframes** (`src/app/globals.css`):
  - `petal-fall` — `blossom` 테마 꽃잎 낙하 효과(`.blossom-petal`, 6개 인스턴스가 서로 다른 delay/duration으로 배치).
  - `wave`, `wave-2`, `wave-3` — parallax 파도 효과(`.animate-wave*`).
  - `not-found-float`, `not-found-fade-slide-up`, `not-found-ghost-pulse`, `not-found-dot-fade-in` — 404 페이지 전용 연출.
- `.scrollbar-hide` 유틸리티로 스크롤바 숨김 처리(캐러셀 등에서 사용 추정 — `embla-carousel-react` 의존성 존재).

---

## 6. 접근성 체크리스트

**색상 · 대비**
- [ ] (TODO: 원본 자료에 접근성 검증 근거 없음 — 색상 대비 실측 필요)

**키보드 · 포커스**
- [ ] (TODO: Radix UI/shadcn 기반이라 기본 포커스 관리는 라이브러리가 제공하나, 커스텀 컴포넌트 자체 검증 필요)

**의미 · 스크린리더**
- [ ] (TODO)

**모션 · 반응형**
- [ ] (TODO: `prefers-reduced-motion` 대응 여부 미확인 — `petal-fall` 등 지속 애니메이션이 다수 존재해 우선 점검 권장)

---

## 7. 참고

- 페르소나/유저 스토리/요구사항 원본: [00_PRD.md](./00_PRD.md)
- 아키텍처·기술 스택: [01_ARCHITECTURE.md](./01_ARCHITECTURE.md)
- `.docs/01_component_architecture.md`, `src/app/globals.css`
