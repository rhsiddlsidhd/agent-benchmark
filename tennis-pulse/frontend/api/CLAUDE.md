# CLAUDE.md — frontend/api/

> Last updated: 2026-07-13T20:59:44+09:00

## Layer 성격

- **Vercel Serverless Functions** — 이 폴더가 Vercel 배포 루트(Root Directory=`frontend`) 바로 아래 `api/`라서 파일기반 라우팅으로 자동 인식됨(`api/{도메인}.ts` → `/api/{도메인}`)
- 소유권은 **backend 에이전트** — 단, 물리적 위치는 Vercel 라우팅 제약 때문에 `frontend/` 트리 안(소유권 ≠ 배포 위치)
- controller와 route는 같은 파일(파일기반 라우팅이라 별도 레이어 아님)

## Convention

- 계약 우선(contract-first): 계약변경 필요한 요청은 구현 전 `write-api-spec` 스킬로 `docs/api/*.md` 먼저 확정한다 — 코드 작성 전 필수

## Architecture Tree

```
frontend/api/
├── {도메인}.ts            # controller=route — /api/{도메인}
├── services/
│   └── {도메인}.ts         # 비즈니스 로직
└── types/
    └── ...                  # 계약 타입(zod 스키마 등 런타임검증 포함)
```

## 관련 문서

- API 계약 문서: `docs/api/*.md` (write-api-spec 스킬 산출물)
