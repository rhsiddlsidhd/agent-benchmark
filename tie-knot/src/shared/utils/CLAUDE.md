# CLAUDE.md — src/shared/utils/

> Last updated: 2026-07-18

## Overview

side-effect 없는 도메인-무관 순수 함수 전담.

## Structure

```
src/shared/utils/
├── index.ts        # 배럴
├── date.ts        # 날짜 포맷/카운트다운 계산
└── ...                   # 목적당 파일 1개
```

## Critical Convention

- 파일명은 kebab-case, 목적명(기능/역할 기반 이름, 도메인명과 대비)으로 짓는다.
- DB 연결, 외부 API 호출, 파일시스템 접근 등 side-effect가 있는 로직을 여기 두지 않는다 — `src/lib/`로 옮긴다. 반대로 side-effect 없는 로직을 "npm 패키지를 쓴다"는 이유만으로 `src/lib/`에 두지 않는다.

## Gotchas

- `utils/error.ts`와 `types/error.ts`가 동명 — import 경로 착각 주의(전자는 API 에러 상태에서 필드 에러 추출하는 헬퍼, 후자는 에러 응답 타입 정의).
- `utils/error.ts`의 `handleClientError`는 `fetcher`/`apiRequest`가 throw한 에러를 받아 필드에러/메시지/void 중 뭘 보여줄지 판단하는 UI 로직이다(`src/client/CLAUDE.md` 참고). `console.error` 호출이 있어 "side-effect 없음" 원칙과 살짝 어긋나 보일 수 있는데, 진단용 로깅은 이 프로젝트에서 순수성 위반으로 안 친다(다른 service/util 파일들도 동일하게 취급).
- `validate-and-flatten.ts`는 `src/lib/validation/`에서 옮겨왔다 — zod(`schema.safeParse`)만 쓰는 순수 함수라 side-effect/시크릿/외부 통신이 전혀 없는데, 예전엔 "zod가 npm 패키지"라는 이유만으로 `lib/`에 잘못 분류돼있었다. npm 패키지 사용 자체가 `lib/` 분류 기준이 아니라는 걸 보여주는 실사례.

## 관련 문서

- 식별자 케이스 공통 규칙: `src/CLAUDE.md`
- side-effect 로직과의 경계: `src/lib/CLAUDE.md`
- 배럴 import 정책: `src/CLAUDE.md`
- 테스트 작성 컨벤션(1차 커버 범위 우선순위): `docs/TESTING_GUIDELINE.md`
