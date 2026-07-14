---
name: script-impl
description: HTTP로 노출되지 않는 스크립트/배치 흐름 구현(크롤러, 배치 작업, 주기적 데이터 수집 등). 언어 무관 — path에 진입해 requirements.txt/package.json 등을 확인해 언어를 스스로 판단하고, 그 언어의 references/ 문서를 따라 구현한다. "크롤러 구현", "배치 스크립트 작성", "주기적 수집 작업" 등 요청 시 트리거. API 계약 작성 작업엔 사용 금지(write-api-spec 소관), HTTP로 노출되는 서비스 구현엔 사용 금지(api-impl 소관).
---

# script-impl

backend agent가 진입한 경로가 HTTP 미노출(스크립트/배치 전용)이라고 CLAUDE.md Convention으로 선언했을 때 사용하는 구현 절차. 언어별 세부 절차는 `references/`로 분리돼있다 — 이 스킬 자체는 언어를 모른다.

## Input
- `path`: 구현 대상 물리적 경로 (필수)
- `target`: 구현 대상 도메인 식별자 (필수)

## 절차 (불변)

1. **언어 확인** — `path`에서 `requirements.txt`(Python) 또는 `package.json`(Node/TypeScript) 존재 여부를 확인한다. 둘 다 없으면 추측하지 않고 사용자 확인 요청
2. **해당 언어의 reference 로드** — `references/python.md` 또는 `references/typescript.md`를 읽고, 그 문서에 고정된 절차를 그대로 따른다(재정의 금지)

## 금지
- 언어 확인 없이 절차 시작(1단계 생략 금지)
- controller/route 레이어 작성(이 흐름은 HTTP 미노출 대상 전용 — 필요하면 `api-impl` 사용)
- 타입 없이 loose dict/Any로 데이터 주고받기(언어 공통 원칙, 세부는 references/ 참고)
