# CLAUDE.md — src/app/api/

> Last updated: 2026-07-18

## Scope

- **Next.js Route Handler(`route.ts`).** 외부/내부 요청을 받아 검증 → `src/services/`(DB 접근) 또는 `src/lib/`(외부 연동) 호출 → `src/api/response.ts`/`src/api/error.ts`로 응답 매핑만 담당한다. 도메인 UI는 다루지 않는다.

## Structure

```
src/app/api/
├── products/route.ts        # GET — apiSuccess/handleRouteError 사용
├── auth/refresh/route.ts       # POST — 쿠키+토큰 갱신, 실패 시 쿠키 삭제 후 handleRouteError
└── upload/signature/route.ts     # 공용 계약 미사용(Gotchas 참고)
```

## Critical Convention

- 파라미터 검증(파싱 실패/필수값 누락)을 외부 API 호출 이전에 끝낸다 — 실패 시 외부 API를 호출하지 않은 채 바로 에러 반환한다.
- 응답은 반드시 `src/api/response.ts`의 `apiSuccess()`(성공)와 `src/api/error.ts`의 `handleRouteError()`(실패)를 거친다 — `NextResponse.json(...)`을 직접 만들지 않는다(Gotchas — 이미 어긴 사례 있음).
- `catch`에서 타입 가드 없이 모든 에러를 동일 취급하지 않는다 — `HTTPError`는 그 안의 상태코드로 매핑하고, 그 외 예상 못한 에러는 그대로 500 처리에 위임한다(`handleRouteError`가 이미 이 로직을 담당).

## Gotchas

- `upload/signature/route.ts` — `src/api/response.ts`/`error.ts`를 전혀 안 쓰고 `NextResponse.json({ error: string }, { status })`를 직접 만든다. 에러 shape도 다른 라우트(`{ success: false, error: { message, code } }`)와 달리 `{ error: string }`뿐이라 클라이언트 쪽 공용 에러 처리(`handleClientError`)와 안 맞을 수 있다 — 공용 계약으로 맞추는 리팩토링 대상(추후 진행 예정).

## 관련 문서

- 응답/에러 계약: `src/api/CLAUDE.md`
- 호출 대상 비즈니스 로직: `src/services/CLAUDE.md`
- 호출 대상 외부 연동: `src/lib/CLAUDE.md`
