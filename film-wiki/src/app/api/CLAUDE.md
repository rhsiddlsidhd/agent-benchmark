# src/app/api

> Last updated: 2026-07-08

Next.js Route Handler(`route.ts`) 전용 규칙. 외부 API 프록시 경계 — 검증 + 외부 API 클라이언트(`src/lib/{서비스}/client.ts`) 호출 + 응답/에러 매핑만 담당하고, 도메인 UI·재시도 정책은 여기서 다루지 않는다.

## Structure
```
src/app/api/discover/
├── route.ts               # HTTP 메서드 export(GET 등) — 검증→호출→매핑만
└── _types/                 # 이 Route Handler의 요청/응답 계약 타입
    ├── index.ts
    ├── DiscoverResponse.ts
    └── DiscoverErrorResponse.ts
```
파일명 케이스는 Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`를 따른다. `_types/`는 `src/app/CLAUDE.md`의 배럴(`index.ts`) + 파일당 export 1개 규칙을 그대로 따른다.

## Critical Conventions
- 파라미터 검증(파싱 실패/필수값 누락)을 외부 API 호출 이후에 하지 않는다 — 호출 전에 끝내고 실패 시 외부 API를 호출하지 않은 채 400을 바로 반환한다(불필요한 외부 호출·요청 한도 소모 방지).
- `try`/`catch`로 검증 코드까지 감싸지 않는다 — `try` 블록은 외부 API 호출(및 그 결과 가공)만 감싼다.
- `catch`에서 타입 가드 없이 모든 에러를 동일하게 처리하지 않는다 — 외부 API 클라이언트 전용 에러 타입(상태코드를 담은 커스텀 에러)은 좁혀서 상태코드 기반으로 매핑하고, 그 외 예상 못한 에러는 삼키지 않고 그대로 재던져 Next 기본 500 처리에 위임한다.
- 외부 API 클라이언트 에러의 상태코드를 검증 없이 그대로 HTTP 상태로 쓰지 않는다 — 400~599 범위의 유효한 HTTP 상태만 패스스루하고, 그 범위를 벗어나는 값(네트워크/타임아웃 등 응답 이전 실패)은 502로 매핑한다.
- 에러 응답 바디를 `{ error: string }` 이외의 형태로 만들지 않는다 — 모든 Route Handler가 동일 shape을 반환해 훅의 에러 처리를 통일한다.
- 재시도 로직을 Route Handler 안에 넣지 않는다 — 재시도 정책(TanStack Query `retry: 1`)은 훅(클라이언트) 책임이다(외부 API rate limit 악화 방지).
- 외부 API 키/토큰/시크릿을 Route Handler에서 직접 다루지 않는다 — `server-only`인 전용 클라이언트 모듈(`src/lib/{서비스}/client.ts`) 경유로만 접근한다.
- 이 Route Handler의 요청/응답 계약 타입(성공 응답·에러 응답)을 `route.ts`에 인라인으로 쌓지 않는다 — `_types/`로 분리한다. 같은 계약을 쓰는 페이지 라우트의 훅(`src/app/{route}/_hooks/`)은 이 `_types/`를 직접 import한다 — Route Handler가 계약을 소유하고 훅이 소비하는 방향을 유지한다(반대 방향 import 금지).
- Next 16 동적 세그먼트의 `params`를 동기값처럼 다루지 않는다 — `Promise`이므로 `await params`로 풀어 쓴다.
- 사용하지 않는 핸들러 인자(`request` 등)를 원래 이름 그대로 남겨두지 않는다 — `_` 접두사로 명시한다(`_request`).

## Gotchas
- 캐싱 정책(revalidate vs no-store)은 Route Handler가 아니라 `src/lib/{서비스}/client.ts`의 호출 함수가 결정한다 — 여기서 캐시 옵션을 재정의하지 않는다.
- 404 패스스루 대상 여부는 라우트마다 다르다 — 시즌/상세처럼 특정 리소스 조회는 404가 정상 실패 경로지만, 검색처럼 "없음"이 빈 배열(200)로 정상 처리되는 라우트도 있다. 다른 라우트의 에러 매핑을 그대로 복붙하지 않는다.
