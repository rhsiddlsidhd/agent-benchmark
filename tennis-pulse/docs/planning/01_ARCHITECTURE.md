# Architecture Document

> 상태: Draft
> 작성자:
> 작성일:
> 최종 수정일:
> 관련 문서: [00_PRD.md](./00_PRD.md)

---

## 필드 가이드

| 섹션 | 내용 |
|------|------|
| 개요 | 시스템이 무엇을 하는가 (한두 문단 요약) |
| 목표 및 제약 | 아키텍처가 만족해야 할 목표(성능/확장성/보안 등), 제약조건(기술 스택, 인프라, 팀 역량 등) |
| 시스템 컨텍스트 | 외부 시스템/서비스와의 관계 (C4 Context Level) |
| 전체 구조 | 주요 컴포넌트 및 책임 (C4 Container Level) |
| 모듈/서비스 상세 | 각 모듈/서비스의 책임 / 인터페이스 / 의존성 |
| 데이터 모델 | 주요 엔티티 및 관계 (ERD) |
| 배포 아키텍처 | 배포 환경, CI/CD 파이프라인 |
| 보안 고려사항 | 인증/인가, 데이터 보호, 취약점 대응 |
| 확장성 및 성능 | 병목 지점, 확장 전략 |
| 리스크 및 트레이드오프 | 주요 아키텍처 결정에 따른 트레이드오프 (상세 근거는 [02_ADR](./02_ADR.md) 참고) |

---

## 1. 개요 (Overview)

`tennis-pulse`는 테니스 관련 특정 주제의 검색량 추세(네이버 데이터랩)와 테니스피플(tennispeople.kr) 게시판 게시글 수 추이를 결합해 화제성을 시각화하는 대시보드 웹앱이다. 모노레포 구조(`backend`/`frontend`)이며, 데이터 접근은 전부 Vercel 서버리스 함수 경유로 통일한다.

## 2. 목표 및 제약 (Goals & Constraints)

**목표**
- 상시 서버 비용 없이 운영 (Vercel 무료 티어 우선)
- frontend가 DB/외부 API를 직접 호출하지 않고 서버리스 함수를 경유해 접근 경로를 일관되게 유지

**제약**
- 크롤러(Python)는 상시 서비스가 아니라 배치/수동 실행
- 네이버 데이터랩 API는 상대지수(0~100)만 제공, 절대 검색량이 아님
- Google Trends API(alpha)는 승인 대기 중이라 현재 사용 불가

## 3. 시스템 컨텍스트 (System Context)

```
외부 시스템:
- 네이버 데이터랩 검색어트렌드 API (검색량 상대지수)
- 테니스피플 (tennispeople.kr, bbs_19 게시판) — 크롤링 대상
- OpenAI API — 게시글 요약
- Supabase (Postgres) — 영속 저장
- Vercel — frontend 배포 + 서버리스 함수 3종 배포
```

## 4. 전체 구조 (High-Level Architecture)

```
frontend (React+Vite SPA)
  └─▶ Vercel Serverless Functions (Node/TS)
        ├─ /api/posts        ─▶ Supabase (Postgres)
        ├─ /api/naver-trend  ─▶ 네이버 데이터랩 API
        └─ /api/summary      ─▶ Supabase (service 공유) + OpenAI API

backend/ (Python 크롤러, 배치/수동 실행)
  └─▶ Supabase (Postgres) UPSERT
```

### 에러/엣지케이스 처리 정책

(TODO: 크롤링 실패/재시도, API rate limit 등 — TODO.md 원본에 미정의)

## 5. 모듈/서비스 상세 (Module/Service Details)

### 5.1 크롤러 (backend, Python)
- 책임: tennispeople.kr bbs_19 게시판 목록 페이지 순회 크롤링(약 366페이지, 요청당 1~2초 딜레이), idxno/제목/작성자/날짜/조회수 파싱, Supabase UPSERT
- 인터페이스: 초기엔 로컬 수동 실행 스크립트, 이후 증분 크롤링(최신 페이지부터 순회하다 기존 idxno 만나면 중단)
- 의존성: Supabase(Postgres)

