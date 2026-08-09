# CLAUDE.md — src/test/

> Last updated: 2026-08-09

## Overview

여러 테스트 파일이 공유하는 지원 자산 전담 — 실행 인프라(`setup/`), DB 헬퍼(`db.ts`), 도메인 픽스처(`factories/`).

`server`/`client`/`shared`가 런타임 축이라면 이 폴더는 테스트타임 축이라 형제 레벨에 둔다. 내용물도 server 전용(`db.ts`, `factories/`, `setup/mongo-server.ts`)과 client 전용(`setup/jsdom-polyfill.ts`)이 섞여 있어 어느 한쪽 트리에 들어갈 수 없다.

## Structure

```
src/test/
├── index.ts        # 배럴 — db.ts + factories만 재수출(setup/ 제외)
├── db.ts           # clearCollections — 테스트가 직접 호출
├── setup/          # vitest.config.ts 전용 진입점
│   ├── mongo-server.ts    # globalSetup: mongod replSet 기동/종료
│   └── jsdom-polyfill.ts  # setupFiles: jsdom 미구현 API 대체
└── factories/      # 도메인당 파일 1개, src/server/models/와 1:1
    ├── index.ts
    └── {도메인}.factory.ts
```

## Critical Convention

- **이 폴더에 테스트 파일(`*.test.ts(x)`)을 두지 않는다** — 테스트는 대상 파일 옆에 colocate한다(`docs/TESTING_GUIDELINE.md`). 이 폴더는 지원 자산 전용이다.
- **`setup/` 하위는 `vitest.config.ts`에서만 참조하고 배럴(`index.ts`)에 넣지 않는다** — `jsdom-polyfill.ts`는 import되는 즉시 전역(`Element.prototype`, `globalThis.ResizeObserver` 등)을 변조하므로, 배럴에 실리면 `@/test`를 import하는 것만으로 node 환경 테스트까지 이 부수효과를 받는다.
- **jsdom 폴리필은 `jsdom-polyfill.ts`의 `if (typeof window !== "undefined")` 가드 안에 추가한다** — 가드 밖에 쓰면 `// @vitest-environment node`로 도는 service/action 테스트가 `Element is not defined`로 터진다.
- **팩토리는 순수 객체만 리턴하고 DB에 쓰지 않는다** — `Model.create()` 호출은 테스트가 직접 한다. 팩토리가 DB까지 건드리면 어떤 문서가 언제 저장됐는지가 테스트 본문에서 안 보인다.
- **팩토리 함수명은 `build{도메인}Input`으로 통일한다** — 리턴값이 저장된 문서가 아니라 `create()`에 넘길 입력 객체임을 이름이 말하게 한다.

## References

즉시 로드(`@import`) 아님 — 트리거 열 키워드에 해당하는 작업일 때만 해당 문서를 읽는다.

| 문서                   | 위치                 | 트리거                    | 요약                                            |
| ---------------------- | -------------------- | ------------------------- | ----------------------------------------------- |
| `TESTING_GUIDELINE.md` | `docs/`              | vitest 테스트 작성/수정 시 | 파일 배치·DB 전략·목킹 정책·assertion 패턴      |
| `CLAUDE.md`            | `src/server/models/` | 팩토리 추가/수정 시        | 팩토리가 대응하는 스키마 정의                   |
