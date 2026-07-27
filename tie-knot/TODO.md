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

- [x] **1. 결제/트랜잭션 정합성** (B-2.2) — 문서 신규: `services/CLAUDE.md` 트랜잭션 섹션 추가. order+payment 원자적 처리 필수 조건, mongoose session 사용 원칙, 실패 시 롤백/보상 처리. 4단계로 진행: (1) `mongodb-memory-server`가 standalone이라 트랜잭션 테스트 자체가 불가능했던 선행 블로커부터 replSet 전환(PR #53), (2) 컨벤션 문서 확정(PR #54) — `mongoose.connection.transaction()` 하나로 패턴 통일, 트랜잭션 필요조건은 "여러 컬렉션/문서 쓰기 중 하나라도 실패하면 불변조건이 깨지는 경우"로 한정, (3) `payment.service.ts`의 `syncPayment`(PAID/FAILED 분기 모두 Payment+Order 쓰기가 하나의 논리적 단위)에 실제 적용(PR #55), 중간 실패 시 실제 롤백되는지 회귀 테스트로 검증, (4) 이 트랜잭션 경계를 그대로 활용해 `#11` 4번째 항목(`cancelledAt`/`cancelReason`)도 같이 정리(PR #56).
  - branch: `chore/mongodb-memory-server-replset`(PR #53) → `docs/services-transaction-guideline`(PR #54) → `refactor/payment-transaction`(PR #55) → `chore/order-cancel-fields-cleanup`(PR #56, `#11` 잔여분 겸용)

- [ ] **2. 상태/컨텍스트 구조** (B-4.1) — 문서 불필요 (`src/CLAUDE.md`에 "서버 데이터 Zustand 직접 이관 금지" 이미 명시). `useAuth.ts` 코드만 수정
  - branch: `refactor/use-auth-zustand-split`

- [x] **3. 도메인 응집도 — product 스키마를 mongoose discriminator로 재구성** (B-1.2, `#11` 필드 감사 중 논의 확장) — 프로젝트가 "모바일 청첩장 하나만"에서 이커머스 다품목(답례품/웨딩 소품/방명록 굿즈/예식 용품)으로 확장 예정인데, 지금 `product.model.ts`는 단일 평면 스키마라 invitation 전용 개념(미리보기 링크 등)과 공통 개념이 안 나뉘어 있음. mongoose 공식 discriminator(스키마 상속, 한 컬렉션에 여러 타입 저장)로 재구성하기로 확정. 2단계로 완료: 1차(PR #49)는 `previewUrl` discriminator 분리만 반영했는데, 아래 "확정된 설계"의 나머지 두 항목(business-card 제거, theme 필드)을 놓친 채 병합돼 후속 PR(#52)로 마무리함.
  - **확정된 설계**:
    - `category`(기존 필드)를 discriminatorKey로 그대로 재사용 — 별도 `__t` 필드 안 둠, "분류"와 "스키마 구분"이 같은 개념이라 필드 하나로 통일.
    - `category` enum에서 `business-card`(레거시, 로드맵과 무관) 제거.
    - **base(공통) 필드**: `authorId`, `title`, `description`, `thumbnail`, `price`, `category`, `subCategory`(필드는 공통 슬롯, 유효값 검증은 discriminator별로 각자), `isPremium`, `featureIds`(재분류 — `Feature`/유료 옵션 시스템 자체는 카테고리 무관 재사용 가능한 범용 메커니즘으로 판단), `isFeatured`, `priority`, `likes`, `views`, `salesCount`, `discount`, `status`, `deletedAt`
    - **invitation 전용 필드**: `previewUrl`, `theme`(신규 — `shared/constants/theme.ts`의 `PRODUCT_THEME_MAP`이 상품ID→테마를 하드코딩 중이었음, 실제 상품마다 값이 다른 게 코드로 이미 증명돼있어서 정식 필드로 승격. 관리자 폼으로 설정 가능하게, 상수 파일 하드코딩 제거)
    - 검토했지만 필드화 안 하기로 한 것: 썸네일 업로드 개수 제한(`coupleInfo.schema.ts` 하드코딩 "최대 10장") — 상품마다 달라야 한다는 실제 근거 없어서 플랫폼 공통 상수로 유지. 나중에 실제 필요 생기면 옵션 필드로 추가(breaking 아님).
  - **범위 밖**: 답례품/웨딩소품/방명록굿즈/예식용품 등 미착수 카테고리의 구체적 필드는 지금 안 정한다 — 실제로 그 카테고리 만들 때 그 시점 요구사항으로 정의(가정으로 필드 자리 미리 안 만듦).
  - branch: `refactor/product-schema-discriminator`(PR #49, previewUrl discriminator 분리) + `refactor/product-theme-field-cleanup`(PR #52, business-card 제거 + theme 필드 신설 — 원래 이 PR에서 같이 했어야 할 부분)

- [x] **4. 에러 처리** (B-5.2) — 착수 중 발견: 기존 null/throw 이분법만으로 부족해서 `services/CLAUDE.md`를 mongoose 공식문서 기준 규칙 6개(에러 분류 INTERNAL 통일, ObjectId 사전검증→NOT_FOUND, lean 판단 기준, runValidators, dbConnect 근거)로 먼저 재확정한 뒤 코드 반영. 범위도 `coupleInfo`/`product` 2개에서 `guestbook.service.ts`까지 확장. `coupleInfo.service.ts`(create/update/getCoupleInfoById), `product.service.ts`(전체 함수), `guestbook.service.ts`(전체 함수) 수정 + `createProduct.ts` 액션 dead code 제거. `runValidators: true`는 이번 라운드 보류 — coupleInfo는 현재 스키마로 관찰 가능한 효과가 없고(required가 update에서 $unset 없인 안 걸림, 다른 validator 없음), product는 `subCategory` validator가 update 컨텍스트에서 깨져서 선행 수정 필요(#9). 부수 발견: DB 테스트 여러 개를 처음 같이 돌리며 크로스파일 오염 발견 → `vitest.config.ts`에 `fileParallelism: false` 추가, `docs/TESTING_GUIDELINE.md` DB 테스트 섹션 갱신.
  - branch: `refactor/service-error-null-throw`

- [ ] **5. 인증 UI 가드** (B-2.1 연관) — 문서 신규: 페이지 레벨 접근 제어 패턴. redirect 사용 시점, 서버/클라이언트 컴포넌트 중 검증 위치 (proxy.ts는 이 용도 아님을 `src/CLAUDE.md`가 이미 명시)
  - branch: `docs/auth-guard-pattern`

- [ ] **6. 외부 연동 격리** (B-3.1) — 문서 불필요 (`lib/CLAUDE.md`에 "폴더 1개=연동 대상 1개" 이미 있음). `upload/signature/route.ts` 코드만 수정
  - branch: `refactor/upload-signature-isolation`

- [ ] **7. 공통 유틸/타입 배치** (B-5.1) — 문서 불필요 (`utils/CLAUDE.md`에 side-effect 분리 원칙 이미 있음). `open-app.ts` 이동만
  - branch: `refactor/move-open-app-util`

- [x] **9. models/CLAUDE.md mongoose 공식문서 기준 전면 재검토** (`#4` 작업 중 발견한 subCategory validator 버그가 시작점, 범위가 models 전체로 확장) — mongoose 공식문서 근거로 규칙 3개 추가: 모델 pre/post 훅에 도메인 로직 금지, ObjectId→string 변환은 services 소관(`.lean()`엔 스키마 toJSON 옵션 안 먹힘), `timestamps:true`면 인터페이스에 createdAt/updatedAt 둘 다 선언. 코드 반영: `order.model.ts` `require`→`required` 오타(검증 누락 버그) 수정 + `order.service.ts` 죽은 코드 정리, `IGuestbook`/`IOrder`에 `updatedAt` 추가, `product.model.ts` subCategory validator를 `this.get()` + `this.model.findOne(this.getQuery())` 폴백 방식으로 수정(`this.get()`만으론 안 됨, DB로 직접 검증함) 후 `updateProductService`에 `runValidators: true` 적용. 실제 스키마와 어긋나 있던 `coupleInfo.guide.md` 삭제. 규칙 위반 전수 점검에서 `order.model.ts`(`pre("save")` finalPrice 계산 + toJSON transform)와 `coupleInfo.model.ts`(toJSON transform) 2건 추가 발견 — CI mutation score 미달(59.44 < 60, 새 model.test.ts가 기존 미검증 코드까지 mutate 대상으로 끌어들여서) 계기로 바로 `order.service.ts`/`coupleInfo.service.ts`로 이관 완료.
  - branch: `refactor/models-mongoose-convention`

- [x] **10. `payment.model.ts` PortOne 결제수단별 상세정보 스키마 재설계** (`#9` 작업 중 필드 감사에서 발견 — `payment.model.ts`의 카드/가상계좌 필드 8개가 전부 미사용으로 확인됨) — 현재 `cardName`/`cardNumber`/`cardQuote`/`vbankName`/`vbankNum`/`vbankHolder`/`vbankIssuedAt`/`vbankDueAt` 8개 필드가 평평하게 나열돼있고 `payment.service.ts` 어디서도 안 채움. 이 프로젝트가 실제 노출하는 결제수단은 4개(`PaymentMethodSelector.tsx`: CARD/VIRTUAL_ACCOUNT/TRANSFER/MOBILE)지만, 스키마 설계는 PortOne 서버 SDK(`@portone/server-sdk`)가 실제 지원하는 7종 전체(Card/VirtualAccount/Transfer/Mobile/EasyPay/GiftCertificate/ConvenienceStore) + `Unrecognized` 폴백을 포함해서 진행하기로 확정(향후 결제수단 노출 확장 대비).
  - **설계 확정 사항**: PortOne의 `PaymentMethod`가 discriminated union이므로(`type` 필드로 구분), 지금처럼 모든 방법의 필드를 최상위에 평평하게 두지 않고 `methodDetail: { type, card?, virtualAccount?, transfer?, mobile?, easyPay?, giftCertificate?, convenienceStore? }` 형태의 서브 객체로 재구성한다. 필드명은 PortOne 원문 그대로 쓴다(한글 의미 기반 재명명 안 함 — 예: `vbankHolder`가 아니라 `remitteeName`) — API 응답과 1:1 매핑 유지, 번역 없이 그대로 소비.
  - **각 타입 필드 전체 목록**(`@portone/server-sdk` `dist/generated/payment/*.d.ts` 기준, 공식 SDK 자동생성 타입이라 신뢰도 높음):
    - Card: `card{publisher,issuer,brand,type,ownerType,bin,name,number}`, `approvalNumber`, `installment{month,isInterestFree}`, `pointUsed`
    - VirtualAccount: `bank`, `accountNumber`(필수), `accountType`, `remitteeName`, `remitterName`, `expiredAt`, `issuedAt`, `refundStatus`
    - Transfer: `bank`, `accountNumber`
    - Mobile: `phoneNumber`
    - EasyPay: `provider`, `easyPayMethod`
    - GiftCertificate: `giftCertificateType`, `approvalNumber`(필수)
    - ConvenienceStore: `convenienceStoreBrand`, `confirmationNumber`, `receiptNumber`, `paymentDeadline`
  - **미해결**: 이 PortOne 스토어에 테스트 결제가 0건(`getPayments()`로 직접 확인함, `POST_ONE_API_KEY` 유효) — 어떤 결제수단이 실제로 모의 테스트 가능한지(PG사별로 테스트 채널 동작 다름) 미확인. 실제 매핑 코드 검증하려면 결제를 최소 1건 만들어봐야 하는데, `npm run dev`가 `MONGO_TEST_URI` 없이 실제 Atlas DB(`DB_USER`/`DB_PASSWORD`)에 붙는 것으로 확인돼(격리된 로컬 DB 아님) Playwright로 실제 체크아웃 진행하는 건 보류함 — 어느 DB인지(프로덕션/공유 dev/버려도 되는 테스트용) 확인 먼저 필요.
  - branch: `refactor/payment-method-detail-schema`(PR #50) — 스키마 재설계까지만 완료, 위 "미해결" 항목(실제 매핑 코드 검증)은 그대로 남음

- [x] **11. 모델 필드 감사 후속 정리 4건** (fork로 7개 모델 필드 전수 조사, `#10` 발견 계기) — 사이즈 작고 서로 독립적이라 branch 하나로 묶음
  - `product.model.ts`의 `views`/`salesCount` — 읽기(관리자 테이블, 응답 스키마)만 있고 증가 로직 전무해서 항상 0이던 죽은 카운터였는데, 실무 이커머스에서 흔히 쓰는 지표라 삭제 대신 **구현**하기로 확정:
    - `views`: `products/[id]/page.tsx`(실제 상세페이지 렌더)에서만 증가. `payment.service.ts`(결제 검증용 조회)와 `(main)/page.tsx`(고정 미리보기 샘플)의 `getProductService` 호출은 증가 대상 아님 — `getProductService` 자체에 넣으면 이 두 호출도 조회수로 잡혀서 안 됨, 상세페이지 쪽에서 별도 호출로 증가시킨다.
    - `salesCount`: `payment.service.ts`의 `syncPayment`가 `order.orderStatus = "CONFIRMED"`로 전이시키는 지점(결제 PAID 확정 시점)에서 `order.product.quantity`만큼 증가 — "판매 건수"가 아니라 "판매 수량" 기준(지금은 quantity가 거의 항상 1이지만, 수량 개념 있는 상품군 확장 대비).
  - `product.model.ts`의 `deletedAt?: Date` — 스키마 `default: null`이라 실제로는 모든 문서에 항상 존재하는데 타입은 optional로 선언돼있음, 타입/실체 불일치 수정.
  - `premiumFeature.service.ts:5-13`의 `FeatureLeanDoc`이 `product.feature.model.ts`의 `IFeature`와 완전히 같은 shape을 로컬 재정의함 — 모델 타입 import해서 쓰도록 정리.
  - `order.model.ts`의 `cancelledAt`/`cancelReason` — 완전 미사용 확인됨(`payment.service.ts`가 주문 취소 시 `orderStatus`만 바꾸고 이 필드들은 안 건드림). TODO #1(결제/트랜잭션 정합성)과 범위 겹쳐서 당시엔 보류했는데, #1 Phase 3(PR #55)에서 실제로 확인해보니 `orderStatus`가 CANCELLED로 바뀌는 경로가 `syncPayment` FAILED 분기(결제 실패 시 시스템 자동 취소) 하나뿐이고 그 자리에 이미 취소 사유가 있어서, 관리자/webhook 취소 흐름을 가정으로 미리 설계하지 않고 그 경로에서만 채우는 걸로 완료(PR #56).
  - branch: `chore/product-order-field-audit-cleanup`(PR #51, 1~3번) → `chore/order-cancel-fields-cleanup`(PR #56, 4번)

- [x] **12. CI에 lint/build 게이트 추가 + pre-commit build를 tsc로 전환** (`#1` 결제/트랜잭션 정합성 논의 중 mutation testing의 로컬/CI 실행 기준을 따지다가 발견) — 현재 lint·build를 검증하는 CI가 하나도 없음(워크플로우 4개 전수 확인: `comment-test-score.yml`은 mutation만, `save-test-score.yml`은 baseline 캐시 저장, `verify-pr-source.yml`은 PR 소스 브랜치 확인, `lighthouse-audit.yml`은 성능 관측용). lint/build/coverage는 전부 `.claude/hooks/pre-commit-check.sh`(Claude Code PreToolUse 훅)에만 걸려있는데, 이건 git hook이 아니라서 Claude Code 밖에서(터미널 직접, IDE, GitHub 웹 UI) 커밋하면 통째로 우회된다 — 서버에서 강제되는 건 mutation(3차) 하나뿐.
  - **확정 방향**(web search로 업계 표준 확인 완료 — 근거 아래): "가벼운 검증은 local, 무거운 검증은 CI"가 원칙인데 `pre-commit-check.sh`의 `next build`가 여기서 벗어나 있음 — SSG(`generateStaticParams`가 있는 `/products/[id]`, `/preview/[id]`)가 실제 Atlas DB에 붙어서, 로컬 커밋마다 컨트리뷰터 수만큼 실제 DB를 건드리게 됨.
    - 로컬(`pre-commit-check.sh`): `next build` → **`next typegen && tsc --noEmit`**으로 교체. `tsc --noEmit` 단독은 안 됨 — Next.js 공식 GitHub Discussion(vercel/next.js #45181)에서 실제로 보고된 문제로, `next build`가 체크하는 `.next/types/**/*.ts`(라우트별 자동생성 타입, 이 프로젝트 `tsconfig.json` `include`에도 이미 있음)를 standalone `tsc`는 못 봐서 결과가 어긋날 수 있다 — `next build` 통과하는데 `tsc --noEmit`은 다른 결과를 내는 사례가 그 discussion에 그대로 나옴. Next.js 16의 `next typegen`("Generate TypeScript definitions for routes, pages, and layouts without running a full build" — 직접 실행해 DB 연결 없이 수 초 안에 끝나는 것 확인함)으로 그 타입을 먼저 만들고 `tsc --noEmit`을 돌리면 DB 안 건드리면서 `next build`와 같은 타입 커버리지를 얻는다.
    - CI: PR→dev 트리거로 lint + `next build`(SSG 포함, 실제 DB 검증)를 새 워크플로우로 추가 — Atlas 히트가 "커밋마다 N명의 로컬"에서 "PR push마다 CI 서버 1대"로 줄어듦.
  - lint/`test:coverage`는 이미 DB 안 쓰는 가벼운 검증이라 로컬 유지, 안 건드림.
  - 2 Phase로 완료: (1) 로컬 pre-commit build를 typecheck로 교체(PR #57), (2) CI에 `lint-build-check.yml` 신설(PR #58) — 신설 후 `dev` branch protection required status check에 `mutation`과 함께 `lint-build`도 등록 완료(GitHub API로 직접 확인), 이제 두 체크 다 통과해야 `dev` merge 가능.
  - branch: `refactor/precommit-typecheck-only`(PR #57) → `ci/lint-build-gate`(PR #58)

---

## Stage C — 신기능/UI (병렬, 오늘 진행 안 함)

- [ ] 세부 항목 미정 (추후 별도 정리)
