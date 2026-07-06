## T10 — 인물 상세 `/person/[id]` + 필모그래피 (FR-5)

### 변경 파일
- `src/app/person/[id]/page.tsx` (신규) — Server Component. `getPerson`(null→notFound) → `getPersonCombinedCredits` 호출, 프로필+이름+약력 히어로, 필모그래피 정렬/중복제거/경로산출.
- `src/app/person/[id]/filmography.tsx` (신규) — Client Component. 출연작/제작 참여 세그먼트 토글 + `ContentCard` 포스터 그리드.
- `src/app/person/[id]/not-found.tsx` (신규) — 없는 id 전용 404 레이아웃(movie/tv 동일 패턴).
- `src/app/person/[id]/error.tsx` (신규) — 세그먼트 Error Boundary, `unstable_retry` 재시도(T7/T8 동일 패턴).

### 데이터 흐름 / 방식
- 상세 경로이므로 **Server Component 직접 호출**(ADR-0003). Route Handler/TanStack Query 불필요 — 토글은 이미 로드된 배열 간 클라이언트 전환일 뿐 재요청이 없다.
- 캐싱은 `client.ts`가 `revalidate: 86400`(DETAIL) 주입 → 페이지 레벨 설정 없음.
- API 응답 shape: 해당 없음(Route Handler 신설 없음).
- 훅 제네릭 타입: 해당 없음(TanStack Query 미사용).

### Client 컴포넌트 prop 계약 (교차검증용)
`Filmography` props / `FilmographyEntry` (filmography.tsx에서 export, page.tsx가 type import):
```ts
interface FilmographyEntry {
  key: string;            // "movie:{id}" | "tv:{id}" (중복제거·리스트 key)
  href: string;           // "/movie/{id}" | "/tv/{id}"
  title: string;          // movie.title | tv.name
  posterPath: string | null;
  year: string | null;    // 개봉/방영 연도, 없으면 null
  rating: number | null;  // vote_average
}
interface FilmographyProps { castEntries: FilmographyEntry[]; crewEntries: FilmographyEntry[]; }
```

### 정렬 로직 (최신순)
- 정렬 기준 날짜: movie → `release_date`, tv → `first_air_date` (media_type 판별자로 분기).
- **개봉/방영일 내림차순**. ISO 날짜(YYYY-MM-DD)는 `localeCompare` 사전식 비교가 시간순과 일치 → `b.date.localeCompare(a.date)`.
- **날짜 없는 항목(빈 문자열)은 항상 맨 뒤**로 정렬(comparator에서 명시 분기).
- 정렬/중복제거는 모두 **Server Component(page.tsx)에서 완료** 후 정렬된 배열만 Client로 전달 → Client 경계 최소화.

### 중복 제거
- 같은 작품이 여러 크레딧(예: 감독+각본, 또는 여러 배역)으로 중복 등장 가능 → `media_type:id` 키 기준 첫 항목만 유지(`Map`). 동일 작품이므로 poster/date/rating 동일, 첫 항목 채택이 안전.

### 토글 방식
- 세그먼트 토글 2버튼(`출연작`/`제작 참여`), 각 버튼에 건수 표시. `aria-pressed`로 선택 상태 노출, framer-motion `whileTap`(reduced-motion 시 제거).
- 기본 활성 탭: 출연작이 있으면 `cast`, 없으면 `crew`.
- 탭 전환 시 `key={activeTab}`로 그리드 재마운트 → `fadeUp`(reduced-motion 시 `fadeOnly`) 등장 모션 재생.
- 그리드 열 수: 검색 결과 그리드와 동일 토큰 `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6`, 간격 `gap-card-gap`/`md:gap-card-gap-lg`(§4).

### 반영한 에러/엣지케이스 (§4)
- **없는 id → `notFound()`**: id 파싱 불가(비정수/음수) 또는 `getPerson` null → `notFound()` → `not-found.tsx`.
- **fetch 실패 → `error.tsx`**: `getPersonCombinedCredits` throw(타임아웃/5xx/네트워크)는 세그먼트 Error Boundary로 전파, `unstable_retry` 재시도. **순서 원칙 준수**: `getPerson` null 체크(→notFound)를 combined_credits 호출보다 먼저 수행 → 없는 id가 credits throw로 error.tsx에 새지 않음(T7/T8 동일).
- **429 패스스루**: `client.ts`가 상태코드 보존(자체 재시도 없음, ADR-0004). 상세 경로는 Route Handler 없이 서버에서 직접 조회하므로 429는 error.tsx 경계로 전파.
- **데이터 결측(§2.9)**:
  - 약력(biography) 빈 문자열 → "약력 정보가 없습니다." 대체 문구.
  - 프로필 이미지(profile_path) null → 이니셜 플레이스홀더.
  - known_for_department/생년월일/출생지 결측 → 해당 줄/Pill 생략.
  - 카드 개별 결측(poster/year/rating)은 `ContentCard`/`PosterImage` 기존 처리 위임.

### cast/crew 빈 배열 처리 방식 (판단 근거)
- **둘 다 비면 필모그래피 섹션 자체를 숨김**(page.tsx `hasFilmography` 가드) — §2.9 "리스트가 비면 섹션 자체 숨김" 정책과 일치. EmptyState를 쓰지 않은 이유: 인물 상세의 약력 섹션이 이미 존재하므로 화면이 비지 않으며, movie/tv 상세의 출연진/추천 섹션이 빈 배열일 때 EmptyState 없이 섹션을 숨기는 기존 컨벤션과 통일하기 위함.
- **한쪽만 비면 해당 토글 버튼 자체를 렌더하지 않음**(filmography.tsx `hasCast`/`hasCrew` 조건부 렌더) — 빈 구분으로 전환 시 빈 그리드가 노출되는 문제를 원천 차단. 존재하는 구분만 토글로 노출(§2.9 "빈 리스트는 컨트롤 숨김"의 연장).

### 완료 기준 점검
- tsc `--noEmit`: 통과.
- eslint(src/app/person): 통과.
- npm run build: (별도 기록 — 아래 요약 참조).
