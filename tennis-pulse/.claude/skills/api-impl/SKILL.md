---
name: api-impl
description: HTTP로 노출되는 서비스(API 엔드포인트) 구현. 언어 무관 — path에 진입해 requirements.txt/package.json 등을 확인해 언어를 스스로 판단하고, 그 언어의 references/ 문서를 따라 구현한다. "API 엔드포인트 구현", "서버리스 함수 구현" 등 요청 시 트리거. 계약(API 명세) 없이 시작 금지 — 먼저 write-api-spec으로 계약 확정 필요. HTTP로 노출 안 되는 스크립트/배치 작업 구현엔 사용 금지(script-impl 소관).
---

# api-impl

backend agent가 진입한 경로가 HTTP로 노출되는 서비스라고 CLAUDE.md Convention/Layer 성격으로 선언했을 때 사용하는 구현 절차. 언어별 세부 절차는 `references/`로 분리돼있다 — 이 스킬 자체는 언어를 모른다.

## Input
- `path`: 구현 대상 물리적 경로 (필수)
- `target`: 구현 대상 도메인/엔드포인트 식별자 (필수)
- `spec_path`: 참조할 API 계약 문서 경로(계약변경 있었던 경우 필수, 없으면 기존 계약 그대로 재사용)

## 절차 (불변)

1. **언어 확인** — `path`에서 `requirements.txt`(Python) 또는 `package.json`(Node/TypeScript) 존재 여부를 확인한다. 둘 다 없으면 추측하지 않고 사용자 확인 요청
2. **해당 언어의 reference 로드** — `references/python.md` 또는 `references/typescript.md`를 읽고, 그 문서에 고정된 절차를 그대로 따른다(재정의 금지)

## 금지
- 계약 없이 impl 시작(먼저 write-api-spec 스킬로 계약 확정)
- 언어 확인 없이 절차 시작(1단계 생략 금지)
- 타입 대신 `any`/loose type 사용(세부는 references/ 참고)
- 키/시크릿 하드코딩(env var 이름만 참조)
