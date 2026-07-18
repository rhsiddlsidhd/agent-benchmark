# 02. 개발 컨벤션 및 규칙 (Development Conventions)

이 문서는 프로젝트 내에서 코드를 작성할 때 준수해야 하는 핵심 기술 규칙을 정의합니다.

## 1. Next.js App Router 규칙

### 클라이언트 컴포넌트 지시어 (`'use client'`)
- **규칙**: `useState`, `useEffect`, `useContext` 등 React Hooks를 사용하거나, 브라우저 API(window, document 등)를 직접 사용하는 파일은 **반드시** 파일 최상단에 `'use client';` 지시어를 명시해야 합니다.
- **예외**: 순수 로직 함수나 서버 컴포넌트는 제외합니다.

## 2. 임포트(Import) 및 경로 규칙

### 절대 경로 별칭 (Path Alias)
- **규칙**: 모든 내부 모듈 임포트는 `@/` 접두사를 사용한 절대 경로를 권장합니다.
- **예시**: `import { Button } from "@/components/atoms/button";`
- **사유**: 폴더 구조 변경 시 유지보수가 용이하며, 컴포넌트 간의 의존성을 명확히 파악할 수 있습니다. 특히 `src/components/atoms/` 내부 파일 간에도 상대 경로(`./`) 대신 절대 경로를 사용하도록 합니다.

## 3. 컴포넌트 설계 및 스타일링

### Atomic Design 원칙
- 컴포넌트는 `atoms`, `molecules`, `organisms`, `layout`으로 계층화하여 관리합니다.
- 각 계층의 정의는 `01_component_architecture.md`를 참조하십시오.

### Tailwind CSS 및 Framer-motion
- **스타일링**: Tailwind CSS를 기본으로 사용하며, 복잡한 조건부 클래스는 `cn()` 유틸리티 함수를 활용합니다.
- **애니메이션**: 인터랙티브한 요소에는 `framer-motion`을 적극 활용하여 사용자 경험을 개선합니다.

## 4. 데이터 관리 및 상태 (SSOT)
- 동일한 데이터가 여러 곳에서 파생될 경우, 가능한 가장 상위 공통 부모에서 상태를 관리하거나 Context API/Zustand를 활용하여 데이터 불일치를 방지합니다.
- **데이터 분리**: 대량의 정적 데이터(배너 정보, 탭 목록 등)는 컴포넌트 내부에서 정의하지 않고 `src/data/` 폴더 내의 `.json` 파일로 관리합니다.
- **아이콘 매핑**: JSON 데이터에서 아이콘을 사용할 경우 아이콘 컴포넌트를 직접 저장할 수 없으므로, 아이콘 이름을 문자열로 저장하고 컴포넌트 내에서 `ICON_MAP` 객체를 통해 매핑하여 사용합니다.
