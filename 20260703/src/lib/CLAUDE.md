# src/lib

> Last updated: 2026-07-08

외부 서비스/라이브러리 연동 공용 코드 — 도메인 로직·UI 렌더링은 여기서 하지 않고 호출부 책임으로 남긴다.

## Structure

`src/lib/{외부라이브러리}/{파일명}.ts` — 라이브러리 1개당 폴더 1개.

```
src/lib/
├── tmdb/
│   ├── client.ts   # TMDB fetch 함수 전체 (server-only)
│   └── ...          # errors.ts / types.ts / images.ts
├── framer-motion/
│   └── preset.ts
└── ...               # 라이브러리 추가 시 폴더 추가
```

## Critical Conventions
- 파일명/export 식별자 케이스는 `AGENTS.md`의 "네이밍 컨벤션" 섹션을 따른다.
- 파일명에 라이브러리명을 그대로 쓰지 않는다(`motion.ts` 금지) — 역할(role) 명사로 짓는다(`framer-motion/preset.ts`). 컴포넌트/훅은 예외로 AGENTS.md 아티팩트별 케이스를 따른다.

## Gotchas
- `tmdb/client.ts`는 클라이언트 컴포넌트에서 import 불가(`server-only`) — `tmdb/images.ts`는 예외.
- 404는 상세 루트 리소스만 `null` 변환, 하위 리소스(credits 등)는 그대로 throw.
