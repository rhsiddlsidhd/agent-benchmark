# 01. 컴포넌트 아키텍처 리팩토링 규칙 (SSOT)

이 문서는 프로젝트의 모든 컴포넌트 설계 및 배치에 대한 **최우선 순위 규칙**을 정의합니다. 모든 AI 스킬 및 개발자는 이 규칙을 반드시 준수해야 합니다.

## 🏗️ Atomic Design 패턴의 엄격한 재정의

본 프로젝트는 다음과 같은 구조로 컴포넌트를 리팩토링합니다.

### 1. Atoms (`src/components/atoms/**`)
- **구조**: **완전한 Flat 구조 (하위 폴더 금지)**. 모든 컴포넌트는 `atoms/` 바로 아래 위치합니다.
- **제약**: 오직 **npx shadcn-ui (또는 Radix UI 기반)** 컴포넌트만 이 위치에 올 수 있습니다.
- **파일명**: 라이브러리 표준을 따라 **소문자/케밥 케이스**를 유지합니다. (예: `button.tsx`, `select.tsx`)
- **특징**: 비즈니스 로직이 없으며, 테마와 스타일(Tailwind, CVA) 확장에만 집중합니다.

### 2. Molecules (`src/components/molecules/**`)
- **정의**: **2개 이상의 Atoms를 조합**하여 만든 순수 UI 기능 단위.
- **파일명**: **파스칼 케이스(PascalCase)**를 사용합니다. (예: `Alert.tsx`, `BaseSelect.tsx`, `FormField.tsx`)
- **제약**: 
  - 특정 도메인 로직이나 데이터 페칭에 의존하지 않는 **순수 함수형 UI**여야 합니다.
  - 라벨, 에러 메시지 등 외부 레이아웃 요소와 분리된 **독립적 기능 조각**입니다.

### 3. Organisms (`src/components/organisms/**`)
- **정의**: Atoms, Molecules를 조합하여 만든 도메인 결합적 섹션 또는 완성된 폼 필드.
- **파일명**: **파스칼 케이스(PascalCase)**를 사용합니다.
- **특징**: 
  - **Fields (`src/components/organisms/fields/**`)**: `FormField` 레이아웃과 `Base` Molecule을 결합한 완성된 입력 필드군.
  - 데이터 페칭(SWR), Server Actions 호출, 또는 복잡한 도메인 로직이 포함될 수 있습니다.

## 📁 디렉토리별 역할 요약

- **`src/app`**: Next.js App Router 경로.
- **`src/actions`**: Server Actions (서버 측 로직 및 DB 처리).
- **`src/services`**: 비즈니스 로직 및 데이터 접근 계층 추상화.
- **`src/models`**: MongoDB 데이터 모델 정의.
- **`src/schemas`**: Zod 데이터 검증 스키마.
- **`src/store`**: Zustand 전역 상태 관리.

---
*마지막 업데이트: 2026년 3월 8일*
