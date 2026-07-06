## T3 — 공통 UI 컴포넌트 + QueryProvider

- 담당: implementer · 2026-07-05
- 결과: `npx tsc --noEmit` 통과, `npx eslint` 통과, `next build` 성공(Next.js 16.2.10 Turbopack).

### 변경 파일

**신규**
- `src/components/providers/query-provider.tsx` — TanStack Query Provider (`"use client"`)
- `src/lib/motion.ts` — framer-motion 공통 프리셋(easeOutExpo/fadeUp/fadeOnly/cardSpring)
- `src/lib/tmdb/images.ts` — TMDB 이미지 URL 빌더 + `BLUR_DATA_URL`(server-only 아님, 키 미사용)
- `src/components/ui/poster-image.tsx` — `PosterImage` + `ImagePlaceholder`(export)
- `src/components/ui/backdrop-image.tsx` — `BackdropImage`
- `src/components/ui/person-avatar.tsx` — `PersonAvatar`
- `src/components/ui/rating-badge.tsx` — `RatingBadge`
- `src/components/ui/content-card.tsx` — `ContentCard` (`"use client"`)
- `src/components/ui/skeleton.tsx` — `Skeleton` + `SkeletonCard` + `SkeletonGrid`
- `src/components/ui/button.tsx` — `Button` (`"use client"`)
- `src/components/ui/error-state.tsx` — `ErrorState` (`"use client"`)
- `src/components/ui/empty-state.tsx` — `EmptyState`(server 호환)
- `src/components/ui/pill.tsx` — `Pill`
- `src/components/ui/index.ts` — 배럴 export

**수정**
- `src/app/layout.tsx` — body 를 `<QueryProvider>`로 감쌈(header/main 포함)
- `src/app/globals.css` — `@utility skeleton` 추가(기존 `shimmer` keyframe + `--animate-shimmer` 토큰 활성화, surface/surface-hover 토큰만 사용)

### 주요 결정 사항

- **경로 alias**: `tsconfig.json` 의 `"@/*": ["./*"]` 는 **프로젝트 루트** 기준이라, src 하위 파일은 `@/src/...` 로 import 한다(예: `@/src/lib/tmdb/images`). 상대경로 대신 이 형태로 통일.
- **Next.js 16 breaking change 반영**: `next/image` 의 `priority` prop 은 deprecated → 히어로 즉시 로드는 `preload` prop 으로 노출(`PosterImage`/`BackdropImage` 의 `preload` prop). `quality` prop 은 사용하지 않아 `qualities` 기본값(`[75]`) 그대로 유효.
- **이미지**: 전부 `next/image` `fill` + 종횡비 토큰 래퍼(aspect-poster/backdrop/profile)로 CLS 방지, `placeholder="blur"` + 공유 `BLUR_DATA_URL`(surface 단색 3x4 PNG), 기본 lazy loading.
- **framer-motion**: v12 `motion.create(Link)` 사용(`motion(Link)` deprecated 회피). hover/tap 은 `ContentCard`/`Button` 에서 `useReducedMotion()` 으로 분기 — reduced-motion 이면 scale/y 변형 제거(§5). `Button` 은 drag prop 충돌 때문에 `HTMLMotionProps<"button">` 확장.
- **Skeleton shimmer**: 무한 반복 장식은 shimmer 만 허용(§5)이라 로딩 스피너 대신 shimmer/aria-busy 사용. globals.css `@utility skeleton` 로 기존 keyframe 활성화.
- **Button 로딩**: §5(무한 반복 애니메이션 금지) 준수 위해 스피너 없이 `isLoading` → `disabled` + `aria-busy` 로 표현.

### QueryProvider

- `QueryClient` defaultOptions: `queries.retry: 1`(§4 rate limit 정책, ADR-0004), `refetchOnWindowFocus: false`, `staleTime: 60_000`.
- `useState(() => new QueryClient(...))` 로 1회 생성(리렌더 재생성 방지).
- RootLayout(`src/app/layout.tsx`)에서 `header` + `main` 전체를 감싼다.

### 컴포넌트 Props / 타입 요약 (후속 태스크 참조용)

- `PosterImage({ path: string|null, alt: string, size?, sizes?, className?, preload? })`
- `BackdropImage({ path: string|null, alt: string, size?, sizes?, className?, preload? })`
- `PersonAvatar({ path: string|null, name: string, role?: string|null, size?, className? })`
- `RatingBadge({ value: number, variant?: "overlay"|"inline", className? })` — `value<=0` 이면 `null` 렌더
- `ContentCard({ href: string, title: string, posterPath: string|null, year?: string|null, rating?: number|null })`
- `Skeleton({ variant?: "card"|"poster"|"backdrop"|"text"|"line", className? })`, `SkeletonGrid({ count?, className?, label? })`(role=status/aria-live)
- `Button({ variant?, size?, isLoading?, ...HTMLMotionProps<"button"> })`
- `ErrorState({ title?, message?, onRetry?: ()=>void, retryLabel?, className? })` — role="alert"
- `EmptyState({ title: string, message?, icon?, action?, className? })` — server 호환
- `Pill({ children, variant?: "default"|"brand"|"outline", className? })`

### 반영한 에러/엣지케이스 (§2.9 / §4 / §6)

- **이미지 결측**: `poster_path`/`backdrop_path`/`profile_path` null → `ImagePlaceholder`(아이콘 + 이니셜), `role="img"` + `aria-label=작품명/인물명`.
- **텍스트 결측**: 카드 연도 없음 → "연도 미상", `PersonAvatar` 역할 없음 → 줄 자체 생략, `RatingBadge` 평점 없음(0/무투표) → 배지 미표시(호출부가 리스트 결측 시 섹션 숨김 판단).
- **에러 상태**: `ErrorState` 재시도 버튼(danger) → `onRetry`(error.tsx reset / query refetch 연결용), `role="alert"`.
- **접근성**: 이미지 `alt`=작품/인물명(빈 문자열 금지), 포커스 링은 globals.css `:focus-visible` 위임, `ContentCard` 접근명=제목, `SkeletonGrid` `aria-busy`/`aria-live="polite"`, `Button` `aria-busy`.
- **reduced-motion**: `ContentCard`/`Button` JS 모션 `useReducedMotion` 분기, Skeleton shimmer 는 globals.css 전역 감쇠.

### QA 유의점

- 실사용/통합 검증(홈 배치, 카드→상세 링크 동작)은 T4에서 수행. 본 태스크는 컴포넌트 자체 완성 + 빌드/타입/린트 통과가 목표.
- `RatingBadge` 는 `value<=0` 시 `null` 반환 — 카드 상단 배지가 안 보일 수 있음(의도된 결측 처리).
- `EmptyState.action` 은 ReactNode 위임형(클라이언트 Button 을 상위에서 주입) — EmptyState 자체는 server component.
