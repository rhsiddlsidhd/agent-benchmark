# PRD (Product Requirements Document)

> 상태: Draft
> 작성자:
> 작성일:
> 최종 수정일:
> 관련 문서: [01_ARCHITECTURE.md](./01_ARCHITECTURE.md) · [03_DESIGN.md](./03_DESIGN.md)

> **주의**: 페르소나/유저스토리 원본 문서는 이 문서(00_PRD). [03_DESIGN.md](./03_DESIGN.md)는 이 문서를 참조만 하며, 별도로 재작성하지 않는다.

---

## 필드 가이드

| 섹션 | 내용 |
|------|------|
| 배경 | 이 프로젝트/기능이 왜 필요한가, 현재 어떤 문제가 있는가 |
| 목표 | 무엇을 달성하려 하는가 (측정 가능하게), Non-Goals: 명시적으로 제외하는 것 |
| 대상 사용자 | 누가 사용하는가, 사용자 페르소나/시나리오 |
| 요구사항 | 기능(FR) / 비기능(NFR) 요구사항, 우선순위 |
| 사용자 스토리 | As a [사용자], I want [기능], so that [목적] |
| 성공 지표 | KPI / 측정 방법 |
| 제약사항 | 기술적, 일정, 리소스 제약 |
| 오픈 이슈 | 미결정 사항 |

---

## 1. 배경 (Background)

**Tie Knot** — 모바일 청첩장 이커머스 플랫폼.

종이 청첩장 대신 모바일에서 바로 확인할 수 있는 디지털 청첩장을, 누구나 손쉽게 제작할 수 있는 서비스가 필요했다. 단순 템플릿 제공을 넘어 템플릿 마켓플레이스·결제·대시보드를 포함한 풀스택 이커머스 플랫폼으로 발전시켰다. (출처: README.md 프로젝트 개요)

## 2. 목표 (Goals)

- 원하는 템플릿을 선택하고 커플 정보를 입력해 모바일 청첩장을 제작·공유할 수 있게 한다.
- 템플릿을 상품으로 판매하는 마켓플레이스 + 결제(PortOne) 플로우를 제공한다.
- 커플이 청첩장 세부 정보(예식장, 갤러리, 방명록 등)를 대시보드에서 직접 관리할 수 있게 한다.
- 관리자가 상품·프리미엄 기능을 CRUD 할 수 있는 어드민 패널을 제공한다.

**Non-Goals**
- (TODO: 명시적으로 범위 밖으로 정한 항목 — 원본 자료에 기재 없음)

## 3. 대상 사용자 (Target Users)

| 유형 | 설명 | 근거 |
|------|------|------|
| 커플(신랑/신부) | 템플릿 구매 후 청첩장 정보를 입력·관리하는 주 사용자. USER 역할 | `src/models/user.model.ts` (role: USER/ADMIN), `src/models/coupleInfo.model.ts` |
| 하객 | `/preview/[id]` 링크로 청첩장을 열람하고 방명록을 남기는 비로그인 사용자 | `src/models/guestbook.model.ts`, `src/app/(preview)` |
| 관리자(ADMIN) | 상품/프리미엄 기능 CRUD, 주문 현황 관리 | `src/app/(main)/(admin)`, `src/actions/updateProductAction.ts` 등 |

(TODO: 구체적 페르소나 시나리오는 원본 자료에 없어 추가 작성 필요)

## 4. 요구사항 (Requirements)

### 4.1 기능 요구사항 (Functional)

