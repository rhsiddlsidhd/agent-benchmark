# CLAUDE.md — frontend/src/hooks/

> Last updated: 2026-07-16T00:00:00+09:00

## Scope

- **순수 클라이언트 커스텀 훅** — 컴포넌트에서 로직을 분리해 필요한 값만 넘겨주는 훅. 두 갈래:
  1. 특정 데이터를 호출하는 비즈니스 훅 — same-origin `/api/*` fetch + zod 런타임 검증 후 계약 타입 그대로 반환, 도메인당 엔드포인트 1개 대응(1 hook = 1 endpoint, `use{Domain}.ts`)
  2. 그 외 로직을 컴포넌트에서 분리해 관리하는 훅(`use{목적}.ts`) — 2개 이상 컴포넌트가 공유하게 될 때만 승격, 1개 컴포넌트만 쓰면 그 컴포넌트 파일에 로컬로 둔다

## Structure

```
frontend/src/hooks/
├── use{Domain}.ts         # 데이터 페칭 훅 — { data, isLoading, error, fetch{Domain} } 반환
└── use{목적}.ts            # 페칭 외 공유 로직 훅(2개 이상 컴포넌트 공유 시)
```

## Critical Convention

- fetch 응답을 zod로 검증하지 않고 그대로 상태에 넣지 않는다 — `res.json()`은 `unknown`으로 받고 `{domain}ResponseSchema.safeParse()`를 통과한 값만 상태에 반영한다. 이유: 서버 응답이 계약과 어긋나도 타입 체커가 잡지 못하는 런타임 문제라 fetch 경계에서 직접 막아야 함
- `frontend/src/schemas/{도메인}.ts`가 이미 export한 zod 스키마(`{Domain}Schema`)가 있으면 재정의하지 않고 import해 재사용한다. 이유: `frontend/src/schemas/CLAUDE.md` Critical Convention 참고
- fetch 실패/에러 응답/파싱 실패 세 갈래를 하나의 catch-all로 뭉개지 않는다 — 갈래마다 `console.error`로 원인을 로그한 뒤 사용자용 에러 메시지를 상태에 넣는다. 이유: 전역 CLAUDE.md 에러 처리 원칙(에러 삼키지 않기) — 세 실패 원인을 구분해야 실제 디버깅이 가능함
- 훅 내부 상태(`Use{Domain}State`)를 컴포넌트로 그대로 노출하지 않는다 — `{ ...state, fetch{Domain} }` 형태로 spread해 반환한다. 이유: 기존 3개 훅(useNaverTrend/usePosts/usePostsSummary)이 전부 이 반환 형태를 따름 — 임의로 다른 형태를 쓰면 컴포넌트 쪽 소비 패턴이 깨짐
- 여러 페칭 훅이 로직을 공유하게 되더라도 `use{목적}.ts`로 뭉뚱그려 추상화하지 않는다 — 도메인 이름은 유지한다. 이유: 도메인마다 페칭 세부(파라미터/에러 처리)가 달라질 수 있어 이름에 도메인이 드러나야 함 — `use{목적}.ts`는 페칭 외 로직 전용
- 2번째 컴포넌트가 생기기 전에 미리 `use{목적}.ts`로 옮겨두지 않는다. 이유: `utils/CLAUDE.md`·`types/CLAUDE.md`와 동일 원칙 — 공유 여부 확정 전 중앙화는 오버엔지니어링
- `use{목적}.ts` 안에서 `frontend/services/*`, `frontend/api/*`를 직접 호출/import하거나 자체적으로 fetch하지 않는다. 이유: 데이터 페칭은 `use{Domain}.ts` 소관으로 고정돼있음 — `use{목적}.ts`에 fetch가 섞이면 "페칭 외 로직"이라는 이 파일의 존재 이유가 무의미해지고 페칭 훅과 역할이 겹침
- React state/effect가 필요 없는 로직을 `use{목적}.ts`로 만들지 않는다 — 순수하면 `frontend/src/utils/`로 승격하고, 비순수인데 React 의존이 없으면 그 로직을 쓰는 파일에 로컬로 둔다(공유되는 비순수 클라이언트 헬퍼 전용 폴더는 아직 없음 — 실사례 생기면 그때 정의). 이유: React 훅 메커니즘이 필요 없는데 훅으로 감싸면 Rules of Hooks 제약만 추가되고 얻는 이득이 없음

## Gotchas

## 관련 문서

- fetch 대상 계약: `frontend/api/CLAUDE.md`
- 계약 타입/zod 스키마 물리 위치: `frontend/src/types/CLAUDE.md`
- 이 훅을 소비하는 쪽: `frontend/src/components/CLAUDE.md`
- 파일명 케이스: `frontend/docs/conventions/00_FILE_CONVENTIONS.md`
