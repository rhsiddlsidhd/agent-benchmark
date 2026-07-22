# CLAUDE.md — src/data/

> Last updated: 2026-07-18
> 이 폴더는 프로젝트 고유 선택 — 정적 콘텐츠 데이터(static content data) 레이어.

## Overview

`data/`는 정적 콘텐츠 데이터(static content data)를 모아둔다 — 랜딩/마케팅 페이지 카피(CTA 문구, 공지 배너, 프로모션 카드 등)를 코드와 분리해 담는, 파일 기반의 경량 CMS 역할. `src/constants/`(타입 있는 로직용 상수, 룩업 헬퍼 포함)와 다르다 — 여기는 로직 없이 "화면에 그대로 뿌려질 콘텐츠 원문"만 담는다. 로직/타입가드가 필요해지면 `src/constants/`로 간다.

mock/placeholder 데이터(실제로 안 쓰이거나 임시로 채워둔 것)는 콘텐츠 데이터와 다른 카테고리다 — 실제 사용 여부를 확인하지 않고 "정식 콘텐츠"로 오해해 계속 하드코딩된 채 방치하지 않는다(Gotchas 참고).

## Structure

```
src/data/
├── cta.json                  # 실사용 — StartActionCTA.tsx
├── announcement.json         # 실사용 — app/(main)/layout.tsx
├── promotions.json           # 실사용 — components/organisms/EcommerceHero.tsx
└── subway.json                # 실사용 — BasicInfoSection.tsx, app/api/subway/route.ts
```

## Critical Convention

- 콘텐츠 데이터는 JSON으로 둔다 — TS 파일로 만들지 않는다(타입/로직이 필요해지면 그건 이미 `constants/` 소관이라는 신호).

## Gotchas

- 없음.

## 관련 문서

- 타입 있는 로직용 상수와의 경계: `src/constants/CLAUDE.md`
