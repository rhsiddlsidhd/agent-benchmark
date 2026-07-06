## T9 — TV 시즌/에피소드 모듈 (FR-4)

### 변경/추가 파일
- `src/features/tv-detail/types.ts` (신규) — 라우트 응답 shape ↔ 훅 타입 단일 소스.
- `src/app/api/tv/[id]/season/[n]/route.ts` (신규) — 시즌 상세 프록시 Route Handler.
- `src/features/tv-detail/use-tv-season.ts` (신규) — `useQuery` 온디맨드 조회 훅.
- `src/app/tv/[id]/season-selector.tsx` (신규) — 시즌 선택 칩 + 에피소드 목록(Client Component).
- `src/app/tv/[id]/page.tsx` (수정) — 개요 섹션 뒤에 `SeasonSelector` 통합, 헤더 주석 갱신.

### TVDetail.seasons 필드 유무 확인 결과
- `src/lib/tmdb/types.ts:165` — `TVDetail.seasons: Season[]` **존재함**. 서버(Server Component)에서
  이미 받은 시즌 요약 목록을 props 로 넘겨 칩을 그리고, 에피소드 상세만 온디맨드로 가져온다.
  별도의 시즌 목록 재조회는 하지 않는다.

### API 응답 shape
- 성공: `SeasonResponse` = `SeasonDetail`(TMDB `getTvSeason` 결과 그대로 = `{ id, name, overview,
  air_date, poster_path, season_number, vote_average, episodes: Episode[] }`). `NextResponse.json(data)`.
- 실패: `SeasonErrorResponse` = `{ error: string }`.
  - 파싱 불가(비정수/음수 id, 음수 시즌) → 400. 시즌 번호 0(Specials)은 유효로 허용.
  - TMDB 404/429/5xx → 상태코드 패스스루. status 0(네트워크/타임아웃) → 502.

### 훅 타입
- `useTvSeason(tvId: number, seasonNumber: number | null)` → `UseQueryResult<SeasonResponse, Error>`.
- `queryFn` 제네릭 T = `SeasonResponse`(라우트 성공 응답과 동일 타입, `types.ts` 단일 소스).
- `queryKey: ["tv-season", tvId, seasonNumber]` — 시즌 번호가 바뀔 때만 fetch, 조회한 시즌은 캐시 재사용.
- `enabled: seasonNumber !== null`, `retry: 1`.

### 온디맨드 로드 방식
- 서버는 `getTvShow` 로 받은 `seasons` 요약만 전달(에피소드 상세 미포함).
- 클라이언트에서 선택 시즌 번호를 `useState` 로 관리 → `useTvSeason` 의 queryKey 에 반영 →
  선택이 바뀌면 해당 시즌만 `/api/tv/[id]/season/[n]` 으로 fetch. 이전에 본 시즌은 TanStack Query
  캐시에서 즉시 복원(서버 전체 재조회 아님).
- 기본 선택: 첫 정규 시즌(season_number ≥ 1), 없으면 첫 항목.

### 반영한 에러/엣지케이스 (§4)
- 시즌 fetch 실패(404/429/5xx/네트워크) → `ErrorState`(refetch 재시도). 429 는 Route Handler
  패스스루 + 훅 `retry: 1` 만(자체 재시도 루프 없음, ADR-0004).
- 로딩 → 에피소드 카드 형태 `Skeleton`(동일 종횡비로 레이아웃 점프 방지).
- 에피소드 개요 null → "에피소드 개요가 없습니다." 대체 문구.
- 에피소드 스틸(still_path) null → `BackdropImage` 내부 `ImagePlaceholder`.
- 에피소드 방영일 null → 방영일 표기 자체 생략(대체 문구 없이 숨김).
- 에피소드 빈 배열 → 해당 시즌의 에피소드 목록 영역 숨김(칩은 유지, 시즌 전환 가능).
- 시즌 목록(TVDetail.seasons) 빈 배열 → 페이지에서 SeasonSelector 섹션 자체 미렌더.
- TMDB 키는 Route Handler(→ server-only tmdb-client) 내부에서만 접근(ADR-0003).

### 디자인 토큰 준수
- 색상: brand/base/border/surface/surface-hover/content-primary/secondary/muted 만 사용.
- 타이포: text-h2/h3/body-sm/caption. Radius: rounded-pill(칩)/rounded-lg(카드).
- Spacing: gap-card-gap / gap-card-gap-lg, px-gutter / px-gutter-lg.
- 스틸 종횡비: `aspect-backdrop`(16/9) — BackdropImage 재사용(size="w780", StillSize 와 호환).
- 반응형 열: `grid-cols-1 md:grid-cols-2`.
- 모션: framer-motion — 칩 `whileTap`, 에피소드 카드 등장 fade/slide(reduced-motion 시 비활성).

### 검증
- `npx tsc --noEmit` 통과.
- `npx eslint` (변경 파일) 통과.
- `npm run build` 통과 — `✓ Compiled successfully`. 라우트 등록 확인:
  `ƒ /api/tv/[id]/season/[n]`(Dynamic), `ƒ /tv/[id]`.
