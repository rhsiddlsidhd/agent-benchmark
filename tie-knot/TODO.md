# TODO

## 진행 방식

- 작업 항목 1개 = worktree 1개 = branch 1개 (`docs/GIT.md` worktree 규칙)
- 완료 → PR → `dev` merge → 로컬/원격 branch 삭제 → worktree remove
- 클러스터(파일·주제 겹침)는 같은 worktree에서 순차 처리한다 — 의존성이 없어도 같은 파일이면 병렬로 나누지 않는다
- TODO.md 갱신은 `docs/todo-section-taxonomy` 브랜치에서만 한다. 작업 브랜치는 "미분류 인박스"에만 append (`AGENTS.md` Git 규칙)

## 섹션 기준

항목을 어느 섹션에 넣을지는 **발견 경로가 아니라 아래 정의**로 판단한다. 발견 경로는 항목 본문에 태그로 남긴다.

| 섹션 | 정의 | inbound | 판정 |
| --- | --- | --- | --- |
| 새 피처 | 새 엔드포인트·화면·데이터모델이 동시에 신설 | 사업 요구 (스윕 아님) | `feature-team-orchestrator` 5-Phase 통과 |
| 버그 수정 | 기존 스펙 위반. 정답이 이미 있음 | 실사용·playwright 중 기능 미작동 · test-suite · 코드 리뷰 · 대조군 실험 | 재현 절차 → fix → 회귀 테스트 그린 |
| 성능 개선 | 동작은 맞으나 비용이 과함. 정답 = 수치 | lighthouse 리포트(프론트) · 쿼리/인덱스 리뷰(백엔드) | 변경 전후 측정 대조 |
| UI 수정 | 동작하지만 부족·불편. 정답 = 요청자 지시 또는 프로젝트 개요 대비 판단 | 실사용 워크스루(신규 화면 직후, 반복 N회) · 라우트 상태 매트릭스(빈·로딩·에러·극단값) · 개요 변경 시 라우트 목적 대조 · lighthouse a11y/best-practices | 시각 확인 (before/after) |

- 목적 밖 발견은 세 갈래로 처리한다(전역 `GIT.md` Branch 규칙) — 현재 작업을 **막으면** 같은 브랜치에서 커밋 분리해 고치고, **막지 않으면** 미분류 인박스에 적고 지금 고치지 않으며, **다른 작업을 무력화하면**(게이트 무력화·데이터 손상·보안) 작업을 멈추고 별도 브랜치로 즉시 처리한다.

---

## 새 피처

- [ ] **마켓플레이스 전환 (제3자 판매자 입점)** (2026-08-06 방향성만 논의, 착수 아님) — 현재 `UserRole`은 `"USER" | "ADMIN"` 둘뿐이고(`user.model.ts:2`) 상품 등록은 `createProduct.ts`의 `role !== "ADMIN"` 체크로 관리자 전용(자사 직접판매몰 구조, `authorId`는 "등록한 관리자"만 의미). `SELLER` role 추가해 제3자 판매자가 직접 상품을 입점시키는 구조로 전환하는 방향이 논의됨. 착수 시 파급 범위 큼 — 착수 전 별도로 팬아웃 설계 필요:
  - 상품 등록/수정/삭제 권한 체크 전반에 `SELLER` 포함, 상품 소유권 개념 신설(자기 상품만 수정/삭제 가능하도록 인가 로직 추가 — `authorId`의 의미가 "등록한 관리자"에서 "소유 판매자"로 바뀜)
  - 판매자 정산/수수료 체계, 판매자 프로필/스토어 페이지, 관리자의 판매자 상품 검수 플로우 등 마켓플레이스 특유 기능 신규 설계
  - 위 "상품 카테고리별 확장" 항목과 별개 트랙 — 섞어서 진행하지 않는다.

---

## 버그 수정

