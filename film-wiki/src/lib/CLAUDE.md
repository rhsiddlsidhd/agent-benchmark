# src/lib

> Last updated: 2026-07-08

외부 서비스/라이브러리 연동 공용 코드 — 도메인 로직·UI 렌더링은 여기서 하지 않고 호출부 책임으로 남긴다.

## Structure

`src/lib/{외부라이브러리}/{파일명}.ts` — 라이브러리 1개당 폴더 1개.

```
src/lib/
├── tmdb/
│   ├── client.ts   # TMDB fetch 함수 전체 (server-only)
│   ├── errors.ts    # 에러 클래스 + 타입가드
│   ├── images.ts     # 이미지 URL 빌더
│   └── types/          # TMDB 응답 타입 — 타입 1개당 파일 1개(아래 규칙)
│       ├── index.ts      # 배럴, 모든 타입은 여기서 재export
│       ├── Movie.ts
│       └── ...             # Genre.ts / MovieDetail.ts / Review.ts / ...
├── framer-motion/
│   └── preset.ts
└── ...               # 라이브러리 추가 시 폴더 추가
```

## Critical Conventions
- 파일명/export 식별자 케이스는 `src/CLAUDE.md`의 공통 규칙을 따른다.
- 파일명에 라이브러리명을 그대로 쓰지 않는다(`motion.ts` 금지) — 역할(role) 명사로 짓는다(`framer-motion/preset.ts`). 컴포넌트/훅은 예외로 CLAUDE.md 아티팩트별 케이스를 따른다.
- 외부 API 응답 타입처럼 `interface`/`type` export가 여러 개면 한 파일에 몰아넣지 않는다 — `{외부라이브러리}/types/{TypeName}.ts`로 타입 1개당 파일 1개, "타입/인터페이스=PascalCase" 규칙(`src/CLAUDE.md`)을 그대로 따른다. 이 예외는 `types/` 하위에만 적용되고, `client.ts`(함수 모음)·`errors.ts`(에러 클래스+가드) 등 lib의 다른 파일에는 "파일당 export 1개" 원칙을 강제하지 않는다.
- `{외부라이브러리}/types/`는 `index.ts` 배럴로 재export한다 — 소비 측은 개별 파일이 아니라 `{외부라이브러리}/types`(배럴) 경로로 import한다(`src/utils`/`src/hooks` 배럴 규칙과 동일).

## Gotchas
- `tmdb/client.ts`는 클라이언트 컴포넌트에서 import 불가(`server-only`) — `tmdb/images.ts`는 예외.
- 404는 상세 루트 리소스만 `null` 변환, 하위 리소스(credits 등)는 그대로 throw.
