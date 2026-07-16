# CLAUDE.md — frontend/

> Last updated: 2026-07-16T00:00:00+09:00

## Scope

- **frontend 전체** — React(Vite) SPA(`src/`) + Vercel Serverless Functions(`api/`) + 서버 전용 비즈니스 로직(`services/`)을 아우르는 Vercel 배포 루트. 레이어별 세부 컨벤션은 `frontend/src/CLAUDE.md`, `frontend/api/CLAUDE.md`, `frontend/services/CLAUDE.md`에 있다.

## Commands

```bash
npm install          # 최초 1회
npm run dev           # Vite 개발 서버
npm run build          # tsc -b (app/node/api 3개 tsconfig 참조 전부 타입체크) && vite build
npm run lint            # oxlint
npm run preview          # 빌드 결과 로컬 프리뷰
```

- 단일 프로젝트만 타입체크: `npx tsc -p tsconfig.app.json --noEmit`(클라이언트) 또는 `npx tsc -p tsconfig.api.json --noEmit`(api/services/types)
- 테스트 러너는 구성돼 있지 않다.

## Structure

```
frontend/
├── src/       # React SPA(클라이언트) — tsconfig.app.json(DOM lib)
├── api/       # Vercel Serverless Functions(controller) — tsconfig.api.json(node lib)
└── services/  # 서버 전용 비즈니스 로직 — tsconfig.api.json(node lib), ⚠ src/에서 import 금지
```

- 타입체크는 `tsconfig.json`이 참조하는 3개 프로젝트(`tsconfig.app.json`/`tsconfig.api.json`/`tsconfig.node.json`)로 분리돼있다 — `src/types/`는 물리적으로 `src/` 밑에 있지만 컴파일 경계는 `tsconfig.api.json`(node 타입, DOM lib 없음) 쪽에 포함된다. 이유: 계약 타입은 클라이언트(`src/hooks`)와 서버(`api/`, `services/`) 양쪽이 공유해서 import하므로 DOM 전용 타입에 묶이면 안 됨

## Critical Convention

- 새 파일을 만들거나 기존 파일을 옮길 때 대상 폴더의 네이밍 케이스만 맞추고 넘어가지 않는다 — 옮기기/생성 전에 그 폴더 `CLAUDE.md`의 Scope 정의와 실제로 성격이 맞는지 먼저 확인한다. 이유: 이름만 규칙에 맞고 내용(props 타입, 책임 등)이 그 폴더 정의와 안 맞으면 그 폴더가 존재하는 경계 자체가 무의미해짐(예: `ui/`에 도메인 타입 props 받는 컴포넌트를 이름만 범용으로 지어 넣는 경우)
- 성격이 대상 폴더 정의와 안 맞으면 그대로 두지 않는다 — 후보가 될 다른 `frontend/*` 레이어들(`src/{하위}`, `api/`, `services/` 등)의 `CLAUDE.md`를 전체 통독해 비교하고 가장 맞는 곳으로 옮긴다. 키워드 grep 매칭 결과만으로 "관련 규정 없음"이라 결론짓지 않는다 — 규칙이 다른 표현(예: provider 대신 "외부 상태관리 라이브러리")으로 적혀 있을 수 있다. 이유: grep은 정확한 단어가 일치할 때만 걸려서, 표현만 다르고 실제론 해당하는 규칙을 놓칠 수 있음
- 어느 레이어 정의와도 안 맞으면 기존 폴더에 임의로 끼워넣지 않는다 — 새 폴더를 만들거나 사용자에게 확인한다. 이유: 안 맞는 곳에 끼워넣으면 그 폴더 Scope 경계가 실제 내용물과 어긋나기 시작해 문서 신뢰도가 깨짐

## Gotchas

## 관련 문서

- 파일/폴더 네이밍 규칙: `docs/conventions/00_FILE_CONVENTIONS.md`
- 클라이언트 레이어: `frontend/src/CLAUDE.md`
- 서버리스 함수(controller): `frontend/api/CLAUDE.md`
- 비즈니스 로직(서버 전용): `frontend/services/CLAUDE.md`
