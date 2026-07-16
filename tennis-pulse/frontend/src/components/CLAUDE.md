# CLAUDE.md — frontend/src/components/

> Last updated: 2026-07-16T00:00:00+09:00

## Scope

- **UI 컴포넌트** — `ui/`(도메인 무관 재사용 프리미티브), `layouts/`(페이지 구조 골격), `{도메인 또는 다도메인 개념}/`(도메인 타입 props를 받는 컴포넌트, Panel+Chart 역할 고정 — 단일 도메인이면 그 도메인명, 2개 이상 도메인 데이터를 함께 다루면 그걸 아우르는 추상적 개념명) 세 갈래로만 나뉜다. 세 갈래 중 어디에도 안 맞는 새 하위 폴더를 임의로 만들지 않는다.

## Structure

```
frontend/src/components/
├── ui/                        # 상세: ui/CLAUDE.md
├── layouts/                   # 상세: layouts/CLAUDE.md
├── naver-trend/
│   ├── NaverTrendPanel.tsx    # 입력 폼 + use{Domain} 훅 호출 + 조건부 렌더링
│   └── NaverTrendChart.tsx    # data prop만 받는 순수 차트(Recharts)
├── posts/
│   ├── PostsTrendPanel.tsx
│   ├── PostsTrendChart.tsx
│   └── PostsSummaryPanel.tsx
└── trend-comparison/           # 다도메인 개념 폴더 예시 — Post[]+NaverTrendPoint[] 등 2개 이상 도메인 타입을 함께 받는 컴포넌트
    └── TrendComparisonChart.tsx
```

## Critical Convention

- 레이아웃 골격(Header/Footer 등)을 `layouts/`가 아닌 다른 곳에 두지 않는다 — 여러 도메인이 공유하는 범용 컴포넌트를 `ui/`가 아닌 곳에 두지 않는다 — 특정 도메인 전용 컴포넌트를 `{도메인}/`이 아닌 곳(`ui/` 등)에 두지 않는다. 이유: 케이스(PascalCase)가 셋 다 동일해 위치로만 셋을 구분할 수 있음 — 위치 기준이 흔들리면 파일명만 보고 재사용 가능 범위를 판단할 수 없게 됨
- Chart 컴포넌트에서 `use{Domain}` 훅을 직접 호출하지 않는다 — Panel이 훅을 호출해 받은 데이터를 그대로 prop으로 넘긴다. 이유: 기존 Chart(NaverTrendChart/PostsTrendChart)가 전부 data prop만 받는 순수 컴포넌트로 남아있음 — fetch 로직과 렌더링을 분리해 Chart를 재사용 가능하게 유지하기 위함
- Chart의 data prop 타입을 임의로 계약 응답 타입 그대로 강제하지 않는다 — 집계 등 가공이 필요하면 Chart 전용 타입(`PostsTrendPoint` 등)을 그 Chart 파일에 정의하고, 변환 함수는 Panel에 둔다. 이유: PostsTrendChart는 `Post[]`가 아니라 월별 집계된 `PostsTrendPoint[]`를 받음 — 원본 계약 타입을 억지로 그대로 쓰면 집계 로직이 Chart 안으로 들어가 재사용성이 깨짐
- Panel에서 `frontend/services/*`, `frontend/api/*`를 직접 import하지 않는다 — 반드시 `frontend/src/hooks/use{Domain}.ts`를 경유한다. 이유: `frontend/src/CLAUDE.md`의 same-origin `/api/*` 경유 원칙
- 여러 도메인 타입을 함께 받는 컴포넌트를 무리하게 그중 한 도메인 폴더(`posts/` 등)에 넣지 않는다 — 그 데이터들을 아우르는 추상적 개념명 폴더(예: 검색량+게시글수를 같이 그리는 차트라면 `trend-comparison/`)를 새로 만든다. 이유: 특정 도메인 폴더에 넣으면 다른 도메인 데이터까지 다룬다는 게 폴더 위치만 봐서는 안 드러남 — 그렇다고 도메인 타입을 받는 이상 `ui/`(도메인 무관 전제)로도 못 감(`frontend/src/components/ui/CLAUDE.md` 참고)

## Gotchas

## 관련 문서

- 호출하는 훅: `frontend/src/hooks/CLAUDE.md`
- 계약 타입: `frontend/src/types/CLAUDE.md`
- 범용 프리미티브 세부 규칙: `frontend/src/components/ui/CLAUDE.md`
- 레이아웃 세부 규칙: `frontend/src/components/layouts/CLAUDE.md`
- 파일명 케이스: `frontend/docs/conventions/00_FILE_CONVENTIONS.md`
