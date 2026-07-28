# src/

> Last updated: 2026-07-28

## Overview

앱 코드 루트 — 폴더 횡단 컨벤션(배럴 import, 상태관리 계층) 전담.

## Key Files

| File       | Purpose                                                                                             |
| ---------- | --------------------------------------------------------------------------------------------------- |
| `proxy.ts` | 인증/권한 기반 라우트 접근 제어(로그인 필요 경로, 어드민 role 체크, 로그인 유저의 auth 페이지 차단) |

## Critical Convention

- Server Action의 인증/권한 검증을 Proxy에 위임하지 않는다 — 렌더링 시점 접근 제어는 애초에 보안 경계가 아니다(UI 없이 동일 오리진에서 같은 POST 요청을 직접 보낼 수 있다), 그래서 각 Server Action 내부에서 세션/역할을 반드시 재검증한다.
- matcher 없이 Proxy를 배포하지 않는다 — 공식 문서: matcher가 없으면 정적 파일(`_next/static`)·이.미지 최적화(`_next/image`)·`public/` 자산까지 모든 요청에서 실행돼, 의도치 않게 CSS/JS/이미지 로딩을 막을 수 있다
- Proxy 안에서 느린 데이터 페칭(외부 API 호출 등)을 하지 않는다 — 공식 문서: Proxy는 느린 데이터 페칭 용도가 아니며, 세션 관리·인가의 전체 솔루션으로 쓰여서도 안 된다(낙관적 체크 용도로만).
- 프로젝트당 두 번째 proxy 파일을 만들지 않는다 — 공식 문서: 프로젝트당 `proxy.ts` 단 하나만 지원한다. 로직을 나누고 싶으면 별도 모듈로 쪼갠 뒤 그 안에서 import해서 조립한다.
- **`src/` 하위 폴더 안 파일은 개별 경로로 직접 import하지 않는다 — `index.ts` 배럴을 기본으로 두고 그 배럴을 통해서만 import한다. 배럴은 예외 없이 전부 `export * from "./x"`로만 구성한다. `src/` 안 파일도 `export default`를 쓰지 않는다 — 전부 named export로 짓는다.** 단, `src/app/`은 Next.js 공식 규약상 예외(라우트 파일 `export default` 강제, 배럴 구조 불가) — 상세는 `src/app/CLAUDE.md` 참고.
- 로컬 상태로 충분한 걸 곧바로 Context나 Zustand로 확장하지 않는다 — 클라이언트 상태 범위는 로컬 → Context API(`src/client/context/`) → Zustand(`src/client/store/`) 순으로만 넓힌다.
- 서버에서 온 데이터를 Context/Zustand로 직접 옮기지 않는다 — 캐싱·중복 호출 방지는 `useSWR`(주로 `src/client/hooks/`의 훅 안에서 Zustand 구독과 함께 조합)이 전담한다.
- **구현체 하나가 2곳 이상의 구체적 소비처에서 쓰이면, 이름에 그 소비처 중 하나를 특정하지 않는다** — 특정하면 그 이름이 다른 소비처 입장에선 의미가 맞지 않게 된다.
- **식별자 케이스**: 타입/인터페이스는 PascalCase, 함수/변수는 camelCase다. `export const`의 값을 재귀적으로 뜯어봤을 때 문자열/숫자/불리언 리터럴(또는 그 배열/lookup map)로만 이루어져 있으면 SCREAMING_SNAKE_CASE로 export한다 — 단일 값이든 여러 값 나열이든 키→리터럴 값 lookup map이든 "값이 끝까지 리터럴이냐"가 기준이다. 값 안에 함수·컴포넌트 참조·이종 필드 객체가 하나라도 섞이면 camelCase다. **위치가 `constants/`든 파일 내부 로컬이든 무관하게 적용한다** — 컴포넌트/훅 안 로컬 상수도 대상이다.
- 같은 아티팩트 타입끼리 파일명 케이스가 겹치지 않게 짓는다 — 파일명만 보고 컴포넌트인지 훅인지 유틸인지 구분할 수 있어야 한다.
- `{목적}` 기반 파일(도메인 무관 범용 카테고리 — `utils/`, `constants/{목적}.ts`, `hooks/use{목적}.ts`, `services/{목적}.service.ts`, `schemas/{목적}.schema.ts` 등)에는 도메인/라우트가 드러나는 이름을 쓰지 않는다 — 이름이 도메인에 종속되면 재사용 가능 범위를 파일명만으로 오판하게 된다(예: `postsFormatter.ts` 금지).

## Gotchas

- 지금 `src/proxy.ts`의 matcher는 `/api/*`를 포함하지 않는다 — Route Handler(`src/app/api/`)는 Proxy 보호 대상이 아니다. 인증 필요한 route.ts는 각자 `getAuth()`/`requireAuth()`(쿠키 기반)를 호출해 재검증하는 게 유일한 방어선이다 — Bearer 헤더 검사는 프로젝트 어디에도 없다(과거엔 있었으나 쿠키 기반으로 전환 완료, 이 줄이 그 흔적으로 낡아있었다).
- Server Function(Server Action)은 별도 라우트가 아니라 호출된 페이지로 가는 POST 요청이다 — matcher가 그 경로를 제외하면 Proxy가 조용히 건너뛰어, Proxy가 막아준다고 착각하기 쉽다.
- Next.js 16에서 Proxy 기본 런타임은 Node.js다(과거 Edge 런타임 기본에서 변경) — Proxy 파일에 `runtime` config 옵션을 쓰면 에러가 난다.

## References

즉시 로드(`@import`) 아님 — 트리거 열 키워드에 해당하는 작업일 때만 해당 문서를 읽는다.

| 문서                     | 위치    | 트리거                                                                       | 요약                                                     |
| ------------------------ | ------- | ----------------------------------------------------------------------------- | -------------------------------------------------------- |
| `DATA_ACCESS.md`         | `docs/` | 데이터 접근 경로 선택, Server Component/Server Action/route.ts 분기           | 데이터 접근 경로 3분기표                                  |
| `ERROR_HANDLING.md`      | `docs/` | 에러 처리 로직, services/actions/route/client 레이어 횡단                     | 에러 흐름·채널 분리·분류표·레이어별 규칙 index            |
| `PAGE_ACCESS_CONTROL.md` | `docs/` | 인증/인가, 접근 제어, Proxy, page.tsx, token 쿠키, access/refresh 토큰 설계    | 3단계 접근 제어 설계 + 인증 토큰 아키텍처                 |
| `TESTING_GUIDELINE.md`   | `docs/` | vitest 테스트 작성/수정                                                       | DB/목킹 전략, assertion 패턴, 파일 배치 컨벤션            |
