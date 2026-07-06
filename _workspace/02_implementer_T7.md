## T7 — 영화 상세 `/movie/[id]` (FR-3)

### 변경 파일
- `src/app/movie/[id]/page.tsx` (신규) — Server Component 상세 페이지
- `src/app/movie/[id]/person-link.tsx` (신규) — 출연진/제작진 링크 클라이언트 컴포넌트(framer-motion hover/tap)
- `src/app/movie/[id]/not-found.tsx` (신규) — 전용 Not Found 레이아웃(§2.7)
- `src/app/movie/[id]/error.tsx` (신규) — 세그먼트 Error Boundary(unstable_retry)
- `src/app/movie/[id]/detail.module.css` (신규) — 출연진/추천작 가로 스크롤 레일

### 데이터 흐름 / 호출
- Server Component에서 tmdb-client 직접 호출(ADR-0003, 키는 서버 전용 모듈 내부 접근).
- 순서: `getMovie(id)` → null이면 `notFound()` → 존재 확인 후 `Promise.all([getMovieCredits, getMovieRecommendations])`.
  - 이 순서로 "없는 id"가 credits throw를 통해 error.tsx로 새지 않고 not-found로만 가도록 보장.
- API 응답 shape: 별도 Route Handler 없음(상세는 SC 직접 호출 경로). 프론트 훅/제네릭 타입 없음.
- revalidate: client.ts의 `REVALIDATE.DETAIL`(86400)이 각 fetch에 주입됨 → 페이지 레벨 설정 없음(중복 방지).

### Next.js 16 확인 사항 (node_modules/next/dist/docs)
- `params`는 Promise → `params: Promise<{ id: string }>`로 타입하고 `await params`로 언랩(page.md, v15+ 변경).
- error 파일은 `unstable_retry` prop 제공(v16.2, 루트 error.tsx와 동일 패턴 재사용).
- id 파싱: `Number(id)` 비정수/음수이면 `notFound()`.

### 레이아웃(§3.3)
- 히어로: `BackdropImage`(w1280, preload) + 하단 보호 그라데이션 + 포스터 오버랩(md 미만 세로 스택 §4) + `display` 제목 + tagline + 메타 `Pill`(연도/러닝타임/장르) + `RatingBadge`.
- 줄거리 → 출연진 레일(`PersonLink`→`PersonAvatar`, `/person/[id]`) → 감독·제작진 그리드 → 추천/유사 레일(`ContentCard`, `/movie/[id]`).
- 제작진: crew에서 Director/Writer/Screenplay/Story/Producer만 인물 단위 병합, 감독 우선 정렬, job은 한국어 라벨.

### 반영한 에러/엣지케이스(§4, §2.9)
- 존재하지 않는 id → `notFound()` → `not-found.tsx` 전용 레이아웃.
- id 파싱 불가(비정수/음수) → `notFound()`.
- credits/recommendations fetch 실패(throw) → `error.tsx`(unstable_retry 재시도).
- 데이터 결측: 줄거리 없음 → "줄거리 정보가 없습니다.", 러닝타임 없음 → "러닝타임 정보 없음", 연도 없음 → "출시일 미정".
- 리스트 결측: cast/keyCrew/recommendations 빈 배열이면 해당 섹션 전체 숨김.
- 이미지 null: Backdrop/Poster/PersonAvatar 플레이스홀더 위임.

### 디자인 토큰 / 모션
- 03_DESIGN 토큰만 사용(색/타이포/spacing/radius). 신규 토큰 없음. 레일 폭 퍼센트는 home.module.css와 동일 구조값.
- framer-motion: `PersonLink`가 `cardSpring` + whileHover/whileTap, `useReducedMotion` 분기(§5). 추천작은 `ContentCard` 내장 모션 재사용.

### 검증 결과
- `npx tsc --noEmit`: 통과(exit 0)
- `npx eslint src/app/movie`: 통과(exit 0)
- `npm run build`: 통과 — `/movie/[id]` = ƒ(server-rendered on demand), 상세 캐싱은 fetch revalidate로 적용.

### notFound 동작 확인 방법
- `npm run dev` 후 `/movie/999999999` 접근 → TMDB 404 → getMovie null → not-found.tsx("영화를 찾을 수 없습니다") 노출.
- 정상 id(예 `/movie/27205`) → 상세 렌더, 출연진 카드 클릭 시 `/person/[id]`, 추천 카드 클릭 시 `/movie/[id]` 이동.
