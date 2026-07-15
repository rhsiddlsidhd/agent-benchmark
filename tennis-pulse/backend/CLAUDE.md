# CLAUDE.md — backend/

> Last updated: 2026-07-13T20:59:44+09:00

## Layer 성격

- Vercel 배포 루트가 `frontend`로 설정돼있어 `backend/`는 서버리스 함수로 라우팅되지 않는다 — 요청-응답 없이 실행 후 종료되는 스크립트/배치 작업 전용

## Convention

- HTTP API 작성 금지 — API가 필요하면 `frontend/api/`에 작성한다

## Architecture Tree

```
backend/
├── main.py               # entrypoint
├── {도메인}/
│   ├── types.py           # 파싱 결과 타입(도메인별 정의)
│   └── service.py
└── requirements.txt
```

## 관련 문서
