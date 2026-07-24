# TODO

## 진행 방식

- 작업 항목 1개 = worktree 1개 = branch 1개 (`docs/GIT.md` worktree 규칙)
- 완료 → PR → `dev` merge → 로컬/원격 branch 삭제 → worktree remove
- 체크리스트 갱신은 `dev` 브랜치에서 진행
- branch prefix는 `docs/GIT.md` Common 표 기준 (`feat/fix/docs/refactor/chore/test`)

---

## Stage A — 테스트 안전망 (오늘)

- [x] **1차 가드레일** — Write/Edit 도구 사용 시 대상 파일의 `test.ts` 부재하면 도구 실행 차단 (hook). 미충족 시 message로 명시
- [x] **2차 가드레일** — `npm run test:coverage` 임계값 검증(커밋 시). 커버리지(실행 여부) 기준선 확보
- [x] **3차 가드레일** — mutation testing 도입 (survived mutant로 부실 assertion 검출, coverage로 못 잡는 영역)
  - [x] Stryker Mutator 설치 + vitest runner 설정
  - [x] mutation score 임계값 정의 + 설정 파일(`stryker.conf`) 반영
  - [x] diff-scoped 실행(`--incremental`) 적용 — PR 변경분만 mutation, 전체 repo는 대상 아님 (`--since`는 구버전 옵션, 현재 stryker-js 공식 docs 기준 `--incremental`이 대체)
  - [x] 로컬 사전 실행용 npm script 추가 (예: `test:mutation`) — push 전 로컬에서 먼저 확인하는 습관 정착용, 강제 수단 아님
  - [x] GitHub Actions workflow 작성 — PR 트리거, mutation 실행, HTML 리포트 artifact 업로드
  - [x] branch protection에 해당 workflow를 required status check로 등록 — 실패 시 merge 버튼 잠금 (hook은 `--no-verify`로 우회 가능하므로 서버 쪽 최종 관문 필요). check context: `mutation` (PR#37 run에서 확인된 job name). `dev` branch protection에 등록 완료 — 이후 dev로 가는 모든 PR은 mutation testing 통과해야 머지 가능
  - [x] `docs/TESTING_GUIDELINE.md`에 mutation testing 섹션 추가 — survived mutant 발견 시 대응 흐름(리포트 확인 → assertion 보강 → 재실행) 문서화
  - branch: `chore/mutation-testing-stryker`

---

## Stage B — 아키텍처 정리 (오늘)

- [x] **0. ARCHITECTURE.md 정리** — server/client/shared 마이그레이션 완료 검증(문서↔코드 정합성 확인) 후, 목표 달성한 root 문서 제거 + `tie-knot/CLAUDE.md` References 참조 행 삭제. 구조 정보는 폴더별 CLAUDE.md(`server/`, `client/`, `shared/*`, `server/services/`, `app/api/`)로 이관 완료

### 구조 초안

```
B-1 핵심 구조
  B-1.1 레이어링
  B-1.2 도메인 응집도
  B-1.3 데이터 계약
B-2 크로스컷팅
  B-2.1 인증/세션 아키텍처
  B-2.2 결제/트랜잭션 정합성
  B-2.3 캐싱/데이터 페칭 전략
B-3 외부 경계
  B-3.1 외부 연동 격리
  B-3.2 API 레이어
B-4 클라이언트
  B-4.1 상태/컨텍스트 구조
  B-4.2 라우팅 구조
  B-4.3 UI 컴포넌트 계층
B-5 공통/운영
  B-5.1 공통 유틸/타입 배치 원칙
  B-5.2 에러 처리
  B-5.3 빌드/툴링 아키텍처
```

> 원본 초안 번호(B-2 중복)는 순차 재번호 처리 (외부 경계→B-3, 클라이언트→B-4, 공통/운영→B-5)

### 우선순위 작업 목록

- [ ] **1. 결제/트랜잭션 정합성** (B-2.2) — 문서 신규: `services/CLAUDE.md` 트랜잭션 섹션 추가. order+payment 원자적 처리 필수 조건, mongoose session 사용 원칙, 실패 시 롤백/보상 처리
  - branch: `docs/services-transaction-guideline`

- [ ] **2. 상태/컨텍스트 구조** (B-4.1) — 문서 불필요 (`src/CLAUDE.md`에 "서버 데이터 Zustand 직접 이관 금지" 이미 명시). `useAuth.ts` 코드만 수정
  - branch: `refactor/use-auth-zustand-split`

- [ ] **3. 도메인 응집도** (B-1.2) — 문서 신규: 카테고리-feature 매핑 규칙. 카테고리별 허용 feature 목록, 신규 카테고리 추가 체크리스트, 프로젝트 CLAUDE.md "청첩장 하나만" 서술 현행화
  - branch: `docs/category-feature-mapping`

- [ ] **4. 에러 처리** (B-5.2) — 문서 불필요 (`services/CLAUDE.md`에 null/throw 이분법 이미 있음). `coupleInfo.service.ts`, `product.service.ts` 코드만 수정
  - branch: `refactor/service-error-null-throw`

- [ ] **5. 인증 UI 가드** (B-2.1 연관) — 문서 신규: 페이지 레벨 접근 제어 패턴. redirect 사용 시점, 서버/클라이언트 컴포넌트 중 검증 위치 (proxy.ts는 이 용도 아님을 `src/CLAUDE.md`가 이미 명시)
  - branch: `docs/auth-guard-pattern`

- [ ] **6. 외부 연동 격리** (B-3.1) — 문서 불필요 (`lib/CLAUDE.md`에 "폴더 1개=연동 대상 1개" 이미 있음). `upload/signature/route.ts` 코드만 수정
  - branch: `refactor/upload-signature-isolation`

- [ ] **7. 공통 유틸/타입 배치** (B-5.1) — 문서 불필요 (`utils/CLAUDE.md`에 side-effect 분리 원칙 이미 있음). `open-app.ts` 이동만
  - branch: `refactor/move-open-app-util`

- [ ] **8. 빌드/툴링 아키텍처** (B-5.3) — 문서 신규: `scripts/CLAUDE.md` 신설. 스크립트별 목적, npm script 등록 여부, CI 연동 여부, 수동 실행 구분
  - branch: `docs/scripts-claude-md`

---

## Stage C — 신기능/UI (병렬, 오늘 진행 안 함)

- [ ] 세부 항목 미정 (추후 별도 정리)
