# CLAUDE.md — frontend/src/

> Last updated: 2026-07-13T20:59:44+09:00

## Layer 성격

- **React(Vite) 단순 SPA** — Next.js 아님(SEO/SSR 불필요, 데이터 접근은 `frontend/api/**` 서버리스 함수가 전담)
- **frontend 에이전트 전담** — `frontend/api/**`(backend 소유)와 별개
- 차트 라이브러리: Recharts

## Convention

- 데이터 접근은 항상 same-origin `/api/*` 경유 — Supabase/네이버/OpenAI를 직접 호출하지 않는다
- `VITE_` 접두사 env var는 클라이언트 번들에 그대로 노출된다 — secret 계열은 절대 이 접두사로 넣지 않는다. 현재 아키텍처(모든 데이터접근이 `/api/*` 경유)상 환경변수 자체가 필요 없을 가능성 높음(실제 필요성은 구현 시점에 재확인)

## Architecture Tree

```
frontend/src/
├── main.tsx
├── App.tsx
├── types/                  # 계약 타입 import 전용(새로 정의 안 함)
├── hooks/
│   └── use{도메인}.ts       # API 훅 — fetch 경계 zod 검증
├── components/
│   └── {도메인}/             # UI 컴포넌트(차트: Recharts)
└── index.css / App.css
```

## 관련 문서

- API 계약 문서: `docs/api/*.md`
