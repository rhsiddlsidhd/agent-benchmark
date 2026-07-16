---
name: frontend-impl
description: 프론트엔드 UI 구현. `type → hooks → UI` 절차 고정. "프론트엔드 구현", "UI 컴포넌트 작성", "API 훅 작성", "차트 구현" 등 요청 시 트리거. 계약 타입을 새로 정의하는 작업엔 사용 금지(백엔드가 정의한 타입 import만).
---

# frontend-impl

frontend agent가 `src/` 경로에서 사용하는 구현 절차.

## Input
- `target`: 구현 대상 도메인 식별자 (필수)
- `type_source`: 참조할 계약 타입 위치(백엔드 impl 산출물) — 계약 타입을 다루는 작업이면 오케스트레이터가 스폰 시 명시 전달(이 스킬은 프로젝트 컨벤션을 알지 못한다). 순수 스타일링 등 계약 타입과 무관한 작업이면 생략 가능 — 이 경우 아래 1단계는 skip

## 절차 (불변)

1. **type import**(`type_source` 있을 때만, 없으면 skip) — `type_source`에서 타입 그대로 가져다 씀, 새로 정의/재선언 금지
2. **hooks 작성**(API 훅 필요한 작업만 해당, 없으면 skip) — API 훅 레이어, fetch 경계에서 런타임 검증(예: zod) 적용(시스템 경계라 validate 필요)
3. **UI 작성** — 훅 반환타입 그대로 사용, 컴포넌트 내부에서 타입 재해석/`any` 캐스팅 금지

## 금지
- 계약 타입 새로 정의(백엔드 타입과 별도로 프론트에서 재정의)
- fetch 경계에서 런타임 검증 생략
- 외부 서비스(DB/외부API 등) 직접 호출 — 항상 same-origin `/api/*` 경유
