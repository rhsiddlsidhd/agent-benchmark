# CLAUDE.md — frontend/api/

> Last updated: 2026-07-14T00:00:00+09:00

## Layer 성격

- **Vercel Serverless Functions** — Vercel 배포 루트(Root Directory=`frontend`) 바로 아래 `api/`라서 파일기반 라우팅으로 자동 인식됨(`api/{도메인}.ts` → `/api/{도메인}`)

## Convention

- 계약 우선(contract-first): 계약변경 필요한 요청은 구현 전 `write-api-spec` 스킬로 `docs/api/*.md` 먼저 확정한다 — 코드 작성 전 필수
- `api/` 안에 controller가 아닌 파일 새로 만들지 않는다 — 비즈니스 로직은 `frontend/src/services/{도메인}.ts`, 계약 타입은 `frontend/src/types/{도메인}.ts`에 둔다

## Architecture Tree

```
frontend/api/
└── {도메인}.ts            # controller=route — /api/{도메인}
```

## 관련 문서

- API 계약 문서: `docs/api/*.md` (write-api-spec 스킬 산출물)
- 비즈니스 로직·계약 타입 물리 위치: `frontend/src/CLAUDE.md`
