## T8 — TV 상세 `/tv/[id]` 기본 (FR-4)

### 변경 파일
- `src/lib/tmdb/client.ts` — `getTvCredits(id): Promise<Credits>`, `getTvRecommendations(id): Promise<Paginated<TVShow>>` 추가(신규 export 2개).
- `src/app/tv/[id]/page.tsx` — 신규(Server Component, TV 상세 히어로/개요/출연진/추천).
- `src/app/tv/[id]/not-found.tsx` — 신규(존재하지 않는 id 전용 레이아웃).
- `src/app/tv/[id]/error.tsx` — 신규(세그먼트 Error Boundary, `unstable_retry`).
- `src/app/tv/[id]/person-link.tsx` — 신규(movie 버전 복제).
- `src/app/tv/[id]/detail.module.css` — 신규(movie 버전 복제).

### API 응답 shape
- 해당 없음. T8은 전 경로 Server Component 직접 호출이라 Route Handler(`/api/*`)를 추가하지 않음. TMDB 접근은 모두 `tmdb-client` 경유(ADR-0003).

### 훅 타입
- 해당 없음(TanStack Query 훅 없음 — 인터랙티브 페치 없음, 전부 서버 렌더).

### 반영한 에러/엣지케이스 (01_ARCHITECTURE §4)
- 존재하지 않는 id → `getTvShow` null 또는 id 파싱 불가(비정수/음수) → `notFound()` → `not-found.tsx`.
- TMDB fetch 실패(타임아웃/5xx/네트워크) → `TmdbError` throw → `error.tsx`(세그먼트 경계) + `unstable_retry()` 재시도. TV 존재 확인(`getTvShow`) 이후에만 credits/recommendations 병렬 조회하므로 없는 id가 error.tsx로 새지 않음.
- 데이터 결측(§2.9): 개요 없으면 "개요 정보가 없습니다.", 방영연도 없으면 "방영일 미정", 회차 러닝타임 없으면 "러닝타임 정보 없음"(텍스트 대체 문구). 출연진/추천 리스트가 비면 해당 섹션 전체 숨김. 이미지 null은 Poster/Backdrop/PersonAvatar 플레이스홀더 처리.
- 캐싱: 상세 revalidate 86400(client.ts REVALIDATE.DETAIL 주입, 페이지 레벨 설정 없음). 빌드 출력 `/tv/[id]` Revalidate 1y expire(dynamic ƒ, on-demand 서버 렌더 + fetch revalidate).

### 함수 커버리지 판단 근거 (필독 지시 사항)
- `grep`으로 확인 결과, client.ts에는 TV 전용 크레딧/추천 함수가 없었고 movie 버전(`getMovieCredits`/`getMovieRecommendations`)만 존재. 이들은 `/movie/{id}/...` 엔드포인트를 호출하므로 TV id에 재사용 불가(잘못된 데이터/404) → "기존 함수로 커버" 불가능.
- 그러나 T8 완료 기준이 출연진/추천 렌더를 명시적으로 요구 → 렌더할 데이터 소스가 반드시 필요.
- 따라서 "억지 신규 함수"가 아니라, 이미 확립·검증된 `getMovieCredits`/`getMovieRecommendations` 패턴을 그대로 미러링해 `getTvCredits`(→ `/tv/{id}/credits`)·`getTvRecommendations`(→ `/tv/{id}/recommendations`) 2개를 추가. 반환 타입은 신규 정의 없이 기존 타입 재사용:
  - `Credits` — types.ts 주석이 "movie/tv 크레딧 응답"으로 명시한 공용 shape(cast/crew).
  - `Paginated<TVShow>` — TV 추천 결과는 TVShow 목록 아이템(name/first_air_date/poster_path/vote_average).
- 판단: 단일 접근 지점(tmdb-client, ADR-0003) 안에서 기존 패턴을 복제한 최소 추가이므로 아키텍처 일관성 유지. T2(tmdb-client) 스펙이 TV 상세용 크레딧/추천 함수를 누락했을 가능성 있음 → QA/Planner에 플래그(향후 T2 문서 보강 대상).

### T7(영화 상세)과 다른 점
- 필드 매핑: `title`→`name`, `release_date`→`first_air_date`, `runtime`(number|null)→`episode_run_time`(number[], 첫 양수값 선택 `pickEpisodeRuntime`).
- 섹션 범위: 감독·제작진(crew) 섹션 미포함. T8 구현 범위·완료 기준이 히어로/개요/출연진/추천 4개만 명시(제작진 미열거)하여 scope 최소화 원칙에 따라 제외. crew 관련 로직(selectKeyCrew/JOB_LABELS 등) 미이식.
- 시즌/에피소드 영역: T9 범위이므로 미포함(임시 placeholder도 두지 않음).
- 추천 링크: movie는 `/movie/[id]`, TV는 `/tv/[id]`.

### T7과의 코드 공유 방식
- `person-link.tsx`, `detail.module.css`는 **복제**(공유/이동 리팩터링 대신). 근거: (1) 범위 최소화 우선 지시, (2) 공용 위치 이동 시 검증 완료된 T7 movie 파일 import를 수정해야 해 T7 회귀 리스크 발생, (3) 라우트 세그먼트 간 cross-import(`../../movie/[id]/...`)는 movie 폴더 내부 파일에 fragile 결합. 각 라우트 자기완결성 유지 + T7 무변경을 택함. 두 파일은 movie 버전과 동일 로직·동일 디자인 토큰(신규 토큰/arbitrary value 없음).

### 검증 결과
- `npx tsc --noEmit`: 통과(0 에러).
- `npx eslint src/app/tv src/lib/tmdb/client.ts`: 통과(0 경고).
- `npm run build`: 성공. `/tv/[id]` dynamic(ƒ) 라우트 등록 확인.
