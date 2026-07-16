# 05. 표준 폼 인터페이스 설계 규칙 (Standard Form Interface)

이 문서는 프로젝트 내 모든 입력 필드(Select, Input, Date 등)의 통일된 설계 표준을 정의합니다. 

## 🏗️ 3단계 계층별 역할 분담

일관된 폼 UI를 위해 모든 필드는 다음 3단계를 거쳐 구성됩니다.

### 1. Atoms (UI Primitives)
- **위치**: `src/components/atoms/**`
- **역할**: 스타일과 기본 거동 제공 (shadcn/ui 라이브러리 기반).
- **예시**: `select.tsx`, `input.tsx`, `label.tsx`.

### 2. Base Molecule (Pure UI Logic)
- **위치**: `src/components/molecules/Base{Type}.tsx`
- **역할**: Atoms를 조합하여 데이터 중심의 순수 UI를 형성합니다.
- **특징**: 
  - 라벨, 에러 메시지 등 외부 레이아웃을 포함하지 않습니다. (재사용성 극대화)
  - 통일된 데이터 포맷(`Record<string, string>[]`)을 옵션으로 받습니다.
- **예시**: `BaseSelect.tsx`.

### 3. Field Organism (Layout & Domain)
- **위치**: `src/components/organisms/fields/{Type}Field.tsx`
- **역할**: `FormField` Molecule로 레이아웃을 잡고, `Base` Molecule로 기능을 채웁니다.
- **특징**: 
  - `label`, `required`, `error` 프롭스를 `FormField`에 위임합니다.
  - 데이터 페칭(SWR)이나 도메인 로직을 처리하여 `Base` Molecule에 주입합니다.
- **예시**: `SelectField.tsx`, `BankAccountField.tsx`.

## 📋 데이터 표준 인터페이스

폼 필드에서 사용하는 모든 옵션 데이터는 **객체 배열(`Record<string, string>[]`)** 형식을 표준으로 합니다.

```typescript
// 표준 데이터 구조 (Source of Truth)
export const OPTIONS: Record<string, string>[] = [
  { value: "key_1", label: "라벨 1" },
  { value: "key_2", label: "라벨 2" },
];
```

## ✅ 아키텍처 준수 가이드

1.  **관심사 분리**: 셀렉트 박스 내부 디자인을 수정하려면 `BaseSelect`를, 전체적인 라벨 배치를 수정하려면 `FormField`를, 특정 도메인 로직을 수정하려면 `Field` Organism을 수정합니다.
2.  **공통 레이아웃**: 모든 필드는 반드시 `FormField` Molecule을 최상단에서 사용하여 디자인 일관성을 유지해야 합니다.
3.  **옵셔널 프롭스**: `error`와 `required`는 기본적으로 옵셔널로 처리하며, `required`의 기본값은 `false`입니다.

---
*마지막 업데이트: 2026년 3월 8일*