| ID | 요구사항 | 우선순위 | 비고 |
|----|----------|----------|------|
| FR-1 | JWT 이중 토큰(Access + Refresh) 기반 인증 및 역할별(USER/ADMIN) 접근 제어 | High | 미들웨어 기반 권한 체크 |
| FR-2 | 카테고리별 정렬순 템플릿 필터링 마켓플레이스 | High | 상품 목록/상세 |
| FR-3 | 커플 정보·예식장·지하철역·갤러리 이미지 등 청첩장 세부 정보 대시보드 관리 | High | `src/actions/createCoupleInfoAction.ts` 등 |
| FR-4 | 카카오맵 API + Daum 우편번호 연동 예식장 주소·지도 설정 | Medium | `src/app/api/kakaomap`, `src/app/api/subway` |
| FR-5 | Cloudinary 기반 갤러리·썸네일 이미지 업로드/최적화 | High | 클라이언트 직접 업로드([02_ADR.md](./02_ADR.md) ADR-0002) |
| FR-6 | PortOne 결제 게이트웨이 연동 + 서버 측 결제 금액/상품 검증(fraud prevention) | High | `src/services/payment.service.ts` |
| FR-7 | 프리미엄 옵션·할인(정률/정액) 계산 포함 장바구니 → 주문 → 결제 플로우 | High | `src/models/order.model.ts`, `src/models/product.feature.model.ts` |
| FR-8 | 방명록 작성/비공개 옵션/비밀번호 기반 수정·삭제 | Medium | `src/models/guestbook.model.ts` |
| FR-9 | 관리자 패널: 상품·프리미엄 기능 CRUD | Medium | `src/app/(main)/(admin)` |
| FR-10 | GitHub Actions 기반 Claude AI 코드 리뷰 자동화 및 Slack PR 알림 | Low | 제품 기능이 아닌 개발 프로세스 |

### 4.2 비기능 요구사항 (Non-Functional)

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-1 | 결제 위변조 방지 | 결제 금액/상품 정보를 서버(Server Action/API)에서 재검증, 클라이언트 값 신뢰 안 함 |
| NFR-2 | 정적 페이지 TTFB 최소화 | 홈/상품 목록은 Static, 상품 상세는 SSG (`01_ARCHITECTURE.md` 렌더링 전략) |
| NFR-3 | SSR/ISR 환경에서 서버-클라이언트 렌더링 결과 일치 | 날짜 포맷 timezone 고정(`formatInTimeZone`, [02_ADR.md](./02_ADR.md) ADR-0003) |
| NFR-4 | 대용량 이미지 업로드가 서버 요청 크기 제한에 걸리지 않아야 함 | Cloudinary 클라이언트 직접 업로드([02_ADR.md](./02_ADR.md) ADR-0002) |

## 5. 사용자 스토리 / 유스케이스

### 5.1 As-a 요약

- As a 커플, I want 템플릿을 골라 결제하고 내 정보를 입력, so that 모바일 청첩장을 손쉽게 만들어 공유할 수 있다.
- As a 커플, I want 대시보드에서 예식장 주소·지도·갤러리·방명록 설정을 관리, so that 배포 후에도 청첩장 내용을 계속 수정할 수 있다.
- As a 하객, I want 공유받은 링크에서 청첩장을 보고 방명록을 남기, so that 축하 메시지를 전달할 수 있다.
- As a 관리자, I want 상품과 프리미엄 기능을 CRUD, so that 마켓플레이스에 새 템플릿/옵션을 등록·운영할 수 있다.

### 5.2 UC-1: 커플 — 템플릿 구매 (핵심 플로우)

