# CLAUDE.md — src/lib/

> Last updated: 2026-07-18

## Scope

- **외부 라이브러리/시스템 경계를 감싸는 코드** — 암호화(bcrypt), 이미지 업로드(cloudinary), 쿠키(cookies), 이메일(email), 카카오맵(kakao), JWT(token), 스키마 검증(validation). side-effect나 설정/시크릿 참조가 있으면 여기, 순수 함수면 `src/utils/` 소관.
- 폴더명은 연동 대상 단위 — `bcrypt`/`cloudinary`/`kakao`는 라이브러리명 그대로, `cookies`/`email`/`token`/`validation`은 그 라이브러리를 감싸는 개념명(내부적으로 각각 `next/headers`, `nodemailer`, JWT 인코딩, `zod` 사용).

## Structure

```
src/lib/
├── bcrypt/
│   └── index.ts          # hashPassword, comparePasswords
├── cloudinary/
│   ├── config.ts          # SDK 초기화
│   ├── index.ts            # 업로드 함수(배럴 아님 — 실제 로직)
│   └── type.ts              # 응답 타입
├── cookies/
│   ├── get.ts / set.ts / delete.ts   # 역할별 파일 분리
│   └── type.ts
├── email/
│   ├── index.ts           # 배럴 — export * from "./nodemalier"
│   └── nodemalier.ts       # 실제 구현
├── kakao/
│   └── useKakaoLoader.ts  # 카카오맵 SDK 초기화 훅
├── token/
│   ├── config.ts / encrypt.ts / decrypt.ts / type.ts
│   └── index.ts            # 배럴 — export * from "./encrypt" 등
├── validation/
│   └── validateAndFlatten.ts
└── utils.ts                 # shadcn cn() 헬퍼 — 유일한 flat 파일(예외)
```

## Critical Convention

- 새 외부 연동을 기존 폴더에 얹지 않는다 — 폴더 1개당 연동 대상 1개(Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`의 lib 2단계 구조). 파일명에 폴더명(서비스명)을 반복하지 않는다.
- 카카오맵처럼 특정 외부 SDK 초기화 전용 훅은 `src/hooks/`가 아니라 그 라이브러리 폴더에 둔다 — "훅이라는 형태"보다 "무엇을 감싸는가"가 배치 기준(`src/hooks/CLAUDE.md`와 짝).
- `src/lib/utils.ts`(shadcn 표준 `cn()` 헬퍼)는 폴더 없는 flat 파일 예외로 유지한다 — shadcn CLI가 이 경로로 자동 생성하는 관례라 임의로 폴더화하지 않는다.

## Gotchas

- `email/nodemalier.ts` — `nodemailer` 오타. 새 파일 추가 시 이 이름을 복사하지 않는다.
- `cloudinary/index.ts`는 `token`/`email`의 `index.ts`와 다르게 배럴이 아니라 실제 업로드 로직 파일이다 — 새 폴더 만들 때 이 예외를 따라하지 않는다(배럴이 기본 패턴).
- 폴더명이 전부 kebab-case로 우연히 일치하지만(단어 하나짜리라) 실제로는 "라이브러리명 그대로" vs "개념명" 두 성격이 섞여 있다 — 새 폴더 이름 정할 때 어느 쪽인지 먼저 판단한다.

## 관련 문서

- 파일명/식별자 케이스 일반 규칙: Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md`
- 순수 함수와의 경계: `src/utils/CLAUDE.md`
- 외부 SDK 초기화 훅과의 경계: `src/hooks/CLAUDE.md`
