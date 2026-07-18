# src/

> Last updated: 2026-07-19

## Scope

`src/` 바로 밑에 하위 폴더 없이 단독으로 있는 Next.js 특수 파일 전용 규칙. 하위 폴더(`app/`, `actions/`, `api/` 등)는 각자 CLAUDE.md 소관 — 여기서 다루지 않는다. `AGENTS.md`에 명시된 대로 이 프로젝트의 실제 설치 버전(Next.js 16, `node_modules/next/dist/docs/`) 기준으로 정의한다.

## Structure

```
src/
└── middleware.ts   # Next.js 16 기준 deprecated 파일명 — Critical Convention 참고
```

## Critical Convention

- Next.js 16 이상에서 새 요청 인터셉트 로직을 `middleware.ts`/`export function middleware`로 만들지 않는다 — 공식 문서: `middleware` 파일 컨벤션은 v16.0.0부터 deprecated고 `proxy.ts`/`export function proxy`(또는 default export)로 개명됐다. 기존 `middleware.ts`는 공식 codemod(`npx @next/codemod@canary middleware-to-proxy .`)로 마이그레이션 대상이다.
- Server Action의 인증/권한 검증을 Proxy(옛 Middleware)에 위임하지 않는다 — 이유가 두 겹이다: (1) 공식 문서상 Server Function은 별도 라우트가 아니라 호출된 페이지로 가는 POST 요청이라, matcher가 그 경로를 제외하면 Proxy가 조용히 건너뛴다. (2) 렌더링 시점 접근 제어(인증된 페이지에만 폼을 렌더링하는 것)는 애초에 보안 경계가 아니다 — UI를 거치지 않고도 동일 오리진에서 같은 POST 요청을 직접 보낼 수 있다. 두 이유 모두 각 Server Action 내부에서 세션/역할을 반드시 재검증해야 하는 근거다.
- matcher 없이 Proxy를 배포하지 않는다 — 공식 문서: matcher가 없으면 정적 파일(`_next/static`)·이미지 최적화(`_next/image`)·`public/` 자산까지 모든 요청에서 실행돼, 의도치 않게 CSS/JS/이미지 로딩을 막을 수 있다.
- Proxy 안에서 느린 데이터 페칭(외부 API 호출 등)을 하지 않는다 — 공식 문서: Proxy는 느린 데이터 페칭 용도가 아니며, 세션 관리·인가의 전체 솔루션으로 쓰여서도 안 된다(낙관적 체크 용도로만).
- 프로젝트당 두 번째 proxy/middleware 파일을 만들지 않는다 — 공식 문서: 프로젝트당 `proxy.ts` 단 하나만 지원한다. 로직을 나누고 싶으면 별도 모듈로 쪼갠 뒤 그 안에서 import해서 조립한다.

## Gotchas

- 지금 `src/middleware.ts`의 matcher는 `/api/*`를 포함하지 않는다 — Route Handler(`src/app/api/`)는 Proxy 보호 대상이 아니며, 각 route.ts가 Bearer 토큰 검사를 개별적으로 반복 중이다(현재로선 이게 유일한 방어선).
- Next.js 16에서 Proxy 기본 런타임은 Node.js다(과거 Edge 런타임 기본에서 변경) — Proxy 파일에 `runtime` config 옵션을 쓰면 에러가 난다.

## 관련 문서

- Server Action 인증 규칙이 적용되는 대상: `src/actions/CLAUDE.md`
