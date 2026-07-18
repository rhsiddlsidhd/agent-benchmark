# GEMINI Project Overview

이 문서는 Gemini CLI가 프로젝트의 기술 스택과 규칙을 파악하기 위한 핵심 설정 파일입니다.
**여기에 기술된 규칙은 모든 AI 스킬의 기본 가이드보다 우선순위가 높습니다.**

## 🔍 프로젝트 핵심 규칙 및 컨벤션

이 프로젝트의 모든 폴더 구조와 네이밍 규칙은 `.docs/` 및 `docs/` 폴더 내에 표준화되어 있습니다.

- **컴포넌트 설계 규칙 (Atomic SSOT)**: [01. 컴포넌트 아키텍처 규칙](./.docs/01_component_architecture.md)
- **개발 컨벤션**: [02. 개발 컨벤션](./.docs/02_development_conventions.md)

### 📌 핵심 명령어 및 가이드

| 명령어 | 관련 문서 | 비고 |
| :--- | :--- | :--- |
| `커밋해줘` | [`./docs/COMMIT_TEMPLATE.md`](./docs/COMMIT_TEMPLATE.md) | 커밋 메시지 작성 규칙 |
| `PR해줘` | [`./docs/PULL_REQUEST_TEMPLATE.md`](./docs/PULL_REQUEST_TEMPLATE.md) | PR 본문 작성 규칙 |
| `아키텍처적용해줘` | [`./docs/public/structure-convention.md`](./docs/public/structure-convention.md) | 폴더 구조 및 컨벤션 |
| `에러핸들러적용해줘` | [`./docs/ERROR_HANDLER.md`](./docs/ERROR_HANDLER.md) | 에러 처리 로직 가이드 |

---

### 1. 환경 및 기술 스택 (Core & Stack)

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Animation**: Framer-motion
- **Database**: MongoDB (Mongoose)

### 2. 상태 관리 규약 (State Management)

> **원칙**: 로컬 → Context API → Zustand 순으로 상태 범위를 확장한다.

- **useSWR**: 서버 상태(Server State) 관리, 캐싱, 중복 호출 방지.
- **Zustand**: 전역 공통 상태, 페이지 간 유지되는 상태, 복잡한 클라이언트 비즈니스 로직.
- **Context API**: 특정 도메인(UI, 필터 등)에 한정된 컴포넌트 트리 내 상태 공유.

### 3. 구조 및 경로 (Structure & Path)

- **Component Root**: `src/components`
- **Server Actions**: `src/actions/` (반드시 `"use server"` 포함)
- **Business Logic**: `src/services/` (DB 접근 및 로직 처리)
- **Validation**: `src/schemas/` (zod 스키마 정의 및 공유)
- **Models**: `src/models/` (Mongoose 모델 정의, `.lean()` 적극 활용)

### 4. 에러 및 로딩 처리 (Error & Loading)

- **Loading**: Next.js `loading.tsx` 및 shadcn/ui Skeleton 활용.
- **Error**: 비즈니스/시스템 에러 구분, 유저 피드백은 `sonner` (Toast) 우선 사용.
