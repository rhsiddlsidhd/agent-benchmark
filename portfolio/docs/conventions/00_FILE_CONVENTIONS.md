# 네이밍 컨벤션 (frontend)

frontend 코드에서 아티팩트가 어디(폴더)에, 무슨 케이스로 이름 붙는지를 아티팩트 타입별로 규정한다.

## Structure

```
frontend/
└── src/
    ├── types/{도메인}.ts
    ├── hooks/use{Domain}.ts     # 데이터 페칭 훅
    ├── hooks/use{목적}.ts        # 페칭 외 공유 로직 훅
    ├── utils/{목적}.ts          # 도메인 무관 순수 함수
    ├── constants/{도메인}.ts     # 도메인 종속 상수
    ├── constants/{목적}.ts       # 전역/공통 상수
    └── components/
        ├── ui/            # 공통 컴포넌트(레이아웃 제외), 도메인 무관
        │   └── {Component}.tsx
        ├── layouts/
        │   └── {Layout}.tsx
        └── {도메인}/
            └── {Component}.tsx
```

- BFF 레이어(`api/`, `services/` 등 프로젝트 고유 서버 물리구조)는 이 문서 소관이 아니다 — 프로젝트별 최상위 `CLAUDE.md`에 정의한다. 이유: 모든 프론트엔드 프로젝트가 자체 서버리스/BFF 레이어를 갖는 게 아니라 범용 표준에 넣으면 안 맞는 프로젝트가 강제로 떠안게 됨
- 런타임 검증 스키마(`schemas/`, zod 등)도 이 문서 소관이 아니다 — 도입 여부와 물리 위치는 프로젝트별 `types/CLAUDE.md`에 정의한다. 이유: 모든 프론트엔드 프로젝트가 런타임 스키마 검증 라이브러리를 쓰는 게 아니라 api/services와 같은 이유로 범용 표준에서 뺀다
- 전역 상태 관리(`store/`, Context/zustand 등)도 이 문서 소관이 아니다 — 실제로 전역 상태가 필요한지, 필요하면 무엇으로 구현할지는 프로젝트별 요구사항에 달렸다. 이유: `ui/`·`utils/`처럼 어떤 프론트엔드 프로젝트든 결국 필요해지는 범용 카테고리가 아니라, 애초에 안 쓸 수도 있는 선택적 레이어라 범용 표준에 끼워 넣으면 안 쓰는 프로젝트까지 폴더를 떠안게 됨
- 페이지/라우팅(`pages/` 등)도 이 문서 소관이 아니다 — 프레임워크마다 라우팅 구조 자체가 다르다(React Router SPA는 자유 배치 `pages/{Page}.tsx`, Next.js App Router는 `app/{route}/page.tsx`처럼 고정 파일명 기반 라우팅). 이유: 이건 "쓸지 말지"의 선택 문제가 아니라 프레임워크가 강제하는 물리 구조라서, 범용 표준이 한쪽 프레임워크의 규칙을 강제하면 다른 프레임워크 프로젝트에서 그대로 깨짐

## {도메인} 표기

- 도메인명은 kebab-case로 통일한다. 예: `example-domain`, `example`
- 적용 대상: `frontend/src/types/{도메인}.ts`, `frontend/src/constants/{도메인}.ts`(도메인 종속 상수에 한함), `frontend/src/components/{도메인}/`
- 제외: `frontend/src/components/layouts/`, `frontend/src/components/ui/` — 도메인 무관 아티팩트라 kebab-case 도메인 표기 대상 아님

## 파일명 (아티팩트 타입별)

| 아티팩트               | 케이스                                                       | 예                                                                        |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| 컴포넌트               | PascalCase                                                   | `components/example-domain/ExampleChart.tsx`, `components/ui/Example.tsx` |
| 레이아웃               | PascalCase, `components/layouts/`에 위치                     | `components/layouts/Example.tsx`                                          |
| 훅(데이터 페칭)        | camelCase, `use` 접두사 필수, 도메인은 PascalCase로 이어붙임 | `useExampleDomain.ts`                                                     |
| 훅(페칭 외 공유 로직)   | camelCase, `use` 접두사 필수, 목적은 PascalCase로 이어붙임   | `useExamplePurpose.ts`                                                    |
| 타입                    | kebab-case, 도메인명 그대로                                  | `types/posts.ts`                                                          |
| 유틸                    | kebab-case, 목적명                                           | `utils/example.ts`                                                        |
| 상수(도메인 종속)      | kebab-case, 도메인명 그대로                                  | `constants/example.ts`                                                    |
| 상수(전역/공통)        | kebab-case, 목적명                                           | `constants/example-common.ts`                                             |

- 아티팩트 타입에 케이스를 맞추지 않는다 — 파일명만 보고 컴포넌트인지 훅인지 구분되어야 한다.
- 배럴 파일은 위 표와 무관하게 `index.ts`(컴포넌트 배럴은 `index.tsx`)로 고정한다.
- `{목적}` 기반 파일(범용/도메인 무관 카테고리 — `ui/`, `layouts/`, `utils/`, `constants/{목적}.ts`, `use{목적}.ts`, `services/{목적}.ts`, `schemas/{목적}.ts` 등)에는 도메인/라우트가 드러나는 이름을 쓰지 않는다. 이유: 이름이 도메인에 종속되면 재사용 가능 범위를 파일명만으로 오판하게 됨(예: `PostsButton.tsx`)

각 폴더 단독 분리/승격 기준(상수·유틸·훅·컴포넌트 위치)은 해당 폴더 CLAUDE.md 소관 — 아래 관련 문서 참고.

## 식별자 케이스

- 타입/인터페이스는 PascalCase, 함수/변수는 camelCase.
- 원시 리터럴 고정값(매직 넘버/문자열 대체용) `export const`는 SCREAMING_SNAKE_CASE(예: `MAX_COUNT = 1`), 여러 필드를 가진 구조화된 설정/프리셋 객체는 camelCase(예: `design = {}`)로 export한다. 위치가 `constants/`든 파일 내부 로컬이든 무관하게 적용한다.

## 관련 문서

- 상수 분리 기준: `frontend/src/constants/CLAUDE.md`
- 유틸 승격 기준: `frontend/src/utils/CLAUDE.md`
- 훅 분리 기준(페칭 vs 페칭 외 로직): `frontend/src/hooks/CLAUDE.md`
- 컴포넌트 위치 분리 기준: `frontend/src/components/CLAUDE.md`
- BFF 레이어(이 프로젝트의 선택): `frontend/api/CLAUDE.md`, `frontend/services/CLAUDE.md`
- 런타임 검증 스키마(이 프로젝트의 선택): `frontend/src/schemas/CLAUDE.md`
