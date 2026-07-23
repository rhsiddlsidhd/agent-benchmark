# docs/ERROR_HANDLING.md

> Last updated: 2026-07-23

## Overview

이 문서는 레이어를 가로지르는 에러 흐름 전체 그림과 상태 코드 의미를 다룬다. 각 레이어의 구체적인 에러 처리 규칙은 폴더별 `CLAUDE.md`가 이미 정의하고 있으며, 이 문서는 그 규칙을 복붙하지 않고 링크만 한다 — 규칙 원본은 항상 그 레이어의 `CLAUDE.md`다. 글로벌 `~/.claude/docs/ERROR_HANDLING.md`(swallow 금지/catch-all 금지/근본원인 우선)의 프로젝트 적용판이기도 하다 — 그 원칙과 충돌하지 않고, 이 프로젝트의 `HTTPError` 타입으로 구체화한다.

## 에러 흐름

```
services (HTTPError throw / null 리턴)
   ↓
actions (리턴값으로 번역)          route.ts (APIRouteResponse로 응답)
   ↓                                  ↓
                    client
        handleClientError (src/utils/error.ts)
        → fieldErrors / message / void 중 하나로 UI에 전달
```

레이어별 계약 원본:

| 레이어 | 계약 | 정의 위치 |
|---|---|---|
| services | 조회/판별형=null, 확인/인가형=HTTPError throw, 생성/변경형=HTTPError throw | `src/services/CLAUDE.md` |
| actions | 예상 가능한 실패는 throw 아닌 리턴값 | `src/actions/CLAUDE.md` |
| route.ts | `APIRouteResponse` 통일 응답 | `src/app/api/CLAUDE.md`, `src/api/CLAUDE.md` |
| client | status code별 분기 | `src/utils/CLAUDE.md` |

## 상태 코드 의미

실제 코드에서 쓰이는 코드만 다룬다 — 사용 안 하는 코드를 임의로 추가하지 않는다.

| 코드 | 의미 | 비고 |
|---|---|---|
| 400 | 입력값 검증 실패 | zod 검증, 잘못된 파라미터 |
| 401 | 인증 필요/세션 만료 | `requireAuth()`가 던지는 기본 코드 |
| 403 | 인가 실패(로그인은 됐으나 권한 없음) | client(`handleClientError`)는 이미 이 코드를 처리하지만, 지금까지 실제로 던지는 곳이 없었다 — 권한 체크 분기는 이 코드로 통일한다 |
| 404 | 리소스 없음 | 확인형 함수가 대상을 못 찾았을 때 |
| 500 | 서버/DB 처리 실패 | 원인 불명 또는 그 외 |
| 501 | 기능 일시 비활성 | 배포는 됐으나 의도적으로 막아둔 라우트 전용, 남발하지 않는다 |
| 502 | 외부 연동 실패 | 카카오/지하철 등 외부 API 응답 실패 |

## 관련 문서

- 서비스 레이어 에러 처리 계약: `src/services/CLAUDE.md`
- Server Action 에러 처리 계약: `src/actions/CLAUDE.md`
- Route Handler 응답 계약: `src/app/api/CLAUDE.md`, `src/api/CLAUDE.md`
- 클라이언트 에러 분기: `src/utils/CLAUDE.md`
- 테스트 작성 컨벤션: `docs/TESTING_GUIDELINE.md`
- 글로벌 원칙(swallow 금지/catch-all 금지/근본원인 우선): `~/.claude/docs/ERROR_HANDLING.md`
