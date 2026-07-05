---
name: feature-spec-decomposer
description: "TMDB 탐색 웹앱에서 기능 요청을 구현 태스크로 분해할 때 사용. PRD/Architecture/Design/ADR 문서를 읽고 태스크 목록·브랜치 필요 여부·ADR 초안을 만든다. '기능 추가해줘', '이 PRD 구현해줘', '~ 페이지 만들어줘', '검색 기능 붙여줘' 등 이 프로젝트의 새 기능/화면 요청에 반드시 사용. 단순 오탈자 수정이나 스타일 미세조정처럼 태스크 분해가 필요 없는 요청에는 사용하지 않는다."
---

# Feature Spec Decomposer

Planner 에이전트가 사용하는 스킬. 사용자의 기능 요청을 Implementer가 바로 작업 가능한 태스크로 쪼갠다.

## 왜 모듈 경계로 분해하는가

`01_ARCHITECTURE.md §5`는 이 앱을 `tmdb-client`/`home`/`search`/`detail`/`ui` 5개 모듈로 나눈다. 태스크를 이 경계에 맞춰 쪼개면 Implementer가 한 태스크 안에서 여러 모듈을 넘나들지 않아 QA의 경계면 검증이 명확해진다. 반대로 "검색 기능 전체"처럼 뭉뚱그리면 route handler·hook·컴포넌트가 뒤섞여 QA가 무엇을 교차 비교해야 할지 불명확해진다.

## 절차

1. `docs/00_PRD.md`를 읽어 요청 기능의 요구사항(FR/NFR)을 확인한다. **PRD가 placeholder(빈 템플릿) 상태라 요청과 매칭되는 FR이 없을 수 있다** — 이 경우 요구사항을 창작하지 말고 사용자에게 목표/우선순위/제외범위를 되묻는다.
2. `docs/01_ARCHITECTURE.md §4, §5`로 관련 모듈과 적용해야 할 에러/엣지케이스 정책을 확인한다.
3. `docs/03_DESIGN.md`로 필요한 디자인 토큰이 이미 정의되어 있는지 확인한다. 없으면 태스크에 "디자인 토큰 부재 — 확인 필요"로 표시한다.
4. `docs/02_ADR.md` Index를 확인해 이번 기능이 과거 결정(DB 미사용, API 키 은닉 전략 등)과 충돌하지 않는지 검토한다.
5. 기능을 모듈 단위 태스크로 분해한다. 하나의 태스크는 "하나의 화면 또는 하나의 API 엔드포인트 + 그 소비자"를 넘지 않는다.
6. 브랜치 판단: `AGENTS.md` Git 전략상 `feat/*`가 필요하면 브랜치명을 제안한다(`feat/{기능-kebab-case}`). 이미 해당 브랜치에 있으면 생략.
7. 새 기술/라이브러리/전략이 필요하면 ADR 초안을 작성한다(번호 = Index 최신+1, Nygard 포맷 그대로).

## 출력 포맷

`_workspace/01_planner_tasks.md`에 아래 형식으로 작성한다.

```markdown
# 기능: {기능명}

## 브랜치
- {feat/xxx 제안 | 불필요 (이미 해당 브랜치)}

## ADR
- {ADR-000N 초안 있음 | 없음}

## 태스크
### T1. {태스크명}
- 모듈: {tmdb-client|home|search|detail|ui}
- 설명: {구체적 구현 범위 — 파일/함수 단위까지 가능하면 명시}
- 에러/엣지케이스 요구사항: {01_ARCHITECTURE §4 중 해당 항목, 없으면 "해당 없음"}
- 디자인 토큰: {사용할 토큰, 부재 시 "확인 필요"}
- 완료 기준: {QA가 PASS 판정할 조건 — 구체적으로}
```

## ADR 초안 포맷

기존 `02_ADR.md` Log 섹션과 동일한 Nygard 포맷을 그대로 따른다(Context/Decision/Consequences). 사용자 승인 전에는 `_workspace/`에만 두고 `02_ADR.md`를 수정하지 않는다.
