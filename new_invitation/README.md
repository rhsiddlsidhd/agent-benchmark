# 💌 Tie Knot

> 모바일 청첩장 이커머스 플랫폼

원하는 템플릿을 선택하고 커플 정보를 입력해 모바일 청첩장을 제작·공유할 수 있는 풀스택 이커머스 플랫폼

➡️ [배포 링크](https://new-invitation-5dib.vercel.app/) | [GitHub](https://github.com/rhsiddlsidhd/new_invitation)

---

## 📌 프로젝트 개요

| 항목     | 내용                                                                                                                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **기간** | 2025.12 ~ 진행 중                                                                                                                                                                                   |
| **역할** | 풀스택 개발 (기획, 설계, 구현, 배포)                                                                                                                                                                |
| **배경** | 종이 청첩장 대신 모바일에서 바로 확인할 수 있는 디지털 청첩장을 누구나 손쉽게 제작할 수 있는 서비스를 목표로, 템플릿 마켓플레이스·결제·대시보드를 포함한 풀스택 이커머스 플랫폼으로 발전시켰습니다. |

---

## 🛠 Tech Stack

| 분류             | 기술                                                    |
| ---------------- | ------------------------------------------------------- |
| **Frontend**     | TypeScript, React, Next.js, Tailwind CSS, Framer Motion |
| **State / Data** | Zustand, SWR, Zod                                       |
| **Backend / DB** | MongoDB, Mongoose                                       |
| **Storage**      | Cloudinary                                              |
| **Payment**      | PortOne                                                 |
| **Maps**         | Kakao Maps API                                          |
| **CI/CD**        | GitHub Actions, Vercel                                  |

---

## ✨ 주요 기능

- JWT 이중 토큰(Access + Refresh) 기반 인증 및 역할별 접근 제어(USER / ADMIN)
- 커플 정보·예식장·지하철역·갤러리 이미지 등 청첩장 세부 정보 대시보드 관리
- 카카오 맵 API + Daum 우편번호 연동을 통한 예식장 주소·지도 설정
- Cloudinary를 활용한 갤러리·썸네일 이미지 업로드 및 최적화
- PortOne 결제 게이트웨이 연동 및 서버 측 결제 금액·상품 검증 (fraud prevention)
- 프리미엄 옵션·할인(정률/정액) 계산이 포함된 장바구니 → 주문 → 결제 플로우
- 카테고리별 정렬순 템플릿 필터링 마켓플레이스
- 관리자 패널: 상품·프리미엄 기능 CRUD
- GitHub Actions 기반 Claude AI 코드 리뷰 자동화 및 Slack PR 알림 워크플로우

---

## 🏗 Architecture

### 렌더링 전략

페이지 성격에 따라 렌더링 방식을 분리했습니다.

| 페이지           | 전략      | 이유                                                          |
| ---------------- | --------- | ------------------------------------------------------------- |
| 홈, 상품 목록    | Static    | 서버 데이터 불필요, 빌드 시 최적화 자산 활용                  |
| 상품 상세        | SSG       | 상품 데이터는 변경 빈도 낮음                                  |
| 미리보기         | SSG + SSR | 상품 정보는 SSG, 사용자별 청첩장 데이터는 쿼리 파라미터로 SSR |
| 프로필, 대시보드 | SSR       | 사용자별 데이터                                               |

### 상태 관리 전략

전역 상태와 지역 상태를 목적에 따라 분리했습니다.

- **Zustand**: 인증·주문 등 앱 전반에 걸쳐 소비되는 전역 상태 관리
- **Context API**: 특정 View 안에서만 영향을 주고받는 상태는 Zustand로 끌어올리지 않고 Context로 격리 (예: 상품 필터)
  - `createStateContext.tsx` — 제네릭 기반 Context 팩토리로 일관된 패턴 유지
- **SWR**: 서버 상태 캐싱 및 재검증. React Query 대비 API가 단순하고 번들 크기가 작아 이 프로젝트 규모에 적합하며, 복잡한 mutation 관리 등 고급 기능이 불필요했기 때문에 선택

### 컴포넌트 구조

Atomic Design 패턴 적용 — `atoms` → `molecules` → `organisms` 단계별 구성

---

## 🔥 트러블슈팅

### 1. Root Layout 쿠키 확인으로 인한 강제 SSR 전환

**Problem**
Root Layout에서 쿠키 존재 여부를 확인함에 따라, 정적으로 생성되어야 할 페이지들이 강제로 SSR로 전환되는 구조적 결함을 발견했습니다. 모든 요청이 서버의 런타임 연산을 거치면서 응답 경로가 길어지는 성능 병목이 발생했습니다.

**Solution**
레이아웃에서 수행하던 쿠키 기반 리다이렉트 로직을 Middleware로 이관하여 SSR 의존성을 제거했습니다. 클라이언트 단에서 쿠키 확인이 필요한 동적 컴포넌트는 별도 API 호출 방식으로 전환하고, `useSearchParams`를 사용하는 컴포넌트는 `Suspense`로 감싸 Dynamic 환경이 상위로 전파되는 것을 억제했습니다.

**Impact**
책임을 미들웨어와 클라이언트 컴포넌트로 분리하여 구조적 무결성을 확보했습니다. Static 페이지 생성을 보존함으로써 빌드 시 미리 생성된 최적화 자산을 즉각 제공해 TTFB를 개선하고 서버 부하를 최소화했습니다.

---

### 2. Server Action 1MB 제한으로 인한 이미지 업로드 실패

**Problem**
초기 설계는 Next.js API 서버에서 `fs` 모듈로 로컬에 이미지를 저장하는 방식이었으나, Server Action의 `bodySizeLimit` 1MB 제한에 걸리는 에러가 발생했습니다.

**Solution**
서버를 거치지 않고 클라이언트에서 직접 Cloudinary로 업로드하는 방식으로 변경했습니다. 클라이언트는 Cloudinary로부터 받은 이미지 URL을 서버 API에 전달하고, 서버는 해당 문자열만 DB에 저장하도록 구조를 수정했습니다.

**Impact**
서버 1MB 제한 문제를 근본적으로 해결하고, 대용량 바이너리 처리를 외부 인프라로 위임하여 서버 부하를 줄였습니다. Cloudinary CDN을 통해 이미지 서빙 속도(TTFB)를 개선하고, `CloudImage` 커스텀 컴포넌트에서 브라우저 환경에 맞는 최적화 포맷·리사이징을 서빙하여 LCP 성능을 향상시켰습니다.

---

### 3. 배포 환경 Hydration 오류 (Timezone 불일치)

**Problem**
배포 환경에서 preview 페이지에 React #418 hydration 오류가 발생했습니다. `WeddingMonthCalendar` 컴포넌트에서 `date-fns`의 `format()`으로 날짜를 포맷할 때, 서버(Vercel, UTC)와 클라이언트(브라우저, KST) 간 timezone이 달라 렌더링 결과가 불일치했으며, 로컬 환경에서는 재현되지 않아 원인 파악이 어려웠습니다.

**Solution**
`date-fns-tz`의 `formatInTimeZone()`을 도입해 서버와 클라이언트 모두 `Asia/Seoul` timezone으로 고정하여 포맷하도록 수정했습니다. MongoDB는 내부적으로 항상 UTC로 저장하기 때문에 저장 방식 변경으로는 해결이 불가능하며, 포맷 시점에 timezone을 명시적으로 고정하는 것이 근본적인 해결책임을 확인했습니다.

**Impact**
배포 환경에서 발생하던 hydration 오류가 제거되었고, 서버에서 생성한 HTML과 클라이언트 렌더링 결과가 일치하여 SSR/ISR 환경에서 안정적인 렌더링이 보장되었습니다.

---

## 📁 Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── (main)/           # 메인 페이지, 상품
│   ├── (auth)/           # 인증 (로그인, 회원가입)
│   ├── (checkout)/       # 결제 플로우
│   ├── (admin)/          # 어드민 대시보드
│   └── (preview)/        # 청첩장 미리보기
├── actions/              # Server Actions
├── components/
│   ├── atoms/            # 기본 UI 요소
│   ├── molecules/        # 복합 UI 컴포넌트
│   └── organisms/        # 페이지 블록 단위 컴포넌트
├── context/              # 지역 상태 관리 (Context API)
├── hooks/                # Custom React Hooks
├── models/               # Mongoose 스키마
├── services/             # API / 비즈니스 로직
├── store/                # Zustand 전역 상태
└── utils/                # 유틸 함수, validation
```

---
