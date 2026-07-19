# CLAUDE.md — src/utils/

> Last updated: 2026-07-18

## Scope

- **외부 시스템/전역 상태를 건드리지 않는 함수, 도메인 무관.** 여기서 "side-effect 없음"은 자기 클로저 밖(DB/네트워크/파일시스템/전역 공유 상태)을 안 건드린다는 뜻이지, 내부 상태가 전혀 없어야 한다는 뜻이 아니다 — 예: debounce/throttle처럼 자기 클로저 안에서만 mutate되는 타이머 변수는 바깥에 안 새어나가므로 순수한 것으로 취급해 여기 둔다. **"외부 npm 패키지를 쓰느냐"는 기준이 아니다** — zod처럼 순수 계산만 하는 라이브러리는 여기 써도 된다(`validate-and-flatten.ts`가 실사례, Gotchas 참고). 판단 기준은 어디까지나 side-effect(I/O)·설정/시크릿 참조·외부 시스템과의 실제 통신 여부다(`src/lib/` 소관, `src/lib/CLAUDE.md` 참고).

## Structure

```
src/utils/
├── index.ts        # 배럴
├── date.ts        # 날짜 포맷/카운트다운 계산
└── ...                   # 목적당 파일 1개
```

## Critical Convention

- 파일명은 kebab-case, 목적명(기능/역할 기반 이름, 도메인명과 대비)으로 짓는다.
- DB 연결, 외부 API 호출, 파일시스템 접근 등 side-effect가 있는 로직을 여기 두지 않는다 — `src/lib/`로 옮긴다. 반대로 side-effect 없는 로직을 "npm 패키지를 쓴다"는 이유만으로 `src/lib/`에 두지 않는다.

## Gotchas

- `utils/error.ts`와 `types/error.ts`가 동명 — import 경로 착각 주의(전자는 API 에러 상태에서 필드 에러 추출하는 헬퍼, 후자는 에러 응답 타입 정의).
- `utils/error.ts`에 `handleClientError`가 있다 — `src/api/error.ts`(삭제됨)에서 옮겨온 것으로, `fetcher`/`apiRequest`가 throw한 에러를 받아 필드에러/메시지/void 중 뭘 보여줄지 판단하는 UI 로직이다(`src/api/CLAUDE.md` Gotchas 참고). `console.error` 호출이 있어 "side-effect 없음" 원칙과 살짝 어긋나 보일 수 있는데, 진단용 로깅은 이 프로젝트에서 순수성 위반으로 안 친다(다른 service/util 파일들도 동일하게 취급).
- `validate-and-flatten.ts`는 `src/lib/validation/`에서 옮겨왔다 — zod(`schema.safeParse`)만 쓰는 순수 함수라 side-effect/시크릿/외부 통신이 전혀 없는데, 예전엔 "zod가 npm 패키지"라는 이유만으로 `lib/`에 잘못 분류돼있었다. npm 패키지 사용 자체가 `lib/` 분류 기준이 아니라는 걸 보여주는 실사례.

## 관련 문서

- 파일명/식별자 케이스: Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`
- side-effect 로직과의 경계: `src/lib/CLAUDE.md`
- 배럴 import 정책: `src/CLAUDE.md`