시퀀스 상세는 [01_ARCHITECTURE.md §4.1](./01_ARCHITECTURE.md#41-핵심-유스케이스-시퀀스)을 참고. 단계 요약:

1. `/products` 마켓플레이스에서 템플릿 탐색 → `/products/[id]` 상세에서 프리미엄 옵션 선택 → "구매하기"
2. **로그인 게이트**: 미로그인 상태면 `/couple-info` 진입 시 미들웨어가 `/`로 리다이렉트(별도 안내 없음 — [8. 오픈 이슈] 참고). 로그인/회원가입 완료 후 다시 상품 선택부터 재시작해야 함.
3. `/couple-info`에서 커플·부모 정보, 예식장 주소(카카오맵/Daum 우편번호), 갤러리·썸네일 이미지(Cloudinary) 입력 → 저장 시 CoupleInfo 레코드 생성
4. `/payment?q={coupleInfoId}`에서 구매자 정보·결제수단 선택·약관 동의 → 제출 시 Order(PENDING) 생성 → PortOne 결제창 진행
5. 결제수단별 분기:
   - **카드/실시간계좌이체**: PortOne 팝업에서 즉시 완료 → 서버가 결제 재검증 후 Order를 CONFIRMED로 전환
   - **가상계좌**: 계좌 발급만 되고 실제 입금은 이후에 이뤄짐(비동기) — 발급 직후 상태는 결제완료 아님
6. 완료 시 `/payment/success`로 이동, 이후 `/order`에서 내역 확인, `/order/edit`에서 청첩장 정보 무제한 재수정 가능

### 5.3 UC-2: 하객 — 청첩장 열람 및 방명록

1. 커플이 공유한 `/preview/[coupleInfoId]` 링크 접속(로그인 불필요)
2. Hero·인사말·캘린더·갤러리·오시는길·계좌정보 열람(구매한 상품의 프리미엄 옵션에 따라 테마/기능 달라짐)
3. 방명록 섹션에서 이름·메시지 작성, 비공개 여부 선택, 수정/삭제용 비밀번호 설정 후 등록

### 5.4 UC-3: 관리자 — 상품/기능 운영

1. `/admin` 진입(ADMIN 역할만, 미들웨어가 REFRESH 토큰의 role 검사)
2. `products`/`premium-features`에서 템플릿·프리미엄 옵션 CRUD, `orders`에서 주문 현황 확인, `users`에서 유저 관리

## 6. 성공 지표 (Success Metrics)

(TODO: 원본 자료에 정량 KPI 정의 없음 — 배포 링크는 있으나 트래픽/전환 지표 미기재)

## 7. 제약사항 (Constraints)

- 결제는 PortOne(구 아임포트) 게이트웨이에 고정.
- Next.js Server Action은 요청 바디 1MB 제한 — 이미지 등 대용량 바이너리는 Server Action 경유 불가 ([02_ADR.md](./02_ADR.md) ADR-0002).
- 배포 환경은 Vercel(서버 UTC) — 클라이언트(KST)와 timezone 불일치 이슈 상존, 포맷 시점에 명시적 고정 필요 ([02_ADR.md](./02_ADR.md) ADR-0003).
- DB는 MongoDB(Mongoose)로 고정, ORM 교체 계획 없음.

## 8. 오픈 이슈 (Open Questions)

- 상품 목록 필터링은 현재 카테고리 전체 데이터를 클라이언트 메모리에 올려 In-Memory Filtering 방식으로 처리 중. 데이터량 증가 시 무한 스크롤 + 서버 사이드 필터링으로 전환 예정(`.docs/03_rendering_strategy.md` 확장성 계획, 미착수).
- **가상계좌 결제 상태 오판**: `src/hooks/usePortOnePayment.ts`가 `/api/payment/complete` 응답이 `PAID`가 아니면 무조건 실패로 처리함. 가상계좌는 발급 직후 상태가 `PENDING`인 게 정상이라, 정상 발급도 결제 실패로 노출됨 — 결제수단별 분기 필요.
- **결제 확정 경로가 클라이언트 호출 1개뿐**: PortOne 웹훅 등 서버-서버 보정 경로가 없어(라우트 조사 결과 부재), 팝업 결제 성공 직후 클라이언트가 `/api/payment/complete` 호출 전에 이탈(탭 종료/네트워크 끊김)하면 실제로는 결제됐는데 Order가 영구히 PENDING으로 남음.
- **결제 페이지 새로고침 시 중복 Order 생성 가능**: `createOrderAction`에 멱등성/중복 방지가 없어, 같은 coupleInfoId로 여러 Order가 생성될 수 있음.
- **결제 미완료 CoupleInfo 고아 데이터**: CoupleInfo가 Order보다 먼저 생성되는 구조라, 결제 단계에서 이탈하면 미사용 CoupleInfo(+업로드된 이미지)가 정리되지 않고 남음.
- (TODO: 그 외 미결정 사항은 원본 자료에서 확인되지 않음)

## 9. 참고자료 (References)

- [README.md](../README.md)
- [GEMINI.md](../GEMINI.md)
- `.docs/01_component_architecture.md`, `.docs/02_development_conventions.md`, `.docs/03_rendering_strategy.md`, `.docs/04_constant_management.md`, `.docs/05_form_interface_standard.md`
