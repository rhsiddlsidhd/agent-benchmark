# CLAUDE.md — src/services/

> Last updated: 2026-07-18
> 이 폴더는 Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md` 소관 밖(프로젝트 고유 선택) — 서버 전용 비즈니스 로직 레이어.

## Scope

- **DB 접근 + 비즈니스 로직.** `src/models/`(스키마)와 `src/lib/`(외부 연동 wrapper)를 조합해 실제 유스케이스를 구현한다(예: `auth.service.ts`의 `getAuth`가 `lib/cookies`+`lib/jose`+`models/user.model`을 조합). 한 파일에 같은 도메인의 여러 관련 함수(조회/생성/로그아웃 등)를 같이 둘 수 있다 — film-wiki식 "파일당 export 1개" 원칙은 여기 적용 안 함.

## Structure

```
src/services/
├── index.ts               # 배럴 — export *
├── auth.service.ts        # getUser, getAuth, requireAuth, logoutService
├── user.service.ts
├── product.service.ts
└── ...                       # 도메인당 파일 1개(내부에 관련 함수 여러 개 허용)
```

## Critical Convention

- 파일명은 `{도메인}.service.ts`로 고정한다.
- DB 쿼리 전에 `dbConnect()`를 호출한다(`src/lib/mongodb/index.ts`).
- Mongoose Document를 그대로 반환하지 않는다 — `.lean()` 또는 `.toJSON()`으로 변환한 뒤 반환한다(트레이드오프는 `doc.md` 참고).

## Gotchas

- 2026-07-22, `index.ts` 배럴 추가(소비처 56곳 전환). hook/JSX 없는 순수 로직 레이어라 배럴화 안전 — `next build`로 검증.
- `doc.md` — 코드 아니라 "`.lean()` vs `.toJSON()` 트레이드오프 가이드" 문서가 이 폴더에 있음. 새 service 함수 작성 전에 이 문서부터 읽는다 — 두 방식이 프로젝트 안에 실제로 혼재하므로(`getPremiumFeatureServiceWithLean` 예시가 문서 안에 있음) 아무거나 복붙하지 않는다.
- `requireAuth()`는 `getAuth()`를 감싸서 세션 없으면 `HTTPError(401)`을 throw하는 얇은 헬퍼다 — 인증이 필수인 Route Handler는 Bearer 헤더를 직접 파싱하지 않고 이 함수를 호출한다(`src/app/api/CLAUDE.md` Gotchas 참고).

## 관련 문서

- DB 스키마: `src/models/CLAUDE.md`
- 외부 연동 wrapper: `src/lib/CLAUDE.md`
- 이 서비스를 호출하는 쪽: `src/app/api/CLAUDE.md`, `src/actions/CLAUDE.md`
