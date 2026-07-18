# CLAUDE.md — src/data/

> Last updated: 2026-07-18
> 이 폴더는 Global `~/.claude/docs/FRONTEND_FILE_CONVENTIONS.md` 소관 밖(프로젝트 고유 선택) — 정적 콘텐츠 데이터(static content data) 레이어.

## Scope

- **정적 콘텐츠 데이터(static content data)** — 랜딩/마케팅 페이지 카피(CTA 문구, 공지 배너, 프로모션 카드 등)를 코드와 분리해 담는, 파일 기반의 경량 CMS 역할. `src/constants/`(타입 있는 로직용 상수, 룩업 헬퍼 포함)와 다르다 — 여기는 로직 없이 "화면에 그대로 뿌려질 콘텐츠 원문"만 담는다. 로직/타입가드가 필요해지면 `src/constants/`로 간다.
- mock/placeholder 데이터(실제로 안 쓰이거나 임시로 채워둔 것)는 콘텐츠 데이터와 다른 카테고리다 — 실제 사용 여부를 확인하지 않고 "정식 콘텐츠"로 오해해 계속 하드코딩된 채 방치하지 않는다(Gotchas 참고).

## Structure

```
src/data/
├── cta.json                  # 실사용 — StartActionCTA.tsx
├── announcement.json         # 실사용 — app/(main)/layout.tsx
├── promotions.json           # 실사용 — components/organisms/EcommerceHero.tsx
├── categories.json           # 미사용(Gotchas 참고)
├── featured-products.json    # 미사용, mock으로 보임(Gotchas 참고)
└── subway.ts                 # 유일하게 JSON이 아니라 TS(Gotchas 참고)
```

## Critical Convention

- 콘텐츠 데이터는 JSON으로 둔다 — TS 파일로 만들지 않는다(타입/로직이 필요해지면 그건 이미 `constants/` 소관이라는 신호).

## Gotchas

- `categories.json`, `featured-products.json` — 코드 어디서도 import 안 됨(grep 확인, 0곳). 특히 `featured-products.json`은 이미지가 4개 항목 전부 동일(`/assets/images/output.webp`)하고 가격/평점/리뷰수가 하드코딩돼있어 실제 Product 데이터 연동 전 placeholder로 만들어두고 방치된 것으로 보임 — 정식 콘텐츠 취급해서 계속 유지보수하지 않는다. 실제로 쓸 계획이면 연동 작업, 아니면 삭제 대상(둘 다 코드 리팩토링 범위라 지금은 안 건드림).
- `subway.ts`만 JSON이 아니라 TS 배열(`MOC_SUBWAY_STATIONS`)로 돼있음 — Critical Convention 위반. `subway.json`으로 옮기거나, 로직(타입가드 등)이 붙을 계획이면 애초에 `constants/`로 재배치 검토(코드 리팩토링은 추후 진행 예정).

## 관련 문서

- 타입 있는 로직용 상수와의 경계: `src/constants/CLAUDE.md`
