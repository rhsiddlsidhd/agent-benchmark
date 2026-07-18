# CLAUDE.md — src/actions/

> Last updated: 2026-07-18

## Scope

- **Server Actions(`"use server"`) — 폼 제출 등 클라이언트에서 트리거하는 데이터 변경(CUD).** 고정 절차: `validateAndFlatten(schema, data)`(`src/lib/validation/CLAUDE.md`)로 zod 검증 → `src/services/`/`src/lib/` 호출 → `src/api/response.ts`의 `success()`로 감싸 반환, 실패 시 `src/api/error.ts`의 `handleActionError()`로 위임.

## Structure

```
src/actions/
├── loginUser.ts             # Action 접미사 없음(Gotchas 참고)
├── createOrderAction.ts        # Action 접미사 있음(다수 패턴)
└── ...                           # 도메인 동작당 파일 1개
```

## Critical Convention

- 파일 최상단에 `"use server"`를 명시한다.
- 파일명은 `{동사}{Entity}Action.ts`로 짓는다(다수 패턴, Gotchas 참고).
- 함수 시그니처는 `(_prev, formData: FormData) => Promise<APIResponse<T>>` 형태로 고정한다(`useActionState`와 짝) — 검증 실패/비즈니스 로직 실패 모두 throw 후 최상위 `catch`에서 `handleActionError(e)`로 처리한다, 개별적으로 에러 shape을 직접 만들지 않는다.

## Gotchas

- 파일명 네이밍 불일치: `createCoupleInfoAction`/`updateProductStatusAction`/`createProductAction`/`createPremiumFeatureAction`/`deleteProductAction`/`updateProductAction`/`createOrderAction`/`updatePremiumFeatureAction`/`updateCoupleInfoAction`/`deleteGuestBookAction`(10개, `Action` 접미사 있음) vs `loginUser`/`signupUser`/`findUserEmail`/`createGuestbook`/`requestPasswordReset`/`updateUserPassword`(6개, 없음). 다수 패턴(`Action` 접미사)이 새 파일의 기준 — 코드 리팩토링은 추후 진행 예정.

## 관련 문서

- 응답/에러 계약: `src/api/CLAUDE.md`
- 검증 스키마: `src/schemas/CLAUDE.md`
- 호출 대상 비즈니스 로직: `src/services/CLAUDE.md`
