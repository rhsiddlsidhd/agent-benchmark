# CLAUDE.md — frontend/src/

> Last updated: 2026-07-16T00:00:00+09:00

## Scope

- **React(Vite) 단순 SPA** — Next.js 아님(SEO/SSR 불필요, 데이터 접근은 `frontend/api/**` 서버리스 함수가 전담)

## Structure

```
frontend/src/
├── main.tsx
├── App.tsx
├── types/                  # API 계약 타입 실물 — zod 스키마는 schemas/ 소관
├── schemas/                # zod 런타임 검증 스키마 — schemas/CLAUDE.md
├── hooks/
│   ├── use{도메인}.ts       # 데이터 페칭 훅 — fetch 경계 zod 검증
│   └── use{목적}.ts         # 페칭 외 공유 로직 훅
├── utils/                  # 2개 이상 소비자 공유 순수 함수 — utils/CLAUDE.md
├── constants/              # 2개 이상 소비자 공유 상수 — constants/CLAUDE.md
├── components/
│   ├── ui/                  # 도메인 비종속 재사용 프리미티브
│   ├── layouts/              # 페이지 구조 골격
│   └── {도메인}/              # UI 컴포넌트(차트: Recharts)
└── index.css / App.css
```

## Critical Convention

- 데이터 접근은 same-origin `/api/*`만 경유한다 — 직접 호출하지 않는다(Supabase/네이버/OpenAI). 이유: 서버 시크릿이 서버리스 함수 밖으로 노출되지 않게 하기 위함
- secret 계열 env var는 `VITE_` 접두사로 넣지 않는다. 이유: 클라이언트 번들에 그대로 노출됨(Gotchas 참고). 현재 아키텍처(모든 데이터접근이 `/api/*` 경유)상 환경변수 자체가 필요 없을 가능성 높음(실제 필요성은 구현 시점에 재확인)
- `frontend/services/{도메인}.ts`는 `src/hooks/`, `src/components/` 등 클라이언트 번들 코드에서 import하지 않는다. 이유: 서버 시크릿을 직접 참조하는 레이어라 브라우저에 노출됨. 상세: `frontend/services/CLAUDE.md`

## Gotchas

- `VITE_` 접두사 env var는 Vite가 빌드 시 클라이언트 번들에 그대로 포함시킨다 — 시크릿에 실수로 이 접두사 붙이면 브라우저 소스에서 그대로 노출됨

## 관련 문서

- API 계약 문서: `docs/api/*.md`
- `api/`↔`services/`↔`types/` 배치 이유: `frontend/api/CLAUDE.md`
- 컴포넌트 3분류 기준: `frontend/src/components/CLAUDE.md`
- zod 런타임 검증 스키마: `frontend/src/schemas/CLAUDE.md`
- 공유 순수 함수: `frontend/src/utils/CLAUDE.md`
- 공유 상수: `frontend/src/constants/CLAUDE.md`
