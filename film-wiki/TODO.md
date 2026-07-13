# TODO

## 영화 리뷰 컴포넌트 구현 (완료)

### 내용

`/movie/[id]` 상세 페이지에 TMDB `/movie/{id}/reviews` 기반 리뷰 섹션을 인라인으로 추가. `analyst→planner→implementer→qa` 하네스 파이프라인(브랜치 `feat/review-component`)으로 진행.

- **배치1** (`367ac03`): `tmdb-client`에 `getMovieReviews(id, page)` + `Review`/`ReviewAuthorDetails` 타입 추가. TMDB API가 `sort_by`를 지원하지 않아 클라이언트 재정렬(`sortByCreatedAtDesc`, 기존 `sortByPopularityDesc` 패턴 재사용)로 최신순 보장.
- **배치2** (`153abfd`): `ReviewSection`(인라인 섹션, 상세 페이지 내 제작진 다음·추천작 앞) + `/api/movie/[id]/reviews` Route Handler + `useMovieReviews` 훅(TanStack Query). TMDB 응답(페이지당 20개)을 로컬 10개 단위로 재분할(`localPageToTmdbPage`/`sliceReviewsForLocalPage`). 200자 초과 본문 접기/펼침, 작성자 별점(`rating`) null이면 별점 영역 숨김, 빈 상태 안내 문구, 읽기 전용(작성/평점 부여 UI 없음).

두 배치 모두 QA(경계면 교차비교) 통과.

### 하네스 버그 발견 (수정 완료)

라이브 검증 중 두 가지 확인:

1. `AskUserQuestion`은 서브에이전트 컨텍스트에서 호출 자체가 거부됨 — analyst가 직접 사용자에게 못 물음.
2. `AskUserQuestion`은 호출당 질문 4개 제한.

`analyst`를 "질문 목록만 반환(상태:질문대기) → 오케스트레이터가 AskUserQuestion으로 대신 물음(4개 초과시 분할) → 답변과 함께 재호출" 왕복 구조로 수정(`5de6fae`, `.claude/agents/analyst.md`/`.claude/skills/feature-analysis/SKILL.md`/`.claude/skills/dev-orchestrator/SKILL.md`).

또한 배치1 implementer가 지시하지 않은 `git push`를 실행해 origin에 `feat/review-component`(커밋 `367ac03`)가 올라간 것을 확인 — PR은 없음. feature-implementation 스킬에 push 금지 명시가 없었던 게 원인으로 추정, 별도 후속 조치 필요(아래 TODO).

## TV 리뷰 지원 (완료)

`/tv/[id]` 상세 페이지에 TMDB `/tv/{id}/reviews` 기반 리뷰 섹션 추가. `analyst→planner→implementer→qa` 파이프라인(브랜치 `feat/review-component`)으로 3배치 진행.

- **배치1** (`11ee448`, `165c1c5`, worktree 병렬): `tmdb-client`에 `getMovieReviews`와 동일 패턴의 `getTvReviews(id, page)` 추가. 동시에 영화 측 리뷰 프레젠테이션 계층(`ReviewCard`→`src/components/ui/`, `sliceReviewsForLocalPage`/`localPageToTmdbPage`→`src/utils/`)을 movie/tv 공용으로 승격 — `ReviewSection`은 도메인 로직(훅 호출·페이지네이션 상태)만 남기고 렌더링 셸을 신규 `ReviewList`로 분리.
- **배치2** (`f30d23a`): `/api/tv/[id]/reviews` Route Handler + `useTvReviews` 훅 — 영화 측과 동일 검증/에러매핑 패턴.
- **배치3** (`e69a78d`): TV 전용 `ReviewSection` 조립(`useTvReviews`+공용 `ReviewList`+유틸), `/tv/[id]/page.tsx`에 인라인 배치(출연진↔추천작 사이, movie의 감독/제작진 자리 대체).

3배치 모두 QA 통과, 최종 배치는 브라우저 실렌더로 요구사항 9항목(10개페이지네이션/200자접기/null별점숨김/빈상태/인라인섹션/읽기전용/en-US/로딩·에러) 전부 확인.

## feature-implementation 스킬에 git push 금지 명시 (완료)

`.claude/skills/feature-implementation/SKILL.md`와 `.claude/agents/implementer.md`에 "커밋까지만 하고 push는 하지 않는다" 명시 추가.
