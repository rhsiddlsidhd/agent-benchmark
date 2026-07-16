# CLAUDE.md — backend/

> Last updated: 2026-07-16T00:00:00+09:00

## Scope

- Vercel 배포 루트가 `frontend`로 설정돼있어 `backend/`는 서버리스 함수로 라우팅되지 않는다 — 요청-응답 없이 실행 후 종료되는 스크립트/배치 작업 전용

## Structure

```
backend/
├── main.py               # entrypoint
├── {도메인}/
│   ├── types.py           # 파싱 결과 타입(도메인별 정의)
│   └── service.py
└── requirements.txt
```

## Critical Convention

- HTTP API를 작성하지 않는다 — API가 필요하면 `frontend/api/`에 작성한다. 이유: `backend/`는 Vercel 서버리스 함수로 라우팅되지 않아 HTTP로 노출할 수 없음

## Gotchas

- tennispeople.kr 목록 HTML의 `<td>`가 정상적으로 닫히지 않아 DOM 트리 파싱이 실패한다 — `<font color="#333333">` 라벨과 값 포맷을 순서 앵커링하는 정규식으로 파싱한다. 상단 고정 공지는 페이지 무관하게 항상 재노출되므로 "일반 게시글 0개"를 목록 종료 기준으로 삼는다 (`backend/crawler/service.py` 참고)

## 관련 문서
