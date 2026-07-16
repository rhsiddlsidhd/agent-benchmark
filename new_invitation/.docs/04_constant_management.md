# 04. 상수 관리 및 타입 안전성 (Constant Management)

이 문서는 프로젝트 내에서 상수를 정의하고 관리하는 표준 패턴을 정의합니다. 특히 UI 선택지(필터, 옵션 등)와 타입을 동기화하여 타입 안전성(Type Safety)을 극대화하는 것을 목표로 합니다.

## 🏗️ 핵심 원칙: Array as Source of Truth

객체의 키를 추출하여 타입을 만드는 방식 대신, **배열을 먼저 정의**하고 이를 바탕으로 타입과 매핑 객체를 파생시키는 패턴을 권장합니다.

### 1. 설계 단계 (3-Step Pattern)

상수를 정의할 때는 반드시 다음 3단계를 거칩니다.

1.  **Keys 배열 정의**: `as const`를 사용하여 읽기 전용 리터럴 배열을 만듭니다. (UI 노출 순서 결정)
2.  **Union 타입 추출**: 배열의 요소로부터 타입을 자동으로 추출합니다.
3.  **Mapping 객체 생성**: `Record<Type, Value>`를 사용하여 각 키에 대응하는 라벨이나 설정을 정의합니다.

### 2. 구현 예시

```typescript
// src/constants/example.ts

// 1. Keys 배열 정의 (순서 보장)
export const FILTER_KEYS = ["ALL", "ACTIVE", "COMPLETED"] as const;

// 2. Union 타입 추출
export type FilterType = (typeof FILTER_KEYS)[number];

// 3. Mapping 객체 생성 (Record를 사용하여 누락 방지)
export const FILTER_LABELS: Record<FilterType, string> = {
  ALL: "전체",
  ACTIVE: "진행 중",
  COMPLETED: "완료",
};
```

## ✅ 이 패턴의 장점

1.  **순서 보장 (Order Preservation)**: `Object.keys()`는 객체의 속성 순서를 보장하지 않지만, 배열은 정의된 순서대로 UI를 렌더링할 수 있습니다.
2.  **타입 단언 제거 (No 'as' Assertions)**: `Object.keys(OBJ) as Type[]`와 같은 불안전한 타입 단언 없이도 정확한 타입을 추론할 수 있습니다.
3.  **컴파일 타임 체크**: `Record<Type, string>`을 사용하면 배열에 새 키를 추가했을 때, 라벨 객체에도 해당 키를 추가하지 않으면 에러가 발생하여 누락을 방지합니다.
4.  **유지보수 용이성**: 상수가 추가될 때 배열에만 추가하면 타입 시스템이 필요한 모든 곳(Reducer, UI 등)에 변경 사항을 전파합니다.

## 📋 권장 사용처

-   **필터 및 정렬 옵션**: 상품 목록의 정렬 기준, 가격대 등.
-   **탭 메뉴**: 페이지 상단의 내비게이션 탭.
-   **상태 값**: 주문 상태(대기, 완료, 취소) 등 고정된 선택지.

---

_마지막 업데이트: 2025년 3월 7일_
