# CLAUDE.md — frontend/src/constants/

> Last updated: 2026-07-16T00:00:00+09:00

## Scope

- **2개 이상 소비자가 공유하는 상수만** — 소비자가 1개뿐인 매직 값은 그 소비자가 속한 파일에 로컬로 둔다.

## Structure

```
frontend/src/constants/
├── {도메인}.ts        # 도메인 종속 상수
└── {목적}.ts          # 도메인 무관 전역/공통 상수
```

## Critical Convention

- 특정 도메인 비즈니스 로직에 묶인 상수를 `{목적}.ts`(공통 파일)에 넣지 않는다 — 도메인 종속이면 `{도메인}.ts`, 도메인 무관하게 앱 전역에서 쓰이면 `{목적}.ts`로 나눈다. 이유: 섞이면 도메인 하나만 고칠 때도 무관한 상수까지 같이 리뷰해야 함
- 2번째 소비자가 생기기 전에 미리 이 폴더로 옮겨두지 않는다. 이유: `frontend/src/utils/CLAUDE.md`와 동일 원칙 — 공유 여부 확정 전 중앙화는 오버엔지니어링

## Gotchas

## 관련 문서

- 파일명 케이스 및 식별자 케이스(SCREAMING_SNAKE_CASE/camelCase): `frontend/docs/conventions/00_FILE_CONVENTIONS.md`
