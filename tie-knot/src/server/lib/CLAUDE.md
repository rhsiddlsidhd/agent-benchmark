# CLAUDE.md — src/server/lib/

> Last updated: 2026-07-23
> 서버 전용 외부 연동만 다룬다 — 브라우저 전용 연동(`kakao`)과 조합 유틸(`cn`)은 `src/client/lib/CLAUDE.md` 참고. 두 폴더는 물리적으로 분리됐을 뿐 폴더명/명명 컨벤션은 동일하다.

## Overview

외부 라이브러리·시스템 경계(side-effect 있는 연동) 중 클라이언트 번들에 절대 들어가면 안 되는 것 전담.

## Structure

```
src/server/lib/
├── bcrypt/
│   ├── hash.ts             # hashPassword, comparePasswords — 실제 로직
│   └── index.ts             # 배럴 — export * from "./hash"
├── cloudinary/
│   ├── upload.ts            # 업로드 함수 — 실제 로직
│   ├── type.ts               # 응답 타입
│   └── index.ts               # 배럴 — export * from "./upload"
├── cookies/
├── jose/
├── mongodb/
└── nodemailer/                # 폴더 1개 = 연동 대상 1개, 파일 개수 무관하게 index.ts는 항상 배럴
```

## Critical Convention

- **폴더명은 연동 대상 라이브러리/서비스명 그대로 쓴다**(`{외부서비스}/{역할}` 2단계 구조 — "개념명"이 아니라 "그 라이브러리 자체의 이름"이 원칙). `bcrypt`/`cloudinary`/`jose`가 이 원칙을 따른다 — JWT를 감싸는 폴더는 실제로 `jose` 패키지를 쓰므로 `token`이 아니라 `jose`, 이메일 발송은 `nodemailer` 패키지를 쓰므로 `email`이 아니라 `nodemailer`. **예외는 `cookies/` 하나뿐이다**: 감싸는 대상이 설치형 npm 패키지가 아니라 Next.js 프레임워크 내장 API(`next/headers`의 `cookies()`)라서 "그 라이브러리 이름"에 대응하는 게 없다(`next`라고 하면 프레임워크 전체를 가리키는 셈이라 범위가 안 맞음) — 이 경우 개념명(`cookies`)을 그대로 쓴다.
- 새 외부 연동을 기존 폴더에 얹지 않는다 — 폴더 1개당 연동 대상 1개. 파일명에 폴더명(서비스명)을 반복하지 않는다.
- 이 서브트리에 브라우저 전용 연동을 추가하지 않는다 — `next/headers`/DB 드라이버 등 서버에서만 도는 것만 둔다. 브라우저 전용 연동은 `src/client/lib/`.

## Gotchas

- 없음.

## 관련 문서

- 식별자 케이스 공통 규칙: `src/CLAUDE.md`
- 순수 함수와의 경계: `src/shared/utils/CLAUDE.md`
- 클라이언트 전용 연동(kakao)/조합 유틸(cn): `src/client/lib/CLAUDE.md`
- server/client/shared 3분할 배경: `docs/ARCHITECTURE.md`
