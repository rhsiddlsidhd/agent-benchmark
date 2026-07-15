# CLAUDE.md — tennis-pulse

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Git 전략의 범용 원칙(prefix taxonomy, 자동배포 브랜치 직접 push 금지 등)은 Global CLAUDE.md(`~/.claude/CLAUDE.md`, `~/.claude/docs/GIT.md`)에 있음. 이 프로젝트는 `main`이 Vercel 자동배포 대상이라, 그 원칙의 구체 구현으로 `dev`를 스테이징 브랜치로 둔다 — 브랜치 흐름: `<prefix>/*` → `dev` → `main`. `main`은 GitHub 브랜치 보호(ruleset `protect-main`)로 PR 없는 직접 push가 차단됨.

## Commands

전부 `frontend/` 또는 `backend/`에서 실행 — 루트엔 `package.json`이 없다.

**frontend/** (React 19 + Vite, Node/TS)
```bash
npm install          # 최초 1회
npm run dev           # Vite 개발 서버
npm run build          # tsc -b (app/node/api 3개 tsconfig 참조 전부 타입체크) && vite build
npm run lint            # oxlint
npm run preview          # 빌드 결과 로컬 프리뷰
```
- 단일 파일/참조만 타입체크하려면 `npx tsc -p tsconfig.app.json --noEmit` (또는 `tsconfig.api.json`)처럼 개별 프로젝트를 지정한다.
- 테스트 러너는 구성돼 있지 않다.

**backend/** (Python 3.10, 크롤러 — 배치/수동 실행 전용, HTTP로 노출 안 됨)
```bash
source .venv/bin/activate   # 기존 venv 사용, 또는 python -m venv .venv 로 새로 생성
pip install -r requirements.txt
python main.py               # SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요 (.env, .env.example 참조)
```
- 테스트 러너/린터는 구성돼 있지 않다.

## Architecture

모노레포(`backend/` + `frontend/`), 데이터 접근은 전부 Vercel 서버리스 함수(`frontend/api/`) 경유로 통일한다. 배경/결정 근거는 `docs/00_PRD.md`·`docs/01_ARCHITECTURE.md`·`docs/02_ADR.md` 참고.

```
backend/ (Python, 배치 크롤러 — 상시 배포 안 됨)
  crawler/service.py  ─UPSERT─▶  Supabase(posts, idxno PK)

frontend/ (Vercel 배포 루트)
  src/  (React SPA, 클라이언트)
    hooks/use{도메인}.ts  ──fetch──▶  same-origin /api/*
    components/{도메인}/   (Recharts)
    services/{도메인}.ts   ← ⚠ 서버 시크릿 참조, 클라이언트 코드에서 import 금지(tsconfig.app.json이 exclude)
    types/{도메인}.ts      (계약 타입 + zod 검증)
  api/  (Vercel Serverless Functions, 파일기반 라우팅 /api/{도메인})
    posts.ts / naver-trend.ts / summary.ts  → src/services/*, src/types/* 를 import
      ├─ /api/posts        ─▶ Supabase(posts) 전체 조회
      ├─ /api/naver-trend   ─▶ 네이버 데이터랩 프록시
      └─ /api/summary        ─▶ Supabase(date+title only, posts와 service 공유) + OpenAI 요약
```

- **계약 우선(contract-first)**: 엔드포인트 구현 전 `docs/api/{도메인}.md`에 계약(파라미터/응답타입/에러shape)을 먼저 확정한다. 각 레이어 세부 컨벤션은 계층별 `CLAUDE.md`(`backend/CLAUDE.md`, `frontend/src/CLAUDE.md`, `frontend/api/CLAUDE.md`)에 있다.
- **tennispeople.kr 크롤러 파싱**: 목록 HTML의 `<td>`가 정상적으로 닫히지 않아 DOM 트리 파싱이 실패함 — `<font color="#333333">` 라벨과 값 포맷을 순서 앵커링하는 정규식으로 파싱한다. 상단 고정 공지는 페이지 무관하게 항상 재노출되므로 "일반 게시글 0개"를 목록 종료 기준으로 삼는다 (`backend/crawler/service.py` 참고).
- **인증 없음**: 모든 API는 공개 read-only. 네이버/Supabase(service role)/OpenAI 크레덴셜은 서버리스 함수 런타임에서만 읽는다 — `VITE_` 접두사 env var는 클라이언트 번들에 노출되므로 사용 금지.

## 하네스: tennis-pulse 개발 오케스트레이션

**목표:** backend·frontend 기능 요청을 intake→planner→api-spec→backend/frontend→qa 6개 에이전트로 도메인 단위 게이팅하며 계약 어긋남 없이 완료한다.

**트리거:** backend/frontend/api 어디든 손대는 기능 추가·수정·버그수정 요청 시 `tennis-pulse-orchestrator` 스킬을 사용하라. 단순 질문(코드 설명, 파일 조회 등)은 직접 응답 가능.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-07-13 | 초기 구성 (5에이전트 + 4스킬 + 오케스트레이터) | 전체 | HARNESS.md 설계 검토 완료 후 최초 구축 |
| 2026-07-14 | intake 에이전트 추가(6에이전트 체제), `00_request.yaml`→`01_plan.yaml` 파이프라인 도입, `source_requests`를 `source_request_ids` 참조 방식으로 전환 | 전체 | 원본 요청의 모호함이 planner 이후 단계까지 전파되던 구멍 발견 — 명확화 전담 단계 분리 |
| 2026-07-14 | `01_plan.yaml`의 `language` 필드를 `path`(물리경로)로 대체 — planner가 Layer 성격/Convention 대조로 경로까지 결정, 언어는 backend agent가 진입 후 스스로 확인. `py-impl`/`ts-impl`(언어별)을 `script-impl`/`api-impl`(흐름별, 언어 무관)로 재구성 | planner.md, backend.md, frontend.md, SKILL.md, script-impl/, api-impl/ | 절차를 가르는 진짜 축은 언어가 아니라 흐름(스크립트/API)이라는 설계 오류 발견 — 언어는 각 흐름 내 문법 디테일로 재배치 |
| 2026-07-14 | API 계약 문서 경로(`spec_path`) 취득 방식을 "오케스트레이터가 네이밍 규칙으로 계산"에서 "api-spec agent가 완료보고에 실제 경로 명시 → 오케스트레이터가 그대로 기록"으로 변경. `frontend/src/CLAUDE.md`의 잘못된 대안 경로(`../api/docs`)도 제거해 `docs/api/*.md`로 통일 | planner.md, api-spec.md, SKILL.md, 01-plan-example.yaml, frontend/src/CLAUDE.md | 오케스트레이터가 경로를 추측하면 `output_path` 커스텀 지정 시 실제 파일과 어긋날 수 있음 — "판단 로직 없음" 원칙에도 위배 |
| 2026-07-14 | 루트 `HARNESS.md`와 `references/`(초안 자료) 삭제 — 전부 실제 `.claude/agents/`, `.claude/skills/`로 대체 완료. `SKILL.md`의 "외부설정 체크리스트 취합 규칙" 섹션도 삭제 — Vercel Root Directory 등 1회성 프로젝트 부트스트랩 항목은 오케스트레이터가 매 요청마다 추적할 일이 아니라 사용자가 사전에 처리하는 전제조건으로 재정의, Phase4의 기존 "외부설정 필요사항 취합" 한 줄로 충분 | HARNESS.md(삭제), references/(삭제), SKILL.md | 초안 참조 파일들이 실제 구현으로 완전 대체됨. 체크리스트 취합 규칙은 상태추적 장치까지 설계하다 과설계로 판단해 축소 |
| 2026-07-14 | worktree 격리 전략 도입 — 격리 단위는 domain(팀모드 `type_source`가 파일 경로 참조라 phase 단위로 쪼개면 깨짐), domain이 2개 이상일 때만 생성, 브랜치명은 새 prefix 발명 없이 작업 브랜치 접미사 결합(`{작업브랜치}-{domain}`), merge-back은 QA 통과 후에만 + 오케스트레이터가 순차 수행, 정리 트리거는 `docs/GIT_STRATEGY.md`의 "PR 머지 완료" 전제와 별개로 "로컬 merge-back 완료"임을 명시, Phase 0에 orphan worktree 체크 추가. Phase 1에 브랜치 준비 단계 추가 | SKILL.md | film-wiki `dev-orchestrator`의 worktree 전략 리뷰에서 발견된 두 문제(GIT_STRATEGY prefix 표에 없는 `worktree/` prefix 발명, PR-머지 전제인 정리 절차를 로컬 merge 직후 재사용하는 전제 불일치) 재발 방지 + 도메인 병렬 실행 시 격리 없이 같은 작업 디렉토리를 공유하던 구조 개선. 최초 설계였던 "작업 브랜치 하위 nest"(`{작업브랜치}/{domain}`)는 dry-run 중 git ref 충돌로 실패 확인돼(`refs/heads/{작업브랜치}`가 이미 리프로 존재하면 그 하위를 디렉토리로 못 씀) 접미사 결합으로 교정 |
| 2026-07-14 | worktree 전략 실라이브 검증(3도메인 실제 실행)에서 발견된 6개 결함 수정: (1) 레포 루트가 tennis-pulse 상위 모노레포라 agent 작업 디렉토리는 `{worktree}/tennis-pulse`여야 함 (2) `_workspace/`가 미커밋이라 worktree 안에 없어 `request_path`는 절대경로 필수 (3) `git worktree remove`는 심볼릭 링크 때문에 거의 항상 `--force` 필요 (4) merge 기본 커밋 메시지가 commit-msg 훅(prefix 검증)에 걸려 `-m` 명시 필수 (5) node_modules 심볼릭 링크가 `npm install` 중 끊겨 merge-back 후 메인에서 재설치 필요 (6) merge 충돌을 전부 "planner 재실행"으로 처리하던 정책을 완화 — 공유 파일(App.tsx)에 각자 추가만 하는 기계적 충돌은 그 자리서 직접 해결(`docs/GIT_STRATEGY.md`의 "충돌 해결은 feat→dev 단계에서" 원칙과 합치), 의미적 충돌만 재계획 대상으로 좁힘 | SKILL.md | 문서만으로는 못 잡는 실제 git/npm/모노레포 동작 특성 — dry-run(장난감 repo)과 달리 실제 레포 구조(모노레포, 미커밋 workspace, 심볼릭 링크)에서만 드러남 |
| 2026-07-14 | Phase 4에 `.env.example` 생성 절차 추가 — 취합한 외부설정 키를 agent `path` 레이어 기준(`backend/` vs `frontend/`)으로 나눠 `{layer}/.env.example`에 반영, `frontend/.env.example`엔 "서버 전용, VITE_ 금지" 주석 고정. 전역 `.env*` 차단 훅(`~/.claude/settings.json` PreToolUse)에 `.env.example` 예외 추가(실제 시크릿 파일은 계속 차단) | SKILL.md, `~/.claude/settings.json`(전역, 프로젝트 외부) | 리포트 텍스트로만 남기던 외부설정 체크리스트를 실제 파일로 고정해 다음 세션/사람이 바로 참조 가능하게 함 |