### 5.2 /api/posts (서버리스 함수, Node/TS)
- 책임: Supabase `posts` 테이블 조회 후 frontend에 응답 — 게시글 분석 차트/리스트용, 원본 필드 전체 노출
- 인터페이스: HTTP
- 의존성: Supabase, service 레이어(posts 조회 로직을 `/api/summary`와 공유)

### 5.3 /api/naver-trend (서버리스 함수, Node/TS)
- 책임: 네이버 데이터랩 검색어트렌드 API 프록시 — client_secret 노출 방지
- 인터페이스: HTTP
- 의존성: 네이버 데이터랩 API

### 5.4 /api/summary (서버리스 함수, Node/TS)
- 책임: service 레이어로 Supabase에서 date+title만 select → OpenAI API 호출 → 요약 결과 반환
- 인터페이스: HTTP
- 의존성: Supabase(service 레이어 공유), OpenAI API

## 6. 데이터 모델 (Data Model)

`posts` 테이블 (초안, 최종 미확정): `idxno(PK)`, `title`, `author(nullable)`, `posted_at`, `views`, `created_at`

이는 논리적 계약(frontend가 기대할 필드)일 뿐이며, 정확한 타입/제약/인덱스 등 물리적 스키마는 backend 전문 에이전트가 harness 구축 후 실제 스크래핑 샘플 데이터를 검증하며 최종 결정한다.

## 7. 기술 스택 (Tech Stack)

| 영역 | 기술 | 선택 이유 |
|------|------|-----------|
| DB | Supabase (Postgres) | 집계 쿼리(GROUP BY, top N, 기간 필터) 필요 — Firebase(NoSQL)보다 적합 |
| 배포 | Vercel | frontend + 서버리스 함수 단일 플랫폼, 상시 서버 비용 회피 |
| 서버리스 함수 | Node/TS | OpenAI 호출은 단순 HTTP 요청이라 Python 이점 없음 (date+title 그대로 LLM 전달, 별도 형태소분석 전처리 없음) |
| 크롤러 | Python | (TODO.md 원본에 선택 이유 별도 명시 없음) |
| 차트 | Recharts | React 전용, 선언적 컴포넌트, 라인/바 차트 용도에 적합 |
| frontend | React (Vite) SPA | SEO/SSR 불필요, 데이터 접근은 서버리스 함수가 전담(Next.js API route 이점 못 살림) |
| LLM 요약 | OpenAI API | Claude Pro 구독 우회 스크립트 방식은 이용약관 위반 소지로 배제 |

## 8. 배포 아키텍처 (Deployment)

- 배포(코드 올림): frontend(React) + 서버리스 함수 3개(네이버 프록시, posts 조회, OpenAI 요약 프록시) → **Vercel 단일 플랫폼**
- 설정만(코드 없음): Supabase — 콘솔에서 프로젝트/테이블 생성, API 키 발급으로 끝
- FastAPI/Render 백엔드 서버는 제거 — `backend` 폴더엔 크롤러 스크립트(Python)만 남고 상시 배포 대상 아님
- 초기 실행: 로컬에서 수동으로 풀 크롤링 스크립트 실행 → Supabase에 채워넣기
- 주기적 스케줄링(cron/GitHub Actions 등) 실행 방식: 보류, 추후 결정

## 9. 보안 고려사항 (Security Considerations)

- 네이버 client_secret, OpenAI API 키는 서버리스 함수 경유로만 접근 — frontend 직접 호출 금지
- frontend가 Supabase를 직접 호출하지 않음 — 모든 데이터 접근을 서버리스 함수로 통일(secret 노출 여부와 무관하게 접근 경로 일관성 유지 목적)

## 10. 확장성 및 성능 (Scalability & Performance)

- 테니스피플 크롤링은 요청당 1~2초 딜레이로 부하 방지
- 최초 1회 풀 크롤링(366페이지) 이후 증분 크롤링(최신 페이지부터 순회하다 기존 idxno 만나면 중단)으로 이후 부하 최소화
- 네이버 데이터랩/OpenAI 서버리스 함수는 호출당 과금 — 무료 티어로 충분, 상시 유지 비용 없음

## 11. 리스크 및 트레이드오프 (Risks & Trade-offs)

- Google Trends API 승인 대기 중 → 네이버 데이터랩 단독 의존 리스크
- 상세 근거는 [02_ADR.md](./02_ADR.md) 참고
