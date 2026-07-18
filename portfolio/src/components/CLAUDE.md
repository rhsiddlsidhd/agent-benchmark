# CLAUDE.md — src/components/

> Last updated: 2026-07-16T00:00:00+09:00

## Scope

- **UI 컴포넌트** — `ui/`(도메인 무관 재사용 프리미티브), `layouts/`(페이지 구조 골격), `{도메인}/`(같은 도메인의 2번째 소비자부터 승격되는 도메인 전용 컴포넌트, Panel+Chart 역할 고정) 세 갈래로만 나뉜다. 소비자가 1개뿐인 컴포넌트는 도메인 타입 props 여부와 무관하게 이 셋 어디에도 두지 않고 그 컴포넌트를 쓰는 라우트/페이지 파일에 로컬로 둔다(Critical Convention 참고). 세 갈래 중 어디에도 안 맞는 새 하위 폴더를 임의로 만들지 않는다.

## Structure

```
src/components/
├── ui/                        # 상세: ui/CLAUDE.md
├── layouts/                   # 상세: layouts/CLAUDE.md
├── naver-trend/               # 같은 도메인 2번째 소비자부터 승격된 예
│   ├── NaverTrendPanel.tsx    # 입력 폼 + use{Domain} 훅 호출 + 조건부 렌더링
│   └── NaverTrendChart.tsx    # data prop만 받는 순수 차트(Recharts)
├── posts/
│   ├── PostsTrendPanel.tsx
│   ├── PostsTrendChart.tsx
│   └── PostsSummaryPanel.tsx
└── trend-comparison/          # 2개 이상 도메인 타입을 동시에 다뤄야 하는 컴포넌트의 추상 개념명 폴더
    └── TrendComparisonChart.tsx
```

## Critical Convention

- 소비자가 1개뿐인 컴포넌트를 미리 `ui/`·`{도메인}/`으로 승격하지 않는다 — 도메인 타입 props가 있든 없든 그 컴포넌트를 쓰는 라우트/페이지 파일에 로컬로 둔다. 이유: `src/utils/CLAUDE.md`·`src/types/CLAUDE.md`·`src/hooks/CLAUDE.md`와 동일 원칙 — 공유 여부 확정 전 중앙화는 오버엔지니어링
- 같은 도메인의 2번째 소비자(페이지)가 생겼다고 그 컴포넌트의 도메인 타입 props를 벗겨내지 않는다 — 그대로 유지한 채 `{도메인}/`(예: `posts/`)로만 옮긴다. 이유: 아직 그 도메인 안에서만 재사용되는 단계라 범용화는 시기상조
- 다른 도메인이 재사용하게 됐다고 그 컴포넌트를 곧바로 옮기지 않는다 — props에서 도메인 타입을 걷어내 원시타입/제네릭으로 범용화까지 마친 뒤에만 `ui/`로 옮긴다(`src/components/ui/CLAUDE.md` 참고). 범용화가 불가능하면(컴포넌트가 반드시 여러 도메인 타입을 동시에 알아야 하면) `ui/`로 보내지 않고 그 데이터들을 아우르는 추상 개념명 폴더(예: `trend-comparison/`)를 새로 만든다. 이유: 도메인 타입을 그대로 받는 이상 `ui/`(도메인 무관 전제)에 두면 그 존재 이유가 무의미해짐
- 레이아웃 골격(Header/Footer 등)을 `layouts/`가 아닌 다른 곳에 두지 않는다 — 여러 도메인이 공유하는 범용 컴포넌트를 `ui/`가 아닌 곳에 두지 않는다 — 특정 도메인 전용 컴포넌트를 `{도메인}/`이 아닌 곳(`ui/` 등)에 두지 않는다. 이유: 케이스(PascalCase)가 셋 다 동일해 위치로만 셋을 구분할 수 있음 — 위치 기준이 흔들리면 파일명만 보고 재사용 가능 범위를 판단할 수 없게 됨
- Chart 컴포넌트에서 `use{Domain}` 훅을 직접 호출하지 않는다 — Panel이 훅을 호출해 받은 데이터를 그대로 prop으로 넘긴다. 이유: 기존 Chart(NaverTrendChart/PostsTrendChart)가 전부 data prop만 받는 순수 컴포넌트로 남아있음 — fetch 로직과 렌더링을 분리해 Chart를 재사용 가능하게 유지하기 위함
- Chart의 data prop 타입을 임의로 계약 응답 타입 그대로 강제하지 않는다 — 집계 등 가공이 필요하면 Chart 전용 타입(`PostsTrendPoint` 등)을 그 Chart 파일에 정의하고, 변환 함수는 Panel에 둔다. 이유: PostsTrendChart는 `Post[]`가 아니라 월별 집계된 `PostsTrendPoint[]`를 받음 — 원본 계약 타입을 억지로 그대로 쓰면 집계 로직이 Chart 안으로 들어가 재사용성이 깨짐
- Panel에서 `services/*`, `api/*`를 직접 import하지 않는다 — 반드시 `src/hooks/use{Domain}.ts`를 경유한다. 이유: `src/CLAUDE.md`의 same-origin `/api/*` 경유 원칙

## Gotchas

## 관련 문서

- 호출하는 훅: `src/hooks/CLAUDE.md`
- 계약 타입: `src/types/CLAUDE.md`
- 범용 프리미티브 세부 규칙: `src/components/ui/CLAUDE.md`
- 레이아웃 세부 규칙: `src/components/layouts/CLAUDE.md`
