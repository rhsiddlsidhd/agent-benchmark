# CLAUDE.md — src/utils/

> Last updated: 2026-07-18

## Scope

- **외부 시스템/전역 상태를 건드리지 않는 함수, 도메인 무관.** 여기서 "side-effect 없음"은 자기 클로저 밖(DB/네트워크/파일시스템/외부 npm 패키지·전역 공유 상태)을 안 건드린다는 뜻이지, 내부 상태가 전혀 없어야 한다는 뜻이 아니다 — 예: debounce/throttle처럼 자기 클로저 안에서만 mutate되는 타이머 변수는 바깥에 안 새어나가므로 순수한 것으로 취급해 여기 둔다. 외부 I/O·설정/시크릿 참조·외부 npm 패키지 의존이 있는 로직은 여기 두지 않는다(`src/lib/` 소관, `src/lib/CLAUDE.md` 참고).

## Structure

```
src/utils/
├── index.ts        # 배럴(향후 지향점, 아직 없음 — Gotchas 참고)
├── date.ts        # 날짜 포맷/카운트다운 계산
├── price.ts         # 가격 포맷/계산
├── category.ts        # 카테고리 룩업/타입가드
└── ...                   # 목적당 파일 1개
```

## Critical Convention

- 파일명은 kebab-case, 목적명(기능/역할 기반 이름, 도메인명과 대비)으로 짓는다.
- DB 연결, 외부 API 호출, 파일시스템 접근 등 side-effect가 있는 로직을 여기 두지 않는다 — `src/lib/`로 옮긴다.
- 개별 파일을 직접 import하지 않는다 — `index.ts` 배럴을 통해서만 import한다(향후 지향점, 현재 미적용 — Gotchas 참고).

## Gotchas

- `imageProcessor.ts`, `openApp.ts` — camelCase로 돼있어 kebab-case 규칙 위반. 리네임 대상: `image-processor.ts`, `open-app.ts`(코드 리팩토링은 추후 진행 예정).
- `mongodb.ts`(`dbConnect`, `isConnected`)는 DB 커넥션을 관리하는 side-effect 로직이라 Scope 정의상 `src/lib/`에 있어야 한다 — 현재 위치는 구조적 오분류. 리팩토링 시 `src/lib/mongodb/` 등으로 이동 검토.
- `utils/error.ts`와 `types/error.ts`가 동명 — import 경로 착각 주의(전자는 API 에러 상태에서 필드 에러 추출하는 헬퍼, 후자는 에러 응답 타입 정의).
- `index.ts` 배럴이 아직 없음 — 지금은 전부 개별 파일 직접 import. 배럴 도입은 향후 지향점이고, 기존 import 전체를 바꾸는 리팩토링은 별도로 진행 예정.

## 관련 문서

- 파일명/식별자 케이스: Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`
- side-effect 로직과의 경계: `src/lib/CLAUDE.md`