> 아래 4개 클러스터는 주제 기준 서브그룹 — 클러스터 안에서 위→아래 순서로 처리 권장(2026-08-08 정리, 파일/맥락 겹침 기준). 단, **클러스터 간 순서로는 "단독" 클러스터의 `test:coverage:diff` 항목(#24)을 전체 중 최우선으로 먼저 처리 권장** — 원인 실증 완료, 이게 살아있는 한 나머지 클러스터 작업물의 커버리지 게이트가 무력함(상세는 해당 항목 참고).

### 클러스터 1 — 이미지 파이프라인 (25 → 22 → 28 순서)

- [ ] **상품 이미지 업로드가 Server Action 기본 body size limit(1MB)에 걸리는 잠복버그** (2026-08-07 발견, 목데이터 삽입 준비 중 논의) — `createProduct`/`updateProduct`가 `thumbnail`/`images`(신규 갤러리, PR #95)를 File 객체 그대로 FormData에 실어 Server Action으로 보내는데, `next.config.ts`에 `experimental.serverActions.bodySizeLimit` 오버라이드가 없어 Next.js 16 기본값 1MB 그대로 적용된다(`node_modules/next/dist/docs/01-app/02-guides/server-actions.md:83`). 실사진(수 MB급) 몇 장만 같이 올려도 걸릴 가능성 높음 — vitest 목업 File은 작아서 지금까지 안 걸렸을 뿐. 청첩장(couple-info) 폼이 이미 같은 문제로 클라이언트 직접업로드(signed, `/api/upload/signature`)로 우회한 전례가 있음.
  - **참고**: `next-cloudinary`(v6.17.5) 패키지가 이미 설치돼있고 `CldUploadWidget`/`CldUploadButton`(Cloudinary 공식 모달형 업로드 UI, 드래그드롭/카메라/구글드라이브 소스 지원)을 제공하는데 `src/` 어디서도 안 씀 — 상품 이미지 업로드를 이걸로 전환하면 body limit 문제가 구조적으로 사라짐(서버가 파일 바이트를 안 거침). 단, 이번 PR(#95)에서 확정한 `images` 요청 계약(`{existing: string[], newFiles: File[]}`)을 `string[]`로 바꿔야 하는 규모 있는 변경이라 별도 설계 필요.
  - 목데이터 삽입(위 "상품 카테고리별 확장" 항목의 실 데이터 검증 단계)은 당장 작은 플레이스홀더 이미지로 우회 가능 — 이 항목이 그 착수를 막지는 않음.
- [ ] **`updateProduct`의 `thumbnail` required 기존 부채** (2026-08-07 재확인, PR #95 스코프아웃) — `productSchema`가 `thumbnail`을 `File(size>0)` required로 잡아서 상품 수정 시마다 썸네일 재업로드가 강제된다. `images` 필드는 `existing` 합산 설계로 이 문제를 안 만들었지만 `thumbnail` 자체는 그대로.
- [ ] **상품 상세 페이지가 `images`(상세 이미지 갤러리) 필드를 아예 렌더링하지 않음** (2026-08-07 발견, 목데이터 14건 실등록 검증 중 — PR #95 스코프아웃) — `ProductFeatures.tsx:45-48`의 "상세 정보" 섹션이 헤딩만 있고 본문이 완전히 비어있다. `ProductDetailTemplate.tsx`가 `ProductFeatures`엔 `options`(premiumFeatures)만 넘기고 `product`/`product.images` 자체를 전달하지 않는다 — 갤러리 소비 코드가 통째로 없다. 등록 폼에서는 non-invitation 카테고리에 `images`를 필수(최소 1장)로 강제해놓고 정작 고객에게는 노출이 안 되는 상태 — 사진으로 구매를 설득해야 하는 답례품/웨딩소품 카테고리에서 특히 치명적. `images: string[]`를 `ProductDetailTemplate`→`ProductFeatures`(또는 신규 갤러리 organism)로 내려서 렌더링 추가 필요.

### 클러스터 2 — 카테고리별 하드코딩 문구 (같이 고칠 것)

- [ ] **`OrderSummary.tsx` "청첩장 템플릿" 하드코딩** (2026-08-07 발견, PR #95 스코프아웃) — 주문서 상품명 아래에 카테고리 무관하게 `"청첩장 템플릿"`을 하드코딩해서 렌더한다. 카테고리가 5종으로 늘어난 지금 답례품/방명록 등 주문서에도 그대로 뜬다. `CheckoutItem`에 카테고리 정보가 없어서 고치려면 `CheckoutItem` 계약 변경이 필요.
- [ ] **상품 상세 페이지의 invitation 전용 안내 문구가 전 카테고리에 하드코딩 노출** (2026-08-07 발견, 목데이터 14건 실등록 검증 중) — `ProductSummary.tsx:125,131,137`의 "구매 후 즉시 사용 가능하며, 무제한으로 수정할 수 있습니다" / "평생 호스팅이 포함되어 있어 별도의 유지비가 없습니다" / "모바일과 데스크톱 모두에서 완벽하게 작동합니다" 문구가 캔들홀더 같은 실물 상품 상세페이지에도 카테고리 분기 없이 그대로 뜬다. 위 `OrderSummary.tsx` "청첩장 템플릿" 하드코딩 버그와 동일 패턴의 별도 미등록 지점 — 함께 고칠 것.

### 클러스터 3 — 관리자 등록 폼 (`ProductRegistrationForm.tsx`, UI섹션 "연속 등록 워크플로우" 항목과 같은 파일 — 함께 처리 권장)

- [ ] **관리자 상품 등록 폼 가격 입력이 `step="1000"` 강제 + 실패 시 무피드백** (2026-08-07 발견, 목데이터 14건 실등록 검증 중) — `ProductRegistrationForm.tsx:203`(`src/client/components/organisms/`)의 `price` input이 `step="1000"`이라 1000원 배수가 아닌 값(예: 4,500원)을 입력하면 브라우저 네이티브 validation에 걸려 "상품 등록" 버튼 클릭이 조용히 씹힌다 — 화면에 에러 메시지가 전혀 뜨지 않아 관리자는 원인을 알 수 없다(직접 재현: 4500원 입력 후 클릭 시 서버 액션 자체가 호출 안 됨, `element.validity.valid === false`로 확인). 답례품처럼 저가·비정형 가격 책정이 흔한 카테고리에 특히 문제 — `step` 완화 또는 커스텀 에러 메시지 노출 필요.

### 단독 — 연관 항목 없음, 순서 무관 (단, #24는 아래 이유로 최우선 권장)

- [ ] **어드민 사이드바가 최초 진입 시 관리자 계정도 "일반 계정"으로 잠깐 표시** (2026-08-07 발견 [발견: 목데이터 14건 실등록 워크스루], 2026-08-08 UI 수정 → 버그 수정으로 이동) — `/admin/products/new` 최초 진입 직후 사이드바 하단 계정 표시가 "일반 계정"으로 렌더됐다가 `/api/auth/me` 응답 도착 후 "관리자 계정"으로 정정된다(관리자로 로그인한 상태에서도 동일). role 정보가 비동기로 채워지기 전 기본값이 "일반 계정"이라 순간적으로 오탐 신호를 준다 — 기본값을 로딩 스켈레톤이나 빈 상태로 바꾸는 게 안전.
  - **섹션 이동 근거**: 관리자에게 "일반 계정"을 보여주는 건 기존 스펙 위반이라 정답이 이미 있고, 회귀 테스트로 못박을 수 있다 — 시각 확인으로 닫는 UI 수정 섹션 기준에 맞지 않는다.

- [ ] **`test:coverage:diff`가 괄호 경로(라우트 그룹) 파일을 커버리지 게이트에서 조용히 누락** (2026-08-07 발견, PR #95 — 2026-08-08 원인 실증 완료) — `coverageInclude` 필터가 파일 경로를 글롭 패턴처럼 다뤄서 `src/app/(admin)/...`처럼 `(...)` 라우트 그룹이 든 경로가 매칭 실패로 커버리지 체크 대상에서 빠진다. 게이트 통과가 검사 완료를 보장하지 않는 상태 — `(admin)`/`(main)`/`(products)`/`(checkout)` 하위 전체 파일이 동일 영향권.
  - **원인 확정**: `vitest.config.ts:37`의 `coverage.include`가 vitest 내부적으로 `picomatch`(`node_modules/vitest/dist/coverage.js:8-9`)로 필터링되는데, 괄호 든 경로가 매칭 실패로 조용히 탈락한다.
  - **실증(2026-08-08)**: 동일 내용(함수 4개 중 1개만 테스트, line 25%) 파일을 두 위치에 만들어 대조 — 괄호 경로(`src/app/(admin)/...`)는 `coverage` 리포트 자체가 `0/0/0/0`으로 파일을 아예 못 잡고 게이트 통과(exit 0, 에러 없음). 괄호 없는 대조군(완전 동일 코드)은 `25%` 정상 집계되고 `ERROR: Coverage for lines (25%) does not meet global threshold (80%)`로 정상 fail. 같은 코드, 경로 괄호 유무만 다른데 게이트 동작이 갈림 — 확정.
  - **우선순위 상향 근거**: 이 버그가 살아있는 한 `(admin)`/`(main)`/`(products)`/`(checkout)` 하위 파일들은 vitest coverage 게이트가 사실상 무검사 상태다 — 다른 fix 클러스터(1~3) 작업물의 커버리지도 이 경로들 안에 있으면 게이트가 못 잡아준다. 다른 클러스터보다 먼저 고치는 게 맞음.
- [ ] **존재하지 않는 productId + non-invitation category로 `updateProduct` 호출 시 `NOT_FOUND` 아닌 `INTERNAL`(500) 반환** (2026-08-07 test-suite 발견, PR #95 스코프아웃) — `product.model.ts`의 `subCategory` 비동기 validator가 대상 문서를 못 찾으면 category를 못 읽어 무조건 검증 실패로 떨어지는 게 원인으로 추정(5/5 재현). 카테고리가 discriminator 없는 4종(favor/accessory/guestbook/ceremony)으로 늘어나며 새로 열린 경로. mongoose validator 재설계 필요해 최소조치로 안 됨 — 데이터 무결성 문제 아니라 에러코드 오분류 수준이라 우선순위 낮음.

---

## 성능 개선

- [ ] **`Product` 복합 인덱스 추가 검토** (2026-08-07, PR #95 스코프아웃) — 카테고리가 1종→5종으로 늘면서 `category` 필터에 실질적 선택도가 처음 생겼다. 제안: `{deletedAt:1, category:1, isFeatured:-1, priority:-1, createdAt:-1}`(ESR 순서). 현재 `productSchema`엔 `_id` 외 인덱스가 0개(기존 부채) — 이번 기능 PR에 성능변경을 안 섞으려고 분리함. 이 인덱스는 `category` 지정 호출만 커버하고 전체 목록 경로(category 미지정)는 여전히 in-memory sort라, 두 경로 다 커버하려면 인덱스 2개 필요 — 실 데이터 규모 보고 판단.

---

## UI 수정

- [ ] **상품 등록 폼이 연속 등록 워크플로우를 지원하지 않음** (2026-08-07 발견 [발견: 목데이터 14건 실등록 워크스루], 버그수정 클러스터3 "관리자 등록 폼"과 같은 파일 — 함께 처리 권장) — "상품 등록" 성공 시 무조건 `/admin/products` 목록으로 리다이렉트한다(`ProductRegistrationForm.tsx` 컨테이너). 카테고리 확장처럼 여러 상품을 한 번에 등록하는 시나리오에서 매번 "상품 등록" 메뉴를 다시 눌러 폼을 처음부터 채워야 한다 — 카테고리/서브카테고리 등 직전 값을 유지한 채 "저장하고 계속 등록" 옵션이 있으면 대량 등록 작업이 크게 줄어든다.

---

## 미분류 인박스

> 작업 브랜치는 **이 구역에만 append**한다. 정식 섹션으로의 분류·이동·완료 체크는 `docs/todo-section-taxonomy` 브랜치에서만 한다.
> 항목 형식: `- [ ] (날짜, 발견 맥락) 증상 — 위치/근거`

- [ ] (2026-08-08, TODO 운영 규칙 정립 중 발견) `.git/hooks/commit-msg`의 prefix 검사가 전역 `GIT.md` 택소노미와 어긋남 — 정규식이 `^(feat|fix|docs|refactor|chore|test): ` 라서 ① `docs(agents):` 같은 scope 표기가 거부되고(전역 규칙은 `{prefix}({scope}): {message}`를 허용) ② `perf`/`build`/`ci`/`revert` 4개 prefix가 아예 막힌다. 성능 개선 항목을 커밋하려면 규칙과 훅 중 하나를 반드시 어겨야 하는 상태.
- [ ] (2026-08-08, 위 커밋 진행 중 발견) `node_modules`에 `embla-carousel-wheel-gestures`가 설치돼 있지 않아 pre-commit 훅의 typecheck가 실패, 모든 커밋이 차단됨 — `package.json:46`에는 선언돼 있어 `npm install`로 해소됨(로컬 환경 드리프트). 재발하면 훅이 "설치 누락"과 "타입 에러"를 구분해 안내할 필요 있음.
- [ ] (2026-08-09, src/test 구조 정리 중 발견) `src/shared/CLAUDE.md` 마지막 줄이 존재하지 않는 파일을 참조 — "server/client/shared 3분할 배경: `docs/ARCHITECTURE.md`"인데 그 파일이 레포에 없다. 문서를 쓰거나 참조를 지우거나 둘 중 하나 필요.
- [ ] (2026-08-09, #24 수정 후 드러남) 라우트 그룹 경로 컴포넌트 4개가 line coverage 80% 미달 — `ProductEditDialog.tsx`(57.7%), `UpdatePasswordForm.tsx`(61.1%), `CheckoutForm.tsx`(69.0%), `ProductRegistrationForm.tsx`(admin, 72.7%). #24의 tinyglobby 순회 버그가 이 파일들을 커버리지 집계에서 통째로 빼고 있어 그동안 안 보이던 기존 부채다(신규 회귀 아님). CI가 없고 pre-commit은 `test:coverage:diff`(변경 파일 한정)라 당장 막히진 않으며, 해당 파일을 건드리는 커밋에서 걸린다.
