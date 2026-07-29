# CLAUDE.md — src/server/

> Last updated: 2026-07-29

## Overview

`models`/`services`/`lib`/`actions`/`boundary.ts` — "누가 import하는가" 기준으로 서버에서만 도는 코드를 모은 최상위 폴더. `app/`은 Next.js 라우팅 규약상 여기 못 들어오지만, `app/api/*/route.ts`는 이 트리(`services`/`boundary.ts`)를 직접 참조한다.

## Key Files

`boundary.ts`는 성공(route 전용)/실패-wrapping(A·B 함수 분리, 리턴 타입 다름)/실패-변환(A·B 공용) 세 관심사를 한 파일에 담는다.

| File          | Purpose                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `boundary.ts` | A(actions)/B(route.ts) 서버 경계 — `routeSuccess`/`routeError`(Response)/`actionError`(함수 리턴값)/`toErrorPayload`(공용 변환) |

## Structure

```
src/server/
├── models/       # mongoose 스키마 — src/server/models/CLAUDE.md
├── services/     # DAL(비즈니스 로직 + DB 접근 + 인가) — src/server/services/CLAUDE.md
├── lib/          # 서버 전용 외부 연동 — src/server/lib/CLAUDE.md
├── actions/      # Server Actions — src/server/actions/CLAUDE.md
└── boundary.ts   # Key Files 참고.
```

## Critical Convention

- 클라이언트 번들에 들어가면 안 되는 코드(DB 드라이버, 서버 전용 SDK, `next/headers` 사용 코드 등)는 전부 이 트리 안에 둔다 — 새 서버 전용 코드를 `src/shared/`나 `src/client/`에 두지 않는다.

## References

즉시 로드(`@import`) 아님 — 트리거 열 키워드에 해당하는 작업일 때만 해당 문서를 읽는다.

| 문서                | 위치                  | 트리거                                      | 요약                                                     |
| ------------------- | --------------------- | ------------------------------------------- | -------------------------------------------------------- |
| `ERROR_HANDLING.md` | `docs/`               | 에러 처리 로직 작성/수정 시                 | 채널 A/B/C 전체 흐름 + 채널별(A/B/C) 상세 규칙 단일 소스 |
| `CLAUDE.md`         | `src/client/`         | 클라이언트 fetch 계약(fetcher) 작업 시      | `boundary.ts` envelope를 소비하는 쪽 계약                |
| `CLAUDE.md`         | `src/server/actions/` | Server Action(채널 A) 작업 시               | 이 계약에서 제외된 Server Actions 규칙                   |
| `CLAUDE.md`         | `src/app/api/`        | route.ts 작성/수정 시                       | 이 계약을 쓰는 Route Handlers 규칙                       |
| `CLAUDE.md`         | `src/shared/types/`   | `ErrorPayload`/`AppError` 타입 변경 시      | 응답/에러 타입 원본(`types/error.ts`)                    |
