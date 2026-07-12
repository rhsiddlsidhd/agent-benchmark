# 01_planner_tasks — AdultToggle 제거 → 카드 단위 19+ 블러 게이트 전환

> 입력 요청: "AdultToggle 제거 → 카드 단위 19+ 블러 게이트로 전환" (오케스트레이터가 인라인 제공한 요구사항 + /grilling 확정 사실).
> 대조 문서: docs/00_PRD.md, docs/01_ARCHITECTURE.md, docs/02_ADR.md 전체 통독 + globals.css(스타일 태스크) 확인 완료.
>
> **전환 방향(설계 핵심):** 기존은 `include_adult` 전역 토글로 성인물을 서버사이드에서 필터링(기본 노출 안 함). 신규는 성인물을 **항상 페칭**(`include_adult` 상시 true)하되 각 카드에서 `adult` 플래그로 **19+ 블러 게이트**를 씌워 클릭 시 노출. 따라서 include_adult 플러밍(Context/Toggle/훅/라우트 파라미터)은 제거하고, tmdb-client는 `include_adult: true` 하드코딩으로 바뀐다.
>
> **의존성 분해 근거 요약:**
> - ContentCard의 `adult` prop과 카드 뷰모델의 `adult` 필드는 소비측(Explorer/홈) 배선보다 **선행**해야 함(없는 prop/필드를 넘기면 컴파일 실패).
> - Context/Toggle **삭제**는 이를 참조하는 모든 파일(Explorer 2종·layout) 정리보다 **후행**해야 함 — 격리 워크트리에서 삭제-먼저는 미제거 참조 파일이 컴파일 실패를 일으킴.
> - 참조 제거(Explorer/hook vs 홈/layout)는 파일이 서로 안 겹쳐 병렬 가능하되, 그 사이엔 삭제 금지(참조 남아있음).

## 배치1
> 서로 파일이 겹치지 않고 기존 컴파일을 깨지 않는(추가/치환만) 독립 기반 작업. 4개 병렬.

### ContentCard 19+ 블러 게이트
- 작업: `ContentCard`에 선택적 `adult?: boolean` prop을 추가하고, `adult === true`일 때 포스터 위에 19+ 블러 게이트(블러 처리된 포스터 + "19+"/성인 콘텐츠 안내 + **클릭-투-리빌** 컨트롤)를 렌더한다. 미노출 상태에서는 포스터 이미지에 블러를 적용하고 제목/메타는 그대로 둔다(요구사항은 카드 단위 게이트). prop을 선택적으로 두어 기존 호출부(홈/검색/디스커버)가 깨지지 않게 한다(배선은 배치2). **주의 2가지를 반드시 해결:** (1) 카드 전체가 `<a>`(MotionLink) 래퍼라 리빌 컨트롤을 anchor 내부 중첩 인터랙티브로 두면 안 됨 — 게이트 노출 트리거는 링크 네비게이션과 분리(예: 오버레이 버튼에서 preventDefault/stopPropagation, 또는 게이트 미해제 시 링크 진입 차단)해 유효 마크업·a11y를 유지한다. (2) 리빌 컨트롤은 실제 `<button>` + 접근명으로 제공하고 색상만으로 상태를 구분하지 않는다(NFR-4). 블러는 Tailwind 유틸로 처리, 새 디자인 토큰 신설 없이 기존 overlay/surface/border 토큰만 사용한다.
- 근거: PRD FR-7(성인 콘텐츠 제어), NFR-3/NFR-4(로딩·상태 표시/접근성), ARCH §5.5(ui 공통 컴포넌트 — ContentCard), globals.css(기존 토큰만 사용)

