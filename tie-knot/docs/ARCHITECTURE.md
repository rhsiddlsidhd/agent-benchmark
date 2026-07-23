# docs/ARCHITECTURE.md

> Last updated: 2026-07-23
> **목표(target) 구조 문서다 — 코드는 아직 이 구조로 이동하지 않았다.** 이 문서를 먼저 확정한 뒤 그 다음에 실제 마이그레이션을 진행한다(문서 우선 → 문서 기반 리팩토링 순서, 코드가 먼저 바뀌는 걸 금지).

## Overview

지금 `src/` 최상위는 역할별로 평평하게 나열돼있다(`actions/`, `api/`, `services/`, `models/`, `lib/`, `schemas/`, `types/`, `utils/`, `components/`, `hooks/`, `store/`, `context/`, `constants/`). 이 나열 방식은 폴더 이름만 보고 "클라이언트 번들에 들어가는 코드"인지 "서버에서만 도는 코드"인지 구분이 안 된다 — 실제로 폴더 하나 안에 서버 전용과 클라이언트 전용이 섞인 경우가 이미 있다:

- `lib/kakao/useKakaoLoader.ts` — React 훅, 브라우저 전용
- `lib/cookies/*.ts` — `next/headers`의 `cookies()` 사용, 서버 전용
- `api/response.ts`(서버, route.ts 전용) vs `api/fetcher.ts`/`apiRequest.ts`(클라이언트 fetch)

목표 구조는 "누가 import하는가"를 최상위 분류 기준으로 삼는다 — `server/`(클라이언트 번들에 절대 안 들어감) / `client/`(브라우저 전용) / `shared/`(서버·클라 둘 다, isomorphic) 3분할. `app/`은 Next.js 라우팅 규약상 위치를 옮길 수 없어 그대로 둔다.

## 목표 트리

```
src/
├── app/                        # Next.js 라우팅 전용 (이동 불가)
│   ├── (main)/...
│   ├── (preview)/...
│   └── api/                    # route.ts만 — apiOk/apiFail 통해 응답
│
├── server/                     # 클라이언트 번들에 절대 안 들어감
│   ├── models/                 # mongoose 스키마
│   ├── services/                # DAL(비즈니스 로직 + DB 접근 + 인가)
│   ├── lib/
│   │   ├── mongodb/
│   │   ├── bcrypt/
│   │   ├── jose/
│   │   ├── cookies/             # next/headers 씀 — 서버 전용 확정
│   │   ├── cloudinary/
│   │   └── nodemailer/
│   ├── response.ts              # apiOk/apiFail (현재 src/api/response.ts)
│   └── actions/                 # Server Actions (models/services 직접 참조)
│
├── client/                     # 브라우저에서만 씀
│   ├── components/
│   │   └── atoms/molecules/organisms/templates
│   ├── hooks/
│   ├── store/
│   ├── context/
│   ├── lib/
│   │   └── kakao/                # useKakaoLoader — 브라우저 SDK 로더
│   ├── fetcher.ts               # 현재 src/api/fetcher.ts
│   └── apiRequest.ts            # 현재 src/api/apiRequest.ts
│
├── shared/                     # 서버·클라 둘 다 import (isomorphic)
│   ├── schemas/                  # request/response zod
│   ├── types/                    # APIResponse/HTTPError 등
│   ├── constants/
│   └── utils/
│
└── test/
```

## 마이그레이션 매핑 (현재 → 목표)

| 현재 경로 | 목표 경로 | 비고 |
|---|---|---|
| `src/models/` | `src/server/models/` | 그대로 이동 |
| `src/services/` | `src/server/services/` | 그대로 이동 |
| `src/lib/mongodb`, `bcrypt`, `jose`, `cookies`, `cloudinary`, `nodemailer` | `src/server/lib/{name}` | 그대로 이동 |
| `src/lib/kakao` | `src/client/lib/kakao` | 서버 lib에서 분리 |
| `src/lib/cn` | `src/client/lib/cn` | UI 전용 유틸 |
| `src/api/response.ts` | `src/server/response.ts` | |
| `src/api/fetcher.ts`, `apiRequest.ts` | `src/client/fetcher.ts`, `apiRequest.ts` | `src/api/` 폴더 자체는 사라짐 |
| `src/actions/` | `src/server/actions/` | |
| `src/schemas/` | `src/shared/schemas/` | |
| `src/types/` | `src/shared/types/` | |
| `src/constants/` | `src/shared/constants/` | |
| `src/utils/` | `src/shared/utils/` | |
| `src/components/` | `src/client/components/` | |
| `src/hooks/` | `src/client/hooks/` | |
| `src/store/` | `src/client/store/` | |
| `src/context/` | `src/client/context/` | |
| `src/app/` | 그대로 | Next.js 제약으로 이동 불가 |

## 왜 sibling 최상위 `backend/`가 아니라 `src/` 안에서 3분할인가

- `app/`이 Next.js 규약상 `src/` 밖으로 못 나가므로, 완전한 물리적 분리(별도 최상위 디렉토리)를 해도 `app/api/*/route.ts`는 결국 그 디렉토리를 import해야 한다 — 분리 이득이 없다.
- `tsconfig.json`의 `@/*` alias가 `./src/*` 하나뿐이라, `src/` 안에서 재배치하면 alias 변경이 필요 없다(경로 세그먼트만 늘어남).
- `lib/`, `schemas/`, `types/`, `api/`처럼 이미 서버/클라가 섞인 폴더가 있어 "backend 통째로 이동"이 원천적으로 불가능하다 — 어차피 폴더별로 쪼개야 한다면 `src/` 밖으로 나갈 이유가 없다.

## 상태

- [ ] 마이그레이션 미착수. 이 문서는 목표 상태만 확정한 것이고, 실제 파일 이동/import 경로 변경은 별도 작업·별도 브랜치에서 진행한다.
- 이동 전까지는 각 레이어의 기존 `CLAUDE.md`(`src/services/CLAUDE.md` 등)가 실제 코드 위치 기준으로 계속 유효하다 — 이 문서와 경로가 다르다고 기존 문서를 무시하지 않는다.
- 마이그레이션이 실행되면 이동된 각 폴더의 `CLAUDE.md`도 새 경로 기준으로 함께 갱신한다(경로 예시·Structure 트리 갱신 포함).

## 관련 문서

- 배럴/import·상태관리 계층 원칙: `src/CLAUDE.md`
- 서비스 레이어 계약: `src/services/CLAUDE.md`
- Route Handler 응답 계약: `src/app/api/CLAUDE.md`, `src/api/CLAUDE.md`
- 레이어 간 에러 흐름: `docs/ERROR_HANDLING.md`
