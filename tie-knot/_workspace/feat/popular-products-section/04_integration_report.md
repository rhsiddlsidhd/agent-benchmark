# 04_integration_report.md — feat/popular-products-section 통합 리포트

> 작성: 리더(feature-team-orchestrator)
> 대상: Phase4(test-suite) 인계, Phase5(PR) 근거

---

## 1. 요약

Home에 "인기 상품" 섹션(좋아요 수 기준 Top 8 가로 스크롤 캐러셀 + 순위 배지) 신설. REQ-1(백엔드 조회 경로), REQ-2(Home 섹션 배치), REQ-3(ProductCard rank 배지) 전부 구현 완료. Phase2+3에서 boundary-verifier가 유닛 4개(getPopularProductsService / PopularProductsSection / ProductCard-rank / home-integration) 전부 PASS 판정, REDO 0건, 강제 PASS 0건.

## 2. REQ 충족 판정 (00_requirements.json passes 갱신 완료)

| REQ | 내용 | 판정 | 근거 |
|---|---|---|---|
| REQ-1 | 좋아요순 정렬 + Top N 조회 경로 | **passes: true** | `getPopularProductsService` 구현+boundary PASS. 좋아요 0개/soft-deleted/`likes` 필드 없는 레거시 문서 전부 제외 검증(단위 테스트 실측), `deletedAt:null` 조건 유지 확인 |
| REQ-2 | Home 섹션 배치 + 3개 미만 숨김 | **passes: true** | `PopularProductsSection` 구현+boundary PASS. 게이트 단일 위치(`PopularProductsSection.tsx:11`) 확인, SubCategoryNavSection 다음 배치 순서 테스트로 검증 |
| REQ-3 | ProductCard rank optional prop | **passes: true** | `ProductCard` rank prop 구현+boundary PASS. 미전달 시 무회귀(기존 소비처 2곳 hash/동작 확인), `typeof rank === "number"` 가드 확인 |

## 3. Phase1~3 산출물 요약

- **API 계약** (`01_api_contract.md`): 신규 엔드포인트/Server Action 0개(Home Server Component가 서비스 직접 import). `getPopularProductsService(limit?, userId?)` 신규, `getAllProductsService` 무수정. 응답 shape 신규 필드 0개(`rank`/`likeCount` 없음, UI가 배열 인덱스로 순위 파생).
- **DB 설계** (`01_db_schema.md`): 신규 모델/필드/인덱스 0개. aggregation pipeline(`$match`→`$addFields`→`$sort` 5단 tie-break→`$limit`→`$unset`) 신규 도입 — 이 프로젝트 최초의 aggregate 사용. mongodb-memory-server 실측으로 `$expr`+`$size` 함정(레거시 문서에서 쿼리 전체 500) 등 확인·문서화.
- **UI 흐름** (`01_ui_flow.md`): 신규 컴포넌트 `PopularProductsSection`(서버 컴포넌트, 클라이언트 상태 없음), `ProductCard` optional `rank` prop, `HomeTemplate`/`page.tsx` 배치 수정. 기존 캐러셀(embla) 재사용 안 함(480px 캡 known issue 재현 방지, `SubCategoryNavSection` 선례와 동일하게 `flex overflow-x-auto`).
- **Phase2+3 boundary 판정**: `03_boundary/` 4개 JSON — 전부 PASS. `home-integration` 유닛만 1라운드 FIX(병합 전 시점엔 `getPopularProductsService` 소비처 0건 — page.tsx 배선 누락) → frontend-impl이 반영 후 2라운드 PASS.

## 4. 강제 PASS / MANUAL_INTERVENTION_REQUIRED

**없음.** REDO 2회 초과로 강제 PASS된 유닛 0건. `MANUAL_INTERVENTION_REQUIRED.md` 생성되지 않음.

## 5. Phase2+3 중 발생한 인프라 이슈 (참고, 코드 결함 아님)

- pre-commit 훅이 `git commit` 시 워크트리가 아닌 세션 기본 프로젝트 디렉토리(메인 리포)를 대상으로 lint를 도는 문제 + 메인 리포에 `stryker-tmp/sandbox-*`(mutation testing 임시 산출물, gitignore 대상, git 미추적) 잔재가 있어 커밋이 두 차례 막힘. `stryker-tmp` 삭제로 해소(사용자 승인 받음). 훅 스크립트 자체는 수정하지 않음(사용자가 최초 제안한 수정안은 반려됨).
- `src/shared/constants/product.ts`에 backend/frontend가 각자 동일 상수(`POPULAR_PRODUCTS_LIMIT=8`, `POPULAR_PRODUCTS_MIN_ITEMS=3`)를 추가해 병합 충돌(주석 한 줄) — 리더가 직접 해소, boundary-verifier가 재검증(중복 선언 없음 확인).

## 6. Phase4 인계 — 필독 검증 함정

**dev DB의 products가 2건뿐이라, 시딩 없이 홈 화면을 열면 인기 섹션이 구조적으로 렌더되지 않는다.** 좋아요가 있어도 3개 미만이라 REQ-2 기준 HIDDEN이 정답이며, 이건 정상 동작이다.

문제는 **조회 로직이나 렌더 조건이 완전히 깨져 있어도 화면 증상이 정확히 동일하다**는 것 — "안 보이니까 정상"과 "안 보이니까 버그"를 화면 확인만으로 구분할 수 없다. Phase2+3의 boundary-verifier 판정도 이 이유로 화면 확인을 증거로 쓰지 않고 전부 자동 테스트/typecheck/git hash 대조로만 판정했다.

**Phase4 통합 테스트가 반드시 지켜야 할 것 (`01_db_schema.md` §6-3, `01_ui_flow.md` §7.1 참고):**
- `mongodb-memory-server` 등에 좋아요 ≥1 상품을 **최소 4건**, 좋아요 수를 **서로 다르게**(예: 5/3/2/1), **동점 1쌍 포함**해서 시딩한 뒤 골든패스 검증.
- 좋아요 0개 상품과 soft-deleted 상품도 섞어서 제외 조건 검증.
- 순위 배지 숫자가 좋아요 내림차순과 일치하는지, 동점 쌍이 tie-break 5단(`likesCount→isFeatured→priority→createdAt→_id`)대로 결정적으로 정렬되는지 확인.
- 상품 3개 미만(0~2건) 케이스에서 섹션이 DOM에 렌더되지 않는지 별도 검증.
- "홈 화면에서 확인했다"는 단독 통과 근거로 인정하지 않는다 — 자동 테스트 결과가 1차 증거.

## 7. 스코프 밖 (건드리지 않음, 별도 이슈)

- `ProductCard`의 `CloudImage priority={true}` 하드코딩 — 인기 상품 8장 추가로 Home 우선 로드 이미지 증가, LCP 영향 가능성 있으나 기존 "베스트 디자인 템플릿" 캐러셀에도 이미 존재하는 상태라 이번 기능이 만든 문제 아님. 별도 이슈로 후속 처리 필요.
- "베스트 디자인 템플릿" 블록의 기존 `md:text-4xl`/`TemplateCarouselGroup`의 `sm:/md:/lg:basis` — 480px 캡 known issue 잔존 지점, 이번 PR 스코프 아님.
