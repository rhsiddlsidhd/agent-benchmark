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

## 에러 판단 로직 — 제거됨

- 클라이언트 쪽 "실패를 보고 field/message/silent 중 뭘 보여줄지 판단"하는 로직은 제거했다 — 서버 공용 핸들러(채널 A/B)가 이미 표시-안전한 `ErrorPayload { 분류, message, fieldErrors? }`를 만들어 보내므로(민감 분류 message는 서버에서 일반화, 필드 에러는 fieldErrors에), 컴포넌트는 폼이면 `useActionState` state를, GET이면 `useSWR` `error`를 그대로 렌더할 뿐이다. 원문/일반화 판단·outcome 분류를 `utils`에서 하지 않는다(공통 규칙은 `src/CLAUDE.md` "에러 핸들링" 참고).

## Gotchas

- `utils/error.ts`(클라 에러 판단 로직)와 그 소비 헬퍼(`handleClientError`)는 제거 대상이다 — 위 "에러 판단 로직 — 제거됨" 참고. 폼은 `useActionState` state, GET은 `useSWR` `error`를 직접 렌더하므로 이 헬퍼가 불필요하다(마이그레이션에서 파일째 삭제).
- 진단용 `console.error` 호출은 "side-effect 없음" 원칙 위반으로 안 친다(service/util 파일들 공통).
- `validate-and-flatten.ts`는 `src/lib/validation/`에서 옮겨왔다 — zod(`schema.safeParse`)만 쓰는 순수 함수라 side-effect/시크릿/외부 통신이 전혀 없는데, 예전엔 "zod가 npm 패키지"라는 이유만으로 `lib/`에 잘못 분류돼있었다. npm 패키지 사용 자체가 `lib/` 분류 기준이 아니라는 걸 보여주는 실사례.

## 관련 문서

- 식별자 케이스 공통 규칙: `src/CLAUDE.md`
- side-effect 로직과의 경계: `src/lib/CLAUDE.md`
- 배럴 import 정책: `src/CLAUDE.md`
- 테스트 작성 컨벤션(1차 커버 범위 우선순위): `docs/TESTING_GUIDELINE.md`
