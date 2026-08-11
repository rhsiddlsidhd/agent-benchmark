# Scripts

실행 목적별 스크립트와 공개 진입점을 관리한다. 정책 판정은 `tdd-guard/core`에만 두고,
Hook과 CI는 공통 Guard 진입점을 호출한다.

| 경로 | 책임 | 공개 진입점 |
| --- | --- | --- |
| `ci/` | CI 전용 운영 도구 | `node scripts/ci/build.mjs` |
| `e2e/` | Playwright 애플리케이션 실행 환경 | `node scripts/e2e/server.mjs` |
| `test-scope/` | 테스트 소스 범위 계산과 CI unit shard 실행 | `node scripts/test-scope/unit-shards.mjs` |
| `tdd-guard/bin/` | npm·Hook·CI 공통 Guard 진입점 | `node scripts/tdd-guard/bin/guard.mjs` |
| `tdd-guard/adapters/` | Claude·Codex schema 변환 | Hook 전용 |
| `tdd-guard/core/` | 도구 독립적인 분류·proof·mutation 정책 | bin에서 호출 |
| `tdd-guard/__tests__/` | Guard 테스트와 임시 Git fixture | Vitest `guard` project |

`commands`, `reporters`, `schemas`는 실제로 분리할 구현이 생기기 전에는 만들지 않는다.