### 카드 뷰모델에 adult 필드 추가
- 작업: 카드 뷰모델 타입에 `adult: boolean`을 추가하고 매퍼가 이를 채우게 한다. 대상: `CardItem`(홈) + `movieToCard`/`tvToCard`(각각 `movie.adult`/`show.adult` 매핑), `CardData`(디스커버) + `toCardData`(Movie/TVShow 분기 각각 `adult` 매핑). raw TMDB `Movie`/`TVShow` 타입에는 `adult`가 이미 선언돼 있으므로 원본 타입 확장은 불필요. 매퍼와 타입을 한 태스크로 묶어 self-consistent하게 유지(생성처가 매퍼뿐이라 필수 필드 추가가 안전).
- 근거: PRD FR-7, ARCH §5.5(ui 소비 계약), 파일배치 — 홈 뷰모델은 `src/app/_types`·`_utils`, 디스커버 뷰모델은 `src/app/discover/_types`·`_utils`(라우트 전용, `src/app/CLAUDE.md`)

### tmdb-client include_adult 상시 노출 + Route Handler 파라미터 제거
- 작업: `searchMulti`/`discoverByGenre`에서 `includeAdult` 파라미터를 제거하고 `include_adult: true`를 하드코딩한다(성인물을 항상 페칭 → 카드 게이트가 담당). 이에 맞춰 `/api/search`·`/api/discover` Route Handler에서 `includeAdult` 파싱과 클라이언트 호출 인자를 제거한다(클라이언트 함수 시그니처가 줄어 초과 인자 컴파일 오류 방지 — client와 두 route handler를 한 태스크로 묶음). 훅이 아직 보내는 `includeAdult` 쿼리 파라미터는 route handler가 무시하므로 이 단계에서 컴파일/동작 문제 없음(훅 정리는 배치2). Route Handler 검증/에러매핑 구조는 그대로 유지(`src/app/api/CLAUDE.md`).
- 근거: PRD FR-7, ARCH §9(성인 콘텐츠 include_adult 서버사이드 적용 — 정책이 "필터"에서 "상시 페칭"으로 변경), ADR-0003(키·TMDB 호출은 tmdb-client/서버 경계 유지), `src/app/api/CLAUDE.md`(검증→호출→매핑 경계)

### 문서 갱신 (PRD/ARCH/ADR)
- 작업: 이번 전환을 문서에 반영한다. (1) PRD FR-7을 "성인 콘텐츠 노출 토글(include_adult)"에서 "성인 콘텐츠 카드 단위 19+ 블러 게이트"로 재작성하고, 관련 사용자 스토리(§5의 토글 기반 문장)도 게이트 기반으로 수정. (2) ARCH §5.5 ui 인터페이스 목록에서 `<AdultToggle>` 제거(게이트는 ContentCard가 담당), §9 보안 고려사항의 "성인 콘텐츠 필터(FR-7)는 include_adult를 서버사이드에서 적용" 문장을 "성인물을 상시 페칭하고 클라이언트 카드 단위로 블러 게이트를 적용" 취지로 갱신. (3) 신규 **ADR-0005** 추가(Index + Log 최상단): 서버사이드 필터 토글 → 상시 페칭 + 클라이언트 카드 게이트로 전환한 결정과, **알려진 한계**(TMDB `adult` 필드는 노골적 성인물 마커일 뿐 한국 19금 등급을 커버하지 않음 — 사용자 인지·수용)를 Context/Decision/Consequences로 기록. `docs/03_DESIGN.md`는 base 스냅샷이므로 손대지 않는다.
- 근거: 요청 원문(FR-7이 PRD "Must"라 문서 자체가 갱신 대상), PRD FR-7·§5, ARCH §5.5·§9, ADR 로그 컨벤션(신규 결정 최상단 추가)

## 배치2 (배치1 완료·머지 후)
> 소비측 배선 전환 + include_adult 플러밍 제거 + Context/Toggle **참조** 제거(파일 삭제는 아직 하지 않음 — 배치3). 두 태스크는 파일이 겹치지 않아 병렬. 이 시점엔 Context/Toggle 파일이 남아 있어 두 워크트리 모두 독립적으로 컴파일된다.

