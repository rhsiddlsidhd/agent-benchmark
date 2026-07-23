# CLAUDE.md — src/client/lib/

> Last updated: 2026-07-23
> 서버 전용 외부 연동(bcrypt/cloudinary/cookies/jose/mongodb/nodemailer)은 `src/server/lib/CLAUDE.md` 참고 — 폴더명 컨벤션은 동일, 여기는 브라우저 전용/isomorphic 연동만 다룬다.

## Overview

외부 라이브러리·시스템 경계(side-effect 있는 연동) 중 브라우저에서만 도는 것 전담. 명명 컨벤션은 `src/server/lib/CLAUDE.md`의 "폴더명은 연동 대상 라이브러리/서비스명 그대로" 원칙을 그대로 따른다.

## Structure

```
src/client/lib/
├── kakao/
│   └── useKakaoLoader.ts     # 카카오맵 SDK 로더 훅 — 브라우저 전용
└── cn/
    ├── merge.ts               # cn() — clsx+tailwind-merge 조합, 실제 로직
    └── index.ts               # 배럴 — export * from "./merge"
```

## Critical Convention

- `kakao/`는 `src/server/lib/CLAUDE.md`의 기본 원칙("그 라이브러리 자체의 이름")을 그대로 따른다 — 카카오맵 SDK를 감싸므로 `kakao`.
- `cn/`은 예외다 — 라이브러리가 하나가 아니라 둘(`clsx`+`tailwind-merge`)이라 어느 한쪽 이름만 쓰면 왜곡돼서, 이 조합 패턴 자체의 업계 통용 이름(`cn`)을 개념명으로 쓴다.
- 새 외부 연동을 기존 폴더에 얹지 않는다 — 폴더 1개당 연동 대상 1개.
- 이 서브트리에 서버 전용 연동을 추가하지 않는다 — `next/headers`/DB 드라이버 등은 `src/server/lib/`.

## Gotchas

- 없음.

## 관련 문서

- 서버 전용 연동: `src/server/lib/CLAUDE.md`
- 외부 SDK 초기화 훅 배치 경계: `src/CLAUDE.md`
- 배치 경계 상대측: `src/client/hooks/CLAUDE.md`
- server/client/shared 3분할 배경: `docs/ARCHITECTURE.md`
