# CLAUDE.md — frontend/services/

> Last updated: 2026-07-16T00:00:00+09:00

## Scope

- **API 비즈니스 로직 + 쿼리 검증 로직 실물** — `frontend/api/{도메인}.ts`(controller)만 import한다.

## Structure

```
frontend/services/
├── {도메인}.ts            # 비즈니스 로직 + validate{Domain}Query() 검증 함수, frontend/api/{도메인}.ts 전용
└── {목적}.ts              # 2개 이상 도메인 서비스가 공유하는 비순수 헬퍼(부수효과는 없음)
```

## Critical Convention

- `frontend/src/hooks/`, `frontend/src/components/` 등 클라이언트 번들 코드에서 import하지 않는다 — `process.env.*` 서버 시크릿(Supabase service role key, OpenAI key, 네이버 client secret 등)을 직접 참조하는 레이어다. 이유: 브라우저에 시크릿이 그대로 노출됨
- 쿼리 파라미터 검증 함수(`validate{Domain}Query`)를 `frontend/src/types/`나 별도 폴더로 빼지 않는다 — 이 도메인 파일 안에 비즈니스 로직과 같이 둔다. 이유: 도메인마다 검증 필드가 다르고(`keyword/timeUnit` vs `from/to`) 일부는 현재 날짜 참조로 순수하지도 않아 `types/`(순수 타입 전용)나 `utils/`(순수 함수 전용) 어디에도 속하지 않음 — controller만 import한다는 점에서 비즈니스 로직과 소비 경계가 같음
- 검증 함수 내부의 순수 헬퍼(날짜 형식 검사 등)가 여러 도메인 파일에서 동일하게 중복되면 그 자리에 두지 않는다 — `frontend/src/utils/`로 승격해 import한다. 이유: 도메인 무관 순수 함수 중복은 한쪽만 고쳤을 때 어긋남
- `{도메인}.ts` 파일명은 kebab-case, 도메인명 그대로 쓴다(예: `posts.ts`) — PascalCase로 바꾸지 않는다. 이유: `frontend/api/{도메인}.ts`(controller)와 1:1 대응하는 파일이라 이름이 어긋나면 어느 controller가 어느 service를 import하는지 파일명만으로 못 찾음. `{목적}.ts`는 kebab-case·목적명으로 쓴다(도메인명 금지 — `frontend/docs/conventions/00_FILE_CONVENTIONS.md` 참고)
- 2개 이상 도메인 서비스 파일이 공유하게 된 비순수 헬퍼(부수효과는 없음, 예: 현재시각 기준 range 계산)를 도메인 파일에 중복해서 두지 않는다 — `services/{목적}.ts`로 승격한다. 이유: 순수하면 `frontend/src/utils/`로 가지만, 비순수(서버 컨텍스트 의존)라 레이어까지 넘는 `utils/` 경계엔 안 맞음 — services 레이어 안에서만 도메인 무관화한다

## Gotchas

## 관련 문서

- import 하는 쪽(controller): `frontend/api/CLAUDE.md`
- 계약 타입 물리 위치: `frontend/src/CLAUDE.md`
- 도메인 무관 순수 헬퍼 물리 위치: `frontend/src/utils/CLAUDE.md`
- 파일명 케이스: `frontend/docs/conventions/00_FILE_CONVENTIONS.md`