### 검색·디스커버 배선 전환
- 작업: `SearchExplorer`/`DiscoverExplorer`에서 `useAdultContent` 구독과 `AdultToggle` 렌더/`includeAdult` 훅 인자 전달을 제거하고, ContentCard에 `adult`를 전달한다 — SearchExplorer는 raw 결과의 `movie.adult`/`show.adult`, DiscoverExplorer는 `card.adult`(배치1에서 `CardData`에 추가됨). 짝을 이루는 `useSearchInfinite`/`useDiscoverInfinite`에서도 `includeAdult` 파라미터·queryKey·fetch 쿼리 파라미터를 제거한다(훅 시그니처와 호출부를 한 태스크로 묶어 계약 불일치 방지). 인물 결과 카드(PersonResultCard)는 성인 게이트 대상 아님(그대로 둠).
- 근거: PRD FR-7, ARCH §5.3(search)·§4(discover)·§5.5(ContentCard 소비), NFR-1(queryKey 축소해도 캐싱 정합 유지), ADR-0003(훅은 키 미접근 유지)

### 홈·레이아웃 배선 전환
- 작업: 홈 캐러셀 경로에서 `adult`를 ContentCard까지 흘린다 — `CarouselSection`이 ContentCard props를 명시적으로 나열하므로(spread 아님) `adult={item.adult}` 전달을 추가한다(`item.adult`는 배치1에서 `CardItem`에 추가됨; 홈 `page.tsx`는 `CardItem[]`만 통과시키므로 무변경). 또한 `layout.tsx`에서 `AdultContentProvider` 래핑과 헤더의 `AdultToggle`을 제거한다(관련 import 정리). 히어로 캐러셀은 ContentCard를 쓰지 않고 트렌딩 기반이라 대상 아님.
- 근거: PRD FR-7, ARCH §5.2(home), `src/app/CLAUDE.md`(Provider는 layout에서 조립), NFR-4(헤더 구조 정합)

## 배치3 (배치2 완료·머지 후)
> 배치2로 Context/Toggle 참조가 전부 사라진 뒤에만 안전하게 삭제·정리. 순서상 앞 배치와 병합 불가(삭제-먼저는 미제거 참조로 컴파일 실패).

### AdultContentContext·AdultToggle 삭제 및 잔여 정리
- 작업: `src/context/AdultContentContext.tsx`와 `src/components/ui/AdultToggle.tsx`를 삭제하고, `src/components/ui/index.ts` 배럴에서 `AdultToggle` export를 제거한다. 삭제로 스테일해지는 코드-리포 문서도 정리: `src/app/CLAUDE.md` Gotchas의 "성인 콘텐츠 토글은 layout.tsx에서 전역 제공 …" 항목 제거/갱신, `src/context/CLAUDE.md` Gotchas의 성인 토글 URL 동기화 예시 문구 정리(다른 규칙 예시로 대체하거나 해당 예시 제거 — 규정 자체는 유지). 삭제 후 전체 타입체크/빌드로 잔여 참조 0 확인.
- 근거: 요청 원문(Context/Toggle 삭제 대상 명시), `src/components/CLAUDE.md`(배럴 경유 import — export 제거 필요), `src/app/CLAUDE.md`·`src/context/CLAUDE.md`(스테일 gotcha 정합)

## 미정 사항

- ~~TODO.md 실제 내용 부재~~ — **해결.** TODO.md 상세 내용은 `feat/ui-improvement` 브랜치(별도 작업)에 커밋돼 있고, 이번 `feat/adult-content-gate`는 `dev`에서 새로 분기해 그 커밋이 없었을 뿐(오케스트레이터가 브랜치 전환 순서를 잘못 안내). 오케스트레이터가 인라인 제공한 요구사항이 TODO.md 원문과 동일하므로 계획에 누락 없음.
- ~~블러 게이트 리빌 상태 지속성~~ — **해결. (a) 카드별 1회성, 리셋(지속 저장 안 함)으로 확정.** /grilling 세션에서 명시 합의됨. 배치1 T1 기술 그대로 최종 스펙.
- ~~빈 `src/context/` 폴더·CLAUDE.md 처리~~ — **해결. CLAUDE.md는 남긴다.** 유일 Context가 없어져도 문서 자체는 React Context 일반 컨벤션이라 향후 다른 Context 추가 시 그대로 재사용. 폴더는 CLAUDE.md만 남긴 채 유지, `.tsx`만 삭제.

모든 미정 사항 해결 완료 — 배치1부터 진행.
